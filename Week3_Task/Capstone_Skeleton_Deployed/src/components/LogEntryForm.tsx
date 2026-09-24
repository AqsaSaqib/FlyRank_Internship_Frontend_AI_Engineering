"use client";

import { useState, type FormEvent } from "react";
import Button from "@/components/Button";

const inputClass =
  "mt-1.5 block w-full rounded-control border border-border bg-surface px-3 py-2 text-sm text-text placeholder:text-muted focus:border-primary focus:outline-2 focus:outline-primary/30";

export default function LogEntryForm() {
  const [submitted, setSubmitted] = useState(false);

  // Phase 1: UI only. Saving is wired up in a later phase.
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="block text-sm font-medium text-text">
          Date
          <input type="date" name="date" required className={inputClass} />
        </label>
        <label className="block text-sm font-medium text-text">
          Mood
          <select name="mood" defaultValue="Steady" className={inputClass}>
            <option>Productive</option>
            <option>Steady</option>
            <option>Blocked</option>
          </select>
        </label>
      </div>

      <label className="block text-sm font-medium text-text">
        Title
        <input
          type="text"
          name="title"
          required
          placeholder="What did you work on today?"
          className={inputClass}
        />
      </label>

      <label className="block text-sm font-medium text-text">
        Notes
        <textarea
          name="content"
          rows={6}
          placeholder="Wins, blockers, things you learned..."
          className={inputClass}
        />
      </label>

      <label className="block text-sm font-medium text-text">
        Tags
        <input
          type="text"
          name="tags"
          placeholder="nextjs, tailwind, a11y"
          className={inputClass}
        />
        <span className="mt-1 block text-xs font-normal text-muted">
          Separate tags with commas.
        </span>
      </label>

      {submitted && (
        <p
          role="status"
          className="rounded-control border border-success/30 bg-success-soft px-4 py-3 text-sm text-text"
        >
          Looks good! Saving entries arrives in Phase 2 — nothing was stored yet.
        </p>
      )}

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button href="/logs" variant="outline">
          Cancel
        </Button>
        <Button type="submit">Save entry</Button>
      </div>
    </form>
  );
}
