// @vitest-environment node
import { blockedAiCalls } from "@/test/ai-safety-net";
import { POST } from "./route";

/**
 * The route handler, called directly with a Request (no server). The
 * setup file removed every API key and set CHAT_PROVIDER=mock, so replies
 * come from the scripted mock model in lib/ai/mock.ts.
 */

const user = (text: string, id = "u1") => ({ id, role: "user", parts: [{ type: "text", text }] });

function chatRequest(body: unknown) {
  return new Request("http://localhost/api/chat", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

/** The SSE body as a list of UI message chunks. */
async function readChunks(response: Response) {
  const text = await response.text();
  return text
    .split("\n\n")
    .map((event) => event.replace(/^data: /, "").trim())
    .filter((data) => data && data !== "[DONE]")
    .map((data) => JSON.parse(data) as { type: string; delta?: string; [key: string]: unknown });
}

// The mock model streams in real time (a few seconds per reply).
describe("POST /api/chat", { timeout: 15_000 }, () => {
  describe("rejects bad requests with 400 and a JSON error", () => {
    it.each([
      ["a body that isn't JSON", "{not json", "invalid_request", "The request body isn't valid JSON."],
      ["no messages", { messages: [] }, "invalid_request", undefined],
      ["the wrong shape", { messages: "hello" }, "invalid_request", undefined],
      ["a message that isn't a UI message", { messages: [{ role: "user", content: "hi" }] }, "invalid_request", undefined],
      ["a whitespace-only message", { messages: [user("   ")] }, "empty_input", "Type a message first."],
      ["a message over the limit", { messages: [user("a".repeat(8_001))] }, "too_long", "Messages are limited to 8,000 characters."],
    ])("%s", async (_name, body, code, error) => {
      const response = await POST(chatRequest(body));

      expect(response.status).toBe(400);
      expect(response.headers.get("content-type")).toMatch(/application\/json/);
      const json = await response.json();
      expect(json).toMatchObject({ code, error: expect.any(String) });
      if (error) expect(json.error).toBe(error);
    });
  });

  it("streams a reply from the mock model as a UI message stream", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");

    const response = await POST(chatRequest({ messages: [user("What should I focus on tomorrow?")] }));

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toMatch(/text\/event-stream/);
    expect(response.headers.get("x-vercel-ai-ui-message-stream")).toBe("v1");

    const chunks = await readChunks(response);
    const types = chunks.map((c) => c.type);
    expect(types[0]).toBe("start");
    expect(types).toContain("reasoning-delta");
    expect(types.at(-1)).toBe("finish");
    expect(chunks[0]).toMatchObject({ messageMetadata: { model: "mock" } });

    const reply = chunks
      .filter((c) => c.type === "text-delta")
      .map((c) => c.delta)
      .join("");
    expect(reply).toMatch(/^Based on your recent entries/);
    expect(reply).toContain("Mock reply");

    // The mock model never touches the network.
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("runs a tool on the server and streams its typed result", async () => {
    const response = await POST(chatRequest({ messages: [user("Show my react entries")] }));
    const chunks = await readChunks(response);

    const call = chunks.find((c) => c.type === "tool-input-available");
    expect(call).toMatchObject({ toolName: "queryLogs", input: expect.objectContaining({ tag: "react" }) });
    const result = chunks.find((c) => c.type === "tool-output-available");
    expect(result).toMatchObject({ toolCallId: call?.toolCallId, output: { total: expect.any(Number) } });
    // Second step: the model summarizes the result.
    expect(chunks.filter((c) => c.type === "text-delta").map((c) => c.delta).join("")).toMatch(/You logged \*\*\d+\*\*/);
  });

  it("never calls a real AI provider: the fetch safety net is in place and untouched", async () => {
    expect(process.env.CHAT_PROVIDER).toBe("mock");
    expect(process.env.ANTHROPIC_API_KEY).toBeUndefined();
    expect(process.env.GEMINI_API_KEY).toBeUndefined();

    // The net is the global fetch, and it really blocks both providers.
    expect(globalThis.fetch).toHaveProperty("isAiSafetyNet", true);
    await expect(fetch("https://api.anthropic.com/v1/messages", { method: "POST" })).rejects.toThrow(
      "Real AI API called in a test",
    );
    await expect(
      fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini:streamGenerateContent"),
    ).rejects.toThrow("Real AI API called in a test");
    expect(blockedAiCalls).toHaveLength(2);

    // A full chat turn adds nothing to the blocked list: no provider was attempted.
    blockedAiCalls.length = 0;
    const response = await POST(chatRequest({ messages: [user("What did I work on last week?")] }));
    await response.text();
    expect(blockedAiCalls).toEqual([]);
  });
});
