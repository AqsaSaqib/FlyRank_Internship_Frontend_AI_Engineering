import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { controlledStream, errorResponse, sseResponse, textReply, type StreamChunk } from "@/test/fixtures";
import { Chat } from "./Chat";

/**
 * The whole chat (Chat + useDevLogChat + the AI SDK's useChat) against a
 * mocked /api/chat. `fetch` returns hand-written UI message streams in the
 * same SSE protocol the route sends, so every state can be asserted exactly:
 *
 *   PENDING   request sent, nothing streamed yet
 *   STREAMING some text arrived, the stream is still open
 *   DONE      the stream finished
 *   ERROR     mid-stream error part, HTTP 429, HTTP 500
 *   RETRY     Retry re-runs only the last response and recovers
 */

type SentRequest = { url: string; body: { messages: { id: string; role: string; parts: unknown[] }[]; trigger: string } };

/** Each call to /api/chat gets the next response. Returns the requests the chat sent. */
function mockChatApi(...responses: Response[]) {
  const requests: SentRequest[] = [];
  vi.spyOn(globalThis, "fetch").mockImplementation(async (input, init) => {
    requests.push({ url: String(input), body: JSON.parse(String(init?.body)) });
    const next = responses.shift();
    if (!next) throw new Error(`Unexpected request #${requests.length} to ${String(input)}`);
    return next;
  });
  return requests;
}

const PROMPT = "Help me write today's log entry";
const PARTIAL = "Here's a draft of today's entry: you fixed the logout bug and";
const RECOVERED = "Recovered: here is the full entry.";

async function renderChat() {
  const user = userEvent.setup();
  render(<Chat />);
  // The welcome screen appears once the saved conversation (none) has loaded.
  await screen.findByRole("heading", { name: "What did you work on today?" });
  return {
    user,
    input: screen.getByRole("textbox", { name: "Message the DevLog Assistant" }),
    log: screen.getByRole("log", { name: "Conversation" }),
  };
}

const deltas = (text: string): StreamChunk[] =>
  text.split(/(?<= )/).map((delta) => ({ type: "text-delta", id: "t1", delta }));

