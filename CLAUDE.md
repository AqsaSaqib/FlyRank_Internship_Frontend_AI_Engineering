# AI-assisted development — FlyRank AI internship

Instructions for humans and coding assistants working in this repository.

## Project purpose

This is **Aqsa Saqib’s** repository for the **FlyRank AI internship** ([GitHub](https://github.com/AqsaSaqib/FlyRank_Internship_Frontend_AI_Engineering)). It will hold assigned work, documentation, and experiments.

Do not invent product names, APIs, intern requirements, or a technology stack that is not already in the repo or clearly stated by Aqsa.

## Technology-stack conventions

- This repo is prepared for **Python** and **Node.js / TypeScript**. Use only the languages and tools that are actually present, or that Aqsa explicitly chooses.
- Prefer the existing package manager, linter, formatter, and test runner when they exist (`package-lock.json` / `pnpm-lock.yaml` / `yarn.lock` / `poetry.lock` / `uv.lock` stay committed).
- Do not add new dependencies unless they are required for the current task and Aqsa agrees.
- Do not install packages unless asked.
- Until application code exists, keep files generic and do not scaffold a full app.

## Coding conventions

- Write clear, readable code. Prefer simple solutions over clever ones.
- Match existing style when application code exists (naming, formatting, file layout).
- Use meaningful names. Avoid unexplained abbreviations.
- Keep functions and components focused. Split files when they become hard to follow.
- Comment only where intent is not obvious from the code.
- Do not leave debug `console.log` / `print` statements in finished work.

## File / folder organization

- Keep the repo root for project-level files (`README.md`, `LICENSE`, `.gitignore`, `CLAUDE.md`).
- Add source, tests, and docs in dedicated folders when the first project starts (for example `src/`, `tests/`, `docs/`). Follow whatever layout Aqsa or FlyRank specifies.
- Do not dump unrelated files in the root.
- Do not create extra markdown, configs, or boilerplate unless the task needs them.
- When behavior or setup changes, update `README.md` (and `.env.example` if environment variables change).

## Git / GitHub conventions

- Work on a dedicated branch for non-trivial tasks; keep `main` stable when possible.
- Do not commit unless Aqsa asks. They will commit and push themselves.
- Never force-push to `main` / `master`.
- Do not change git config.
- Do not commit secrets, credentials, `.env` files, `node_modules/`, or virtualenvs (see Security and `.gitignore`).
- Keep PRs small and focused on one task when GitHub is in use.
- Before suggesting a commit, show `git status` / `git diff` so Aqsa can review.

## Commit message conventions

When Aqsa asks for a commit message, use a short imperative subject (about 50–72 characters):

- `Add internship README, license, and ignore rules`
- `Fix failing unit tests for assigned task`
- `Update README with confirmed tech stack`

Explain *why* in the body only if the change is not obvious. Do not use vague messages like `update` or `wip`.

## Testing expectations

- Add or update tests when the project has a test setup and the change is testable.
- Do not invent a full test framework if none exists yet.
- Verify behavior before considering a task done (run existing tests, or exercise the UI/flow when that is the work).
- Do not skip failing tests or weaken assertions to make CI pass.

## AI coding-assistant rules

- Inspect the repo before editing. Do not overwrite existing files blindly.
- Follow this file and the current task. Prefer the user’s instructions over generic templates.
- Do not modify application/source code unless the task requires it.
- Do not commit, push, or open PRs unless asked.
- Do not install packages, run destructive git commands, or change unrelated files.
- If something is unknown, use a placeholder or ask — do not fabricate FlyRank internals.
- After a task, briefly report what changed and any decisions that need review.

## Security and secret-management rules

- Never commit API keys, tokens, passwords, private keys, or `.env` files.
- Use `.env.example` (no real values) to document required variables.
- Do not hardcode secrets in source, comments, notebooks, or README files.
- Do not paste secrets into chat logs or commit messages.
- Treat `credentials.json`, service-account files, and PEM/key files as secret.
- If a secret is committed by mistake, rotate it; removing it from git history later is not enough.

## Rules to avoid unnecessary changes

- Change only files required for the current task.
- Do not drive-by refactors, reformat entire files, or “improve” unrelated code.
- Do not add unused files, folders, or dependencies.
- Do not rewrite working code for style alone unless asked.
- If a requested file already exists and is adequate, leave it unchanged.
