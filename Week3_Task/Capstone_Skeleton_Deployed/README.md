# DevLog

A developer progress journal. Connect your GitHub username, see your recent commits, write daily log entries, generate weekly progress reports, and share a public portfolio page.

> **Status:** Phase 1 — Foundations. Every screen is a routed placeholder with sample data. The `/health` page fetches live data from the GitHub API.

**Live preview:** https://your-devlog-app.vercel.app _(replace after deploying)_

## Features

- **Responsive layout.** Sticky navbar with active-link highlighting, a hamburger menu on mobile, and a footer. Tested at 375px and 1280px with no horizontal scroll.
- **Light and dark themes.** A toggle in the navbar switches themes. The first visit follows the system setting, and the choice is saved in the browser and applied before the page paints, so there is no flash of the wrong theme.
- **Contribution heatmap.** A GitHub-style activity graph on the landing page and dashboard (placeholder data).
- **Live health check.** `/health` calls the GitHub API on every request and shows status, response time, a timestamp, and profile details. If the request fails or times out, it shows a friendly error instead of crashing.
- **App-wide states.** Root `loading.tsx`, `error.tsx` with a retry button, and a custom 404 page.

## Screens

| Route | Screen | Notes |
| --- | --- | --- |
| `/` | Landing page | Hero with product preview, features, how it works, call to action |
| `/login` | Login | Placeholder, authentication arrives in Phase 2 |
| `/dashboard` | Dashboard | Stat cards, contribution heatmap, streak, recent activity (placeholder data) |
| `/logs` | Daily logs | List of log entries with mood and tags |
| `/logs/new` | New log entry | Form UI only, no saving yet |
| `/reports` | Weekly reports | List of weekly reports |
| `/u/[username]` | Public portfolio | Dynamic route |
| `/settings` | Settings | Profile and GitHub username form |
| `/health` | Health check | Live GitHub API fetch, rendered fresh on every request |
| any unknown URL | 404 | Custom `not-found.tsx` |

## Tech stack

- [Next.js](https://nextjs.org) 16 (App Router, Turbopack) with TypeScript
- React 19. Server Components by default; `"use client"` only for the mobile menu, active nav links, the theme toggle, and form inputs
- Tailwind CSS v4 with design tokens defined via `@theme` in `src/app/globals.css`
- Geist and Geist Mono fonts via `next/font`
- Inline SVG icons (no icon library)
- ESLint (`eslint-config-next`)
- Deployed on [Vercel](https://vercel.com)

## Design system

All colors, fonts, radii, and shadows are tokens in `src/app/globals.css`. Each token becomes a Tailwind utility (for example `--color-primary` → `bg-primary`, `--radius-card` → `rounded-card`). Dark mode redefines the same tokens under `[data-theme="dark"]`, so components don't need separate dark styles.

| Token | Light | Dark | Used for |
| --- | --- | --- | --- |
| `primary` | `#047857` emerald | `#34d399` | Buttons, active nav, heatmap |
| `secondary` | `#0369a1` blue | `#38bdf8` | Headline gradient, log badges |
| `accent` | `#b45309` amber | `#fbbf24` | Streaks, report badges |
| `success` / `danger` | green / red | green / red | Health status, form messages |
| `background` / `surface` | `#fafafa` / `#ffffff` | `#09090b` / `#111113` | Page and card backgrounds |
| `text` / `muted` / `border` | zinc scale | zinc scale | Text and dividers |
| `font-sans` / `font-mono` | Geist / Geist Mono | same | Typography |
| `radius-control` / `radius-card` | `0.625rem` / `1rem` | same | Buttons, inputs / cards |

## Project structure

```
src/
  app/
    layout.tsx          root layout: navbar, footer, theme script
    globals.css         design tokens and dark theme
    page.tsx            landing page
    loading.tsx         app-wide loading state
    error.tsx           app-wide error boundary
    not-found.tsx       custom 404
    login/ dashboard/ logs/ logs/new/ reports/ settings/ health/ u/[username]/
  components/
    Navbar, MobileMenu, NavLink, ThemeToggle, Footer, Logo
    PageHeader, Card, Button, Container, Icon, ContributionGraph
    LogEntryForm, SettingsForm
  lib/
    nav.ts              navigation links and active-route helper
    theme.ts            theme storage key and pre-paint script
    placeholder-data.ts sample stats, activity, logs, and reports
```

## Local setup

Requirements: Node.js 20.9 or newer and npm.

```bash
git clone https://github.com/<your-username>/<your-repo>.git
cd <your-repo>/Week3_Task/Capstone_Skeleton_Deployed
npm install
cp .env.example .env.local   # then fill in the values
npm run dev
```

Open the local URL printed in the terminal (usually http://localhost:3000).

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the development server |
| `npm run build` | Create a production build |
| `npm run start` | Serve the production build |
| `npm run lint` | Run ESLint |

The Next.js dev indicator badge is turned off (`devIndicators: false` in `next.config.ts`). Build and runtime errors still show in an overlay during development.

## Environment variables

Copy `.env.example` to `.env.local`. `.env.local` is gitignored and must never be committed.

| Variable | Required | Example | Description |
| --- | --- | --- | --- |
| `GITHUB_API_URL` | Yes | `https://api.github.com` | Base URL of the GitHub REST API, used by `/health` |
| `NEXT_PUBLIC_DEFAULT_GITHUB_USER` | Yes | `octocat` | GitHub username shown on `/health` and prefilled on `/settings` |

No API keys or secrets are needed in Phase 1. The GitHub API is called without authentication, which is limited to 60 requests per hour per IP address.

## Deploying to Vercel

1. Push the project to GitHub.
2. Go to [vercel.com/new](https://vercel.com/new) and import the repository.
3. Set **Root Directory** to `Week3_Task/Capstone_Skeleton_Deployed`, because the app lives in a subfolder of the repository. The framework preset (**Next.js**) is detected automatically.
4. Under **Environment Variables**, add `GITHUB_API_URL` and `NEXT_PUBLIC_DEFAULT_GITHUB_USER` for Production, Preview, and Development.
5. Click **Deploy**.
6. Open the deployment, check that `/health` shows **OK**, and paste the URL into the **Live preview** line above.

Every push to `main` triggers a new production deployment, and every pull request gets a preview deployment. After changing a `NEXT_PUBLIC_` variable, redeploy, because its value is inlined at build time.

## Roadmap

- **Phase 2:** GitHub authentication, saving log entries and settings
- **Later:** real commit data, generated weekly reports, a published portfolio page