describe("Chat", () => {
  it("walks through pending → streaming → done, and posts the conversation to /api/chat", async () => {
    const stream = controlledStream();
    const requests = mockChatApi(stream.response);
    const { user, input, log } = await renderChat();

    await user.type(input, `${PROMPT}{Enter}`);

    // PENDING: the user's message, a thinking placeholder, and Stop instead of Send.
    expect(within(log).getByText(PROMPT)).toBeInTheDocument();
    expect(within(log).getByRole("status")).toHaveTextContent("Thinking…");
    expect(log).toHaveAttribute("aria-busy", "true");
    expect(screen.getByRole("button", { name: "Stop generating" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Send message" })).not.toBeInTheDocument();
    expect(input).toHaveValue("");

    // The request body: the whole conversation as UI messages.
    expect(requests).toHaveLength(1);
    expect(requests[0].url).toBe("/api/chat");
    expect(requests[0].body.trigger).toBe("submit-message");
    expect(requests[0].body.messages).toEqual([
      expect.objectContaining({ role: "user", parts: [{ type: "text", text: PROMPT }] }),
    ]);

    // STREAMING: partial text shows while the stream is still open.
    stream.send({ type: "start", messageId: "a1" }, { type: "text-start", id: "t1" }, ...deltas("Here's a draft "));
    await waitFor(() => expect(log).toHaveTextContent("Here's a draft"));
    expect(within(log).queryByText("Thinking…")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Stop generating" })).toBeInTheDocument();

    // DONE: the full reply, the composer is back, focus stayed in the composer.
    stream.send(...deltas("of today's entry."), { type: "text-end", id: "t1" }, { type: "finish" });
    stream.close();
    await screen.findByRole("button", { name: "Send message" });
    expect(log).toHaveTextContent("Here's a draft of today's entry.");
    expect(log).toHaveAttribute("aria-busy", "false");
    expect(within(log).getByRole("button", { name: "Copy" })).toBeInTheDocument();
    expect(input).toBeEnabled();
    expect(input).toHaveFocus();
  });

  it("Stop ends the reply, keeps what streamed, and returns focus to the composer", async () => {
    const stream = controlledStream();
    mockChatApi(stream.response);
    const { user, input, log } = await renderChat();

    await user.type(input, `${PROMPT}{Enter}`);
    stream.send({ type: "start", messageId: "a1" }, { type: "text-start", id: "t1" }, ...deltas("Partial answer "));
    await waitFor(() => expect(log).toHaveTextContent("Partial answer"));

    await user.click(screen.getByRole("button", { name: "Stop generating" }));

    expect(await within(log).findByText("Stopped")).toBeInTheDocument();
    expect(log).toHaveTextContent("Partial answer");
    expect(input).toHaveFocus();
    expect(screen.queryByRole("button", { name: "Stop generating" })).not.toBeInTheDocument();
  });

  it("ERROR mid-stream keeps the partial text and shows an alert with Retry; RETRY recovers", async () => {
    const failing = controlledStream();
    const requests = mockChatApi(failing.response, sseResponse(textReply(RECOVERED)));
    const { user, input, log } = await renderChat();

    await user.type(input, `${PROMPT}{Enter}`);
    failing.send(
      { type: "start", messageId: "a-failed" },
      { type: "text-start", id: "t1" },
      ...deltas(PARTIAL),
      { type: "error", errorText: JSON.stringify({ error: "Something went wrong on our side.", code: "unknown" }) },
    );

    const alert = await within(log).findByRole("alert");
    expect(alert).toHaveTextContent("Something went wrong");
    expect(alert).toHaveTextContent("The partial reply above is kept.");
    expect(log).toHaveTextContent(PARTIAL);
    expect(within(log).getByText("Incomplete response")).toBeInTheDocument();

    // RETRY: re-runs only the last response, with the same conversation.
    await user.click(within(log).getByRole("button", { name: "Retry last response" }));

    await waitFor(() => expect(log).toHaveTextContent(RECOVERED));
    expect(within(log).queryByRole("alert")).not.toBeInTheDocument();
    expect(log).not.toHaveTextContent(PARTIAL);
    expect(within(log).getAllByText(PROMPT)).toHaveLength(1);

    expect(requests).toHaveLength(2);
    expect(requests[1].body.trigger).toBe("regenerate-message");
    expect(requests[1].body.messages.map((m) => [m.id, m.role])).toEqual(
      requests[0].body.messages.map((m) => [m.id, m.role]),
    );
  });

  it("HTTP 429 shows a rate-limit message and unlocks Retry when the countdown ends", async () => {
    const requests = mockChatApi(
      errorResponse(429, { error: "Too many requests right now.", code: "rate_limited", retryAfter: 1 }),
      sseResponse(textReply(RECOVERED)),
    );
    const { user, input, log } = await renderChat();

    await user.type(input, "Hello{Enter}");

    const alert = await within(log).findByRole("alert");
    expect(alert).toHaveTextContent("Too many requests");
    expect(alert).toHaveTextContent("Try again in");
    const retry = within(log).getByRole("button", { name: /Retry last response/ });
    expect(retry).toHaveAttribute("aria-disabled", "true");

    await waitFor(() => expect(retry).toHaveAttribute("aria-disabled", "false"), { timeout: 3_000 });
    expect(alert).toHaveTextContent("You can try again now.");

    await user.click(retry);
    await waitFor(() => expect(log).toHaveTextContent(RECOVERED));
    expect(requests).toHaveLength(2);
  });

  it("HTTP 500 shows a human message (never the raw response) and Retry", async () => {
    mockChatApi(
      errorResponse(500, { error: "Something went wrong on our side.", code: "unknown" }),
      sseResponse(textReply(RECOVERED)),
    );
    const { user, input, log } = await renderChat();

    await user.type(input, "Hello{Enter}");

    const alert = await within(log).findByRole("alert");
    expect(alert).toHaveTextContent("Something went wrong");
    expect(alert).toHaveTextContent("The reply couldn't be finished.");
    expect(alert).not.toHaveTextContent(/"code"|unknown|500/);
    // Nothing streamed, so there's no partial reply to keep.
    expect(alert).not.toHaveTextContent("partial reply");

    const retry = within(log).getByRole("button", { name: "Retry last response" });
    expect(retry).toHaveAttribute("aria-disabled", "false");
    await user.click(retry);
    await waitFor(() => expect(log).toHaveTextContent(RECOVERED));
  });

  it("an example prompt fills the composer without sending", async () => {
    const requests = mockChatApi();
    const { user, input } = await renderChat();

    const examples = screen.getByRole("list", { name: "Example prompts" });
    await user.click(within(examples).getByRole("button", { name: /Plan tomorrow/ }));

    expect(input).toHaveValue("What should I focus on tomorrow?");
    expect(input).toHaveFocus();
    expect(requests).toHaveLength(0);
  });
});
