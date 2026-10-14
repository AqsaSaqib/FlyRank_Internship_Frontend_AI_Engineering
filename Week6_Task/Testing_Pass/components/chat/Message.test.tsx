import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ComponentProps } from "react";

import {
  QUERY_STATES,
  SAVE_STATES,
  STATS_STATES,
  assistantMessage,
  malformedToolCall,
  reasoning,
  text,
  userMessage,
} from "@/test/fixtures";
import { Message } from "./Message";

type Props = ComponentProps<typeof Message>;

/** A finished, idle message unless a test says otherwise. */
function renderMessage(overrides: Partial<Props> & Pick<Props, "message">) {
  const props: Props = {
    isLast: true,
    live: false,
    stopped: false,
    busy: false,
    online: true,
    onStop: vi.fn(),
    onRetry: vi.fn(async () => {}),
    ...overrides,
  };
  render(
    <ol>
      <Message {...props} />
    </ol>,
  );
  return props;
}

describe("Message", () => {
  it("announces the user's own text as 'You said:'", () => {
    renderMessage({ message: userMessage("Fixed the auth bug today") });

    const item = screen.getByRole("listitem");
    expect(within(item).getByText("You said:")).toBeInTheDocument();
    expect(item).toHaveTextContent("You said: Fixed the auth bug today");
  });

  it("renders the assistant's markdown as real headings and lists", () => {
    renderMessage({
      message: assistantMessage(
        text("## Daily log\n\n- Fixed the **session bug**\n- Paired on caching\n\nWant me to save this?"),
      ),
    });

    expect(screen.getByText("Assistant said:")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Daily log" })).toBeInTheDocument();
    // The innermost list is the markdown one (the outer <ol> is the conversation).
    const bullets = within(screen.getAllByRole("list").at(-1)!).getAllByRole("listitem");
    expect(bullets.map((li) => li.textContent)).toEqual(["Fixed the session bug", "Paired on caching"]);
    // Rendered, not shown as raw markdown.
    expect(screen.queryByText(/\*\*|##/)).not.toBeInTheDocument();
    expect(screen.getByText("Want me to save this?")).toBeInTheDocument();
  });

  it("puts reasoning in a 'Thought process' disclosure that opens and closes from the keyboard", async () => {
    const user = userEvent.setup();
    renderMessage({
      message: assistantMessage(reasoning("They asked about last week, so I'll search."), text("Here you go.")),
    });

    const toggle = screen.getByRole("button", { name: "Thought process" });
    const thought = screen.getByText("They asked about last week, so I'll search.");
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(thought).not.toBeVisible();

    await user.tab();
    expect(toggle).toHaveFocus();

    await user.keyboard("{Enter}");
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(thought).toBeVisible();

    await user.keyboard(" ");
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(thought).not.toBeVisible();
  });

  it("renders each tool part as its own card", () => {
    renderMessage({
      message: assistantMessage(text("Let me look."), QUERY_STATES.done, STATS_STATES.done, SAVE_STATES.done),
    });

    const results = screen.getByRole("region", { name: "Found 3 entries" });
    expect(within(results).getByText("GitHub OAuth callback")).toBeInTheDocument();

    expect(screen.getByRole("region", { name: /^Your activity, / })).toBeInTheDocument();

    const saved = screen.getByRole("region", { name: "Saved to your DevLog" });
    expect(within(saved).getByText("Fixed the flaky contribution graph test")).toBeInTheDocument();
  });

  it("shows a friendly error card for a malformed tool call instead of crashing", () => {
    renderMessage({ message: assistantMessage(malformedToolCall()) });

    const card = screen.getByRole("region", { name: "The assistant's tool call was malformed" });
    const alert = within(card).getByRole("alert");
    expect(alert).toHaveTextContent("The assistant sent inputs the tool couldn't accept.");
    // What was attempted, so the failure isn't a mystery.
    expect(within(alert).getByText("queryLogs")).toBeInTheDocument();
  });

  it("explains an empty reply and offers Retry", async () => {
    const user = userEvent.setup();
    const { onRetry } = renderMessage({ message: assistantMessage() });

    expect(screen.getByRole("status")).toHaveTextContent("No reply this time");
    await user.click(screen.getByRole("button", { name: "Retry last response" }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("shows the thinking skeleton while waiting for the first token", () => {
    renderMessage({ message: assistantMessage(), live: true, busy: true });

    expect(screen.getByRole("status")).toHaveTextContent("Thinking…");
    expect(screen.queryByText("No reply this time")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Copy" })).not.toBeInTheDocument();
  });

  it("copies the reply text and confirms it", async () => {
    const user = userEvent.setup();
    renderMessage({ message: assistantMessage(reasoning("hidden"), text("Ship the **fix** today.")) });

    await user.click(screen.getByRole("button", { name: "Copy" }));

    expect(screen.getByRole("button", { name: "Copied" })).toBeInTheDocument();
    // Raw markdown of the text parts only, not the reasoning.
    await expect(navigator.clipboard.readText()).resolves.toBe("Ship the **fix** today.");
  });
});
