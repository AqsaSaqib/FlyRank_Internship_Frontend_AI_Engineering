"use client";

import { useState, type FormEvent } from "react";
import Button from "@/components/Button";

const inputClass =
  "mt-1.5 block w-full rounded-control border border-border bg-surface px-3 py-2 text-sm text-text placeholder:text-muted focus:border-primary focus:outline-2 focus:outline-primary/30";

type SettingsFormProps = {
  defaultGithubUser: string;
};

export default function SettingsForm({ defaultGithubUser }: SettingsFormProps) {
  const [githubUser, setGithubUser] = useState(defaultGithubUser);
  const [submitted, setSubmitted] = useState(false);

  // Phase 1: UI only. Persisting settings is wired up in a later phase.
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
  }

  const portfolioPath = `/u/${githubUser.trim() || "your-username"}`;

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <fieldset className="min-w-0 space-y-5">
        <legend className="text-base font-semibold text-text">Profile</legend>
        <label className="block text-sm font-medium text-text">
          Display name
          <input
            type="text"
            name="displayName"
            placeholder="Ada Lovelace"
            className={inputClass}
          />
        </label>
        <label className="block text-sm font-medium text-text">
          Bio
          <textarea
            name="bio"
            rows={3}
            placeholder="Frontend engineer learning Next.js in public."
            className={inputClass}
          />
        </label>
      </fieldset>

      <fieldset className="min-w-0 space-y-5">
        <legend className="text-base font-semibold text-text">GitHub</legend>
        <label className="block text-sm font-medium text-text">
          GitHub username
          <div className="mt-1.5 flex min-w-0 rounded-control border border-border bg-surface focus-within:border-primary">
            <span className="flex items-center border-r border-border px-3 text-sm text-muted">
              github.com/
            </span>
            <input
              type="text"
              name="githubUsername"
              value={githubUser}
              onChange={(event) => setGithubUser(event.target.value)}
              placeholder="octocat"
              autoComplete="off"
              className="min-w-0 flex-1 rounded-r-control bg-transparent px-3 py-2 text-sm text-text placeholder:text-muted focus:outline-none"
            />
          </div>
        </label>
        <p className="text-sm text-muted">
          Your public portfolio will live at{" "}
          <span className="break-all font-mono text-text">{portfolioPath}</span>
        </p>
      </fieldset>

      {submitted && (
        <p
          role="status"
          className="rounded-control border border-success/30 bg-success-soft px-4 py-3 text-sm text-text"
        >
          Settings look good! Saving arrives in Phase 2 — nothing was stored yet.
        </p>
      )}

      <div className="flex justify-end">
        <Button type="submit" className="w-full sm:w-auto">
          Save settings
        </Button>
      </div>
    </form>
  );
}
