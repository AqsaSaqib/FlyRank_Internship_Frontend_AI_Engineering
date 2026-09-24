import type { Metadata } from "next";
import Image from "next/image";
import { connection } from "next/server";
import Card from "@/components/Card";
import Container from "@/components/Container";
import PageHeader from "@/components/PageHeader";

export const metadata: Metadata = {
  title: "Health check",
};

type GitHubUser = {
  login: string;
  name: string | null;
  avatar_url: string;
  html_url: string;
  public_repos: number;
  followers: number;
};

type HealthResult =
  | { ok: true; user: GitHubUser; status: number; durationMs: number }
  | { ok: false; error: string; status?: number; durationMs: number };

async function checkGitHub(): Promise<HealthResult> {
  const apiUrl = process.env.GITHUB_API_URL;
  const username = process.env.NEXT_PUBLIC_DEFAULT_GITHUB_USER;

  if (!apiUrl || !username) {
    return {
      ok: false,
      durationMs: 0,
      error:
        "Missing configuration. Set GITHUB_API_URL and NEXT_PUBLIC_DEFAULT_GITHUB_USER in your environment variables.",
    };
  }

  const url = `${apiUrl.replace(/\/+$/, "")}/users/${encodeURIComponent(username)}`;
  const start = performance.now();

  try {
    const res = await fetch(url, {
      cache: "no-store",
      headers: { Accept: "application/vnd.github+json" },
      signal: AbortSignal.timeout(8000),
    });
    const durationMs = Math.round(performance.now() - start);

    if (!res.ok) {
      const reason =
        res.status === 404
          ? `GitHub user "${username}" was not found.`
          : res.status === 403
            ? "GitHub API rate limit reached. Please try again later."
            : `GitHub responded with ${res.status} ${res.statusText}.`;
      return { ok: false, status: res.status, durationMs, error: reason };
    }

    const user = (await res.json()) as GitHubUser;
    return { ok: true, status: res.status, durationMs, user };
  } catch (error) {
    const timedOut = error instanceof DOMException && error.name === "TimeoutError";
    return {
      ok: false,
      durationMs: Math.round(performance.now() - start),
      error: timedOut
        ? "The GitHub API took too long to respond (over 8 seconds)."
        : "Could not reach the GitHub API. Check your network connection or GITHUB_API_URL.",
    };
  }
}

export default async function HealthPage() {
  // Always render at request time so the check reflects live status.
  await connection();

  const result = await checkGitHub();
  const checkedAt = new Date().toISOString();

  return (
    <Container width="narrow">
      <PageHeader
        eyebrow="System status"
        title="Health check"
        description="Live request to the GitHub API, fetched fresh on every visit."
      />

      <Card>
        <dl className="grid gap-4 sm:grid-cols-3">
          <div>
            <dt className="text-xs uppercase tracking-wide text-muted">Status</dt>
            <dd className="mt-1">
              <span
                className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-semibold ${
                  result.ok
                    ? "bg-success-soft text-success"
                    : "bg-danger-soft text-danger"
                }`}
              >
                <span
                  aria-hidden="true"
                  className={`h-2 w-2 rounded-full ${result.ok ? "bg-success" : "bg-danger"}`}
                />
                {result.ok ? "OK" : "Error"}
                {result.status !== undefined && ` · ${result.status}`}
              </span>
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-muted">
              Response time
            </dt>
            <dd className="mt-1 text-lg font-semibold text-text">
              {result.durationMs} ms
            </dd>
          </div>
          <div className="min-w-0">
            <dt className="text-xs uppercase tracking-wide text-muted">
              Checked at
            </dt>
            <dd className="mt-1 break-all font-mono text-sm text-text">
              <time dateTime={checkedAt}>{checkedAt}</time>
            </dd>
          </div>
        </dl>
      </Card>

      <div className="mt-6">
        {result.ok ? (
          <Card title="GitHub profile">
            <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-start">
              <Image
                src={result.user.avatar_url}
                alt={`${result.user.login}'s avatar`}
                width={96}
                height={96}
                className="h-24 w-24 rounded-full border border-border"
              />
              <div className="w-full min-w-0 text-center sm:text-left">
                <p className="break-words text-xl font-semibold text-text">
                  {result.user.name ?? result.user.login}
                </p>
                <a
                  href={result.user.html_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="break-all text-sm text-primary hover:underline"
                >
                  @{result.user.login}
                </a>
                <dl className="mt-4 grid grid-cols-2 gap-3">
                  <div className="rounded-control bg-surface-muted p-3">
                    <dt className="text-xs text-muted">Public repos</dt>
                    <dd className="text-xl font-semibold text-text">
                      {result.user.public_repos}
                    </dd>
                  </div>
                  <div className="rounded-control bg-surface-muted p-3">
                    <dt className="text-xs text-muted">Followers</dt>
                    <dd className="text-xl font-semibold text-text">
                      {result.user.followers}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>
          </Card>
        ) : (
          <div
            role="alert"
            className="rounded-card border border-danger/30 bg-danger-soft p-5 sm:p-6"
          >
            <h2 className="font-semibold text-danger">
              We couldn&apos;t load GitHub data
            </h2>
            <p className="mt-1 text-sm text-text">{result.error}</p>
            <p className="mt-3 text-sm text-muted">
              The rest of DevLog is still working. Refresh this page to run the
              check again.
            </p>
          </div>
        )}
      </div>
    </Container>
  );
}
