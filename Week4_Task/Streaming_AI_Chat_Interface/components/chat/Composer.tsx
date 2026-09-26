"use client";

import { useImperativeHandle, useLayoutEffect, useRef, useState, type Ref } from "react";

import type { ChatStatus } from "@/lib/chat/use-chat-stream";
import { Icon } from "./icons";

const MAX_HEIGHT = 200;

export type ComposerHandle = { focus: () => void; setValue: (value: string) => void };

type Props = {
  status: ChatStatus;
  onSend: (text: string) => boolean;
  onStop: () => void;
  ref?: Ref<ComposerHandle>;
};

/**
 * Message input with a send/stop button.
 *
 * The textarea stays editable while a reply streams, so you can draft the next
 * message; only sending is blocked until the reply finishes or is stopped.
 *
 * Button states: disabled (empty) → ready (send) → submitted (stop + spinner
 * ring, waiting for the first token) → streaming (stop) → back to ready.
 */
export function Composer({ status, onSend, onStop, ref }: Props) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const busy = status !== "ready";
  const canSend = !busy && value.trim().length > 0;

  useImperativeHandle(ref, () => ({
    focus: () => textareaRef.current?.focus(),
    setValue: (v) => {
      setValue(v);
      textareaRef.current?.focus();
    },
  }));

  // Grow with the content up to MAX_HEIGHT, then scroll inside.
  useLayoutEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, MAX_HEIGHT)}px`;
  }, [value]);

  const submit = () => {
    if (!canSend) return;
    if (onSend(value)) setValue("");
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (busy) onStop();
        else submit();
      }}
      className="flex items-end gap-2 rounded-2xl border border-border bg-card p-2 shadow-sm transition-colors focus-within:border-primary/60"
    >
      <label htmlFor="chat-input" className="sr-only">
        Message the DevLog Assistant
      </label>
      <textarea
        id="chat-input"
        ref={textareaRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
            e.preventDefault();
            submit();
          }
          if (e.key === "Escape" && busy) {
            e.preventDefault();
            onStop();
          }
        }}
        rows={1}
        placeholder={busy ? "Esc to stop · keep typing your next message" : "Paste your notes or ask anything…"}
        enterKeyHint="send"
        autoComplete="off"
        // 16px text so iOS doesn't zoom the page when the input is focused.
        className="max-h-[200px] min-h-10 flex-1 resize-none bg-transparent px-2 py-2 text-base leading-6 outline-none placeholder:text-muted-foreground sm:text-[15px]"
      />
      {busy ? (
        <button
          type="submit"
          aria-label="Stop generating"
          title="Stop generating (Esc)"
          className="relative grid size-10 shrink-0 place-items-center rounded-xl bg-foreground text-background transition-transform active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          {status === "submitted" && (
            <span
              aria-hidden="true"
              className="absolute inset-0.5 animate-spin rounded-[10px] border-2 border-background/25 border-t-background/90"
            />
          )}
          <Icon name="stop" className="size-5" />
        </button>
      ) : (
        <button
          type="submit"
          disabled={!canSend}
          aria-label="Send message"
          title="Send (Enter)"
          className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground transition-[transform,background-color,opacity] hover:bg-primary-hover active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground"
        >
          <Icon name="send" className="size-5" />
        </button>
      )}
    </form>
  );
}
