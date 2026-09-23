# 📚 BookNest

A book tracker web app built with **React, TypeScript, and the MVVM architecture**. Search books from Open Library, view their details, and keep a personal bookshelf with your reading status.

**Live demo:** _Add Vercel link here_
**Author:** Aqsa Saqib ([@AqsaSaqib](https://github.com/AqsaSaqib))

> Built for an internship assignment: *Build a React application independently using AI as a development assistant.*

---

## ✨ Features

- **Search books** by title, author, or keyword using the Open Library API
- Clear **loading, error, empty, and welcome states** on the search page
- **Book details page** with cover, authors, category, publish year, page count, and description
- **Personal bookshelf** saved in the browser with localStorage (no sign-up needed)
- Three **reading statuses**: Want to Read, Reading, Finished
- **Filter tabs** with counts, plus reading stats (total, reading, finished)
- Change a book's status or **remove it** (with confirmation)
- **Live shelf count** in the header that updates instantly
- **Not Found page** for unknown URLs
- **Responsive design** for desktop and mobile, with keyboard and screen-reader support

---

## 🛠 Tech Stack

| Technology | Purpose |
|---|---|
| React + Vite | UI framework and build tool |
| TypeScript (strict mode) | Type safety, no `any` types |
| React Router | Page routing |
| Open Library API | Free book data (no API key needed) |
| localStorage | Saving the bookshelf in the browser |
| Plain CSS + CSS variables | Styling and theming |

---

## 📁 Project Structure

```
src/
├── components/     Reusable presentational UI (Header, BookCard, StatusBadge)
├── context/        BookshelfContext – shares shelf state across pages
├── pages/
│   ├── Home/         Search page (Model, ViewModel, View)
│   ├── BookDetails/  Book details page (Model, ViewModel, View)
│   ├── Bookshelf/    Saved books page (Model, ViewModel, View)
│   └── NotFound/     404 page
├── services/       The only place that calls the API or localStorage
├── types/          TypeScript interfaces (API responses, Book, ShelfBook)
└── utils/          Helpers for mapping API data and building cover URLs
```

### MVVM Architecture

Every page is split into three layers, each with one job. Using the Home page as an example:

- **Model** (`HomeModel.ts`) – Business logic. It validates the search query (at least 2 characters) and calls the books service. No React code.
- **ViewModel** (`useHomeViewModel.ts`) – A custom React hook. It holds the state (`query`, `books`, `loading`, `error`) and actions like `handleSearch`. It calls the Model, never the API directly.
- **View** (`HomeView.tsx`) – Only the UI. It uses the ViewModel hook and renders what it gets. It never imports services or the Model.

All network and storage calls live in `src/services/`, so any page can change where its data comes from without touching its View.

---

## 🚀 Getting Started

**Requirements:** Node.js 18 or newer

```bash
git clone https://github.com/AqsaSaqib/booknest.git
cd booknest
npm install
npm run dev
```

Then open the local link shown in the terminal (usually `http://localhost:5173`).

**No API keys are needed.** The `.env` file contains only the public Open Library URL:

```
VITE_BOOKS_API_URL=https://openlibrary.org
```

---

## 💬 Prompts Used

The app was built with Google Antigravity using these steps. All prompts are in [PROMPTS.md](./PROMPTS.md).

1. **Spec and plan** – A detailed spec (features, MVVM rules, folder structure, types) with a request for an implementation plan before any code
2. **Phase 1** – Project setup, types, API service, routing, Header
3. **Phase 2** – Home search page, BookCard, Book details page
4. **Phase 3** – localStorage service, shared shelf state, Bookshelf page
5. **Phase 4** – Styling polish
6. **Code review** – Asked the AI to review the whole codebase and list problems without fixing them
7. **Fixes** – Directed the AI to fix the issues I selected from the review
8. **Documentation** – README and prompt log

---

## 🤖 How AI Assisted

I used Google Antigravity as my development assistant. Instead of asking for the whole app at once, I first wrote a detailed specification with the features, the MVVM rules, and the folder structure, and asked the AI to create an implementation plan before writing any code. After reviewing the plan, I built the app in four phases. After each phase I ran the build and tested the app in the browser using a checklist.

AI was most helpful with project setup, TypeScript types, the API integration, and repetitive code across the three MVVM layers. It also handled edge cases I had specified, such as missing covers and empty search results.

However, the AI's code was not perfect. When I asked it to review its own work against the spec, it found unused code, a hardcoded message that broke the MVVM rules, duplicated card markup, accessibility gaps, and a bug where every book showed "Unknown year." This showed me that AI-generated code needs careful review and testing. Planning first and building in small phases made the output much easier to check.

---

## 🔧 Reviewing the AI's Code: Corrections and Refactoring

After the app was built, I asked the AI to review the entire codebase against the spec and **only list problems, without changing anything**. I went through the list, decided which issues were real problems and how each should be fixed, and then directed the AI to apply those fixes one at a time. After the fixes, I tested every page in the browser to confirm nothing else broke.

Before/after code for every fix is in [FIXES.md](./FIXES.md).

### 1. Removed dead code
- **Problem:** `isBookComplete` in `BookDetailsModel.ts` and the `isComplete` value in its ViewModel were never used.
- **Fix:** Removed both. Unused code makes a project harder to read and maintain.

### 2. Moved hardcoded text into the Model (MVVM fix)
- **Problem:** The remove-confirmation message was hardcoded inside `useBookDetailsViewModel.ts`, even though the Bookshelf page already kept its message in the Model.
- **Fix:** Added `getRemoveConfirmationMessage()` to `BookDetailsModel.ts` and used it in the ViewModel, so both pages follow the same MVVM rule.

### 3. Removed duplicated card UI (refactoring)
- **Problem:** `BookshelfView.tsx` copied the whole card layout from `BookCard.tsx` instead of reusing it.
- **Fix:** `BookCard` now accepts an optional `actions` prop, and the Bookshelf page passes its status dropdown and Remove button through it. There is now one card component instead of two copies.

### 4. Fixed "Unknown year" on the details page (bug fix)
- **Problem:** Every book showed "Unknown year" because the Open Library works endpoint does not return `first_publish_year`.
- **Fix:** The page now uses the best year available (from the work data, the saved shelf, or the search result). If no year exists, the row is hidden instead of showing "Unknown year."

### 5. Unknown URLs show the Not Found page directly
- **Problem:** Unknown routes redirected to `/404`, so the user lost the URL they had typed.
- **Fix:** `<Route path="*">` now renders `NotFoundView` directly, and the extra `/404` route was removed.

### 6. Accessibility: labelled the Remove button
- **Problem:** The "Remove from Shelf" button on the details page didn't say which book it would remove, unlike the other remove buttons.
- **Fix:** Added an `aria-label` that includes the book title.

### 7. Accessibility: fixed the BookCard link label
- **Problem:** An extra `aria-label` on the card link replaced the book title and image text for screen readers.
- **Fix:** Removed the extra label, since the link already contains readable text.

### 8. Accessibility: completed the tab pattern
- **Problem:** The Bookshelf filter tabs used `role="tab"` but the list had no matching `role="tabpanel"`.
- **Fix:** Tabs now have `id`, `aria-controls`, and `aria-selected`, and the list has `role="tabpanel"` with `aria-labelledby`.

<!--
If you change anything yourself by hand, add it here, for example:

### 9. Changed the browser tab title (done by hand)
- **Problem:** The tab still showed the default "Vite + React + TS" title.
- **Fix:** I updated the <title> in index.html to "BookNest – Your Book Tracker".
-->

---

## 🧭 Design Decisions

- **Open Library + localStorage instead of a paid API and Firebase:** The app runs immediately after `npm install`, with no API keys, accounts, or backend setup, while keeping the MVVM structure, real API integration, and a saved-items feature.
- **`src/context/` folder:** Added beyond the original plan. `BookshelfContext` shares the shelf state so the header count and card statuses update instantly on every page.
- **Services as the only data layer:** Because only `src/services/` touches the API and localStorage, switching the bookshelf to a cloud database later would not require changing any View.

---

## 🔮 Future Improvements

- User accounts with Firebase so the bookshelf syncs across devices
- Reading progress (pages read) and personal notes for each book
- Sorting and searching within the bookshelf
