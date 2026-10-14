import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ChatStatus } from "ai";

import { MAX_MESSAGE_CHARS } from "@/lib/chat/limits";
import { Composer } from "./Composer";

/** The Composer is the app's form: validation, keyboard shortcuts and busy states. */
function renderComposer({ status = "ready" as ChatStatus, offline = false, accept = true } = {}) {
  const onSend = vi.fn<(text: string) => boolean>(() => accept);
  const onStop = vi.fn();
  const user = userEvent.setup();
  const view = render(<Composer status={status} onSend={onSend} onStop={onStop} offline={offline} />);
  return {
    user,
    onSend,
    onStop,
    rerender: (next: ChatStatus) =>
      view.rerender(<Composer status={next} onSend={onSend} onStop={onStop} offline={offline} />),
    input: screen.getByRole("textbox", { name: "Message the DevLog Assistant" }),
  };
}

describe("Composer", () => {
  it("can't send an empty or whitespace-only message", async () => {
    const { user, input, onSend } = renderComposer();
    const send = screen.getByRole("button", { name: "Send message" });

    expect(send).toBeDisabled();

    await user.type(input, "   ");
    expect(send).toBeDisabled();
    await user.type(input, "{Enter}");
    expect(onSend).not.toHaveBeenCalled();

    await user.type(input, "fixed it");
    expect(send).toBeEnabled();
  });

  it("sends on Enter and clears the input", async () => {
    const { user, input, onSend } = renderComposer();

    await user.type(input, "Fixed the flaky test{Enter}");

    expect(onSend).toHaveBeenCalledExactlyOnceWith("Fixed the flaky test");
    expect(input).toHaveValue("");
  });

  it("sends with the button too", async () => {
    const { user, input, onSend } = renderComposer();

    await user.type(input, "Chart my hours");
    await user.click(screen.getByRole("button", { name: "Send message" }));

    expect(onSend).toHaveBeenCalledExactlyOnceWith("Chart my hours");
    expect(input).toHaveValue("");
  });

  it("Shift+Enter adds a new line instead of sending", async () => {
    const { user, input, onSend } = renderComposer();

    await user.type(input, "Done:{Shift>}{Enter}{/Shift}- auth fix");

    expect(input).toHaveValue("Done:\n- auth fix");
    expect(onSend).not.toHaveBeenCalled();
  });

  it("keeps the text when the chat refuses the send", async () => {
    const { user, input, onSend } = renderComposer({ accept: false });

    await user.type(input, "Not yet{Enter}");

    expect(onSend).toHaveBeenCalledOnce();
    expect(input).toHaveValue("Not yet");
  });

  it("lets you type while the AI replies but blocks sending, and Escape stops", async () => {
    const { user, input, onSend, onStop, rerender } = renderComposer({ status: "streaming" });

    expect(screen.queryByRole("button", { name: "Send message" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Stop generating" })).toBeInTheDocument();

    await user.type(input, "Next question{Enter}");
    expect(input).toHaveValue("Next question");
    expect(onSend).not.toHaveBeenCalled();

    await user.keyboard("{Escape}");
    expect(onStop).toHaveBeenCalledOnce();

    // The reply finished: the drafted message can go now.
    rerender("ready");
    await user.type(input, "{Enter}");
    expect(onSend).toHaveBeenCalledExactlyOnceWith("Next question");
  });

  it("the Stop button stops a pending reply", async () => {
    const { user, onStop } = renderComposer({ status: "submitted" });

    await user.click(screen.getByRole("button", { name: "Stop generating" }));

    expect(onStop).toHaveBeenCalledOnce();
  });

  it("blocks sending while offline but keeps the draft", async () => {
    const { user, input, onSend } = renderComposer({ offline: true });

    await user.type(input, "Draft{Enter}");

    expect(screen.getByRole("button", { name: "Send message (unavailable while offline)" })).toBeDisabled();
    expect(onSend).not.toHaveBeenCalled();
    expect(input).toHaveValue("Draft");
  });

  it(`flags a message over ${MAX_MESSAGE_CHARS} characters and blocks sending until it's shortened`, async () => {
    const { user, input, onSend } = renderComposer();

    expect(input).toHaveAttribute("aria-invalid", "false");
    expect(input).not.toHaveAccessibleDescription();

    // Paste (not type) a long message: one change event instead of thousands.
    await user.click(input);
    await user.paste("a".repeat(MAX_MESSAGE_CHARS + 1));

    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveAccessibleDescription(/Message is too long: 8,001 of 8,000 characters/);
    expect(screen.getByRole("alert")).toHaveTextContent("Shorten it to send.");
    expect(screen.getByRole("button", { name: "Send message" })).toBeDisabled();
    await user.keyboard("{Enter}");
    expect(onSend).not.toHaveBeenCalled();

    // Back at the limit: valid again.
    await user.keyboard("{Backspace}");
    expect(input).toHaveAttribute("aria-invalid", "false");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Send message" })).toBeEnabled();
  });
});
