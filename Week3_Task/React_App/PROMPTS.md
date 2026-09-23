# Prompts Used

All prompts sent to Google Antigravity while building BookNest, in order.

---

## Prompt 1 – Full spec and implementation plan

```
You are building a complete web app called "BookNest" in this empty folder.
First read this entire spec and produce an implementation plan and task list.
Do NOT write any code until I approve the plan.

## App summary
BookNest is a book tracker. Users search books using the free Open Library API
(no API key) and save books to a personal bookshelf stored in the browser's localStorage,
with a reading status: "want-to-read", "reading", or "finished".
There is no backend, no login, and no Firebase.

## Tech stack (do not add anything else)
- React + Vite + TypeScript (strict mode, no `any`)
- react-router-dom for routing
- Plain CSS with CSS variables (no UI libraries, no Tailwind)

## Architecture: strict MVVM
- Model (XModel.ts): business logic and validation. No React hooks, no fetch, no localStorage.
- ViewModel (useXViewModel.ts): custom hook with state and actions. Calls the Model. No JSX.
- View (XView.tsx): JSX only. Uses its ViewModel hook. Never imports services or Models.
- Services (src/services/): the ONLY place that calls fetch or localStorage.
- Components (src/components/): presentational only, receive data and handlers via props.

## Folder structure
src/
  components/  Header.tsx, BookCard.tsx, StatusBadge.tsx
  pages/
    Home/        HomeModel.ts, useHomeViewModel.ts, HomeView.tsx
    BookDetails/ BookDetailsModel.ts, useBookDetailsViewModel.ts, BookDetailsView.tsx
    Bookshelf/   BookshelfModel.ts, useBookshelfViewModel.ts, BookshelfView.tsx
    NotFound/    NotFoundView.tsx
  services/    booksService.ts, bookshelfStorage.ts
  types/       book.ts
  utils/       mapBook.ts, coverUrl.ts

## Environment
- .env contains only: VITE_BOOKS_API_URL=https://openlibrary.org
- Create both .env and .env.example with this value (it's not a secret).
- Declare the variable's type in src/vite-env.d.ts. Read it via import.meta.env.

## Types (src/types/book.ts)
- OpenLibrarySearchDoc and OpenLibrarySearchResponse (docs array; fields: key, title,
  author_name?, first_publish_year?, cover_i?, subject?, number_of_pages_median?).
- OpenLibraryWork (title, description? which can be a string OR { value: string },
  covers?, subjects?, authors? as array of { author: { key: string } }).
- Book: id, title, authors (string[]), category, description, publishedYear (string),
  pageCount (number | null), coverUrl.
- ShelfStatus: "want-to-read" | "reading" | "finished".
- ShelfBook extends Book with status and addedAt (number).

## Open Library API (booksService.ts)
- searchBooks(query): GET {base}/search.json?q={encoded query}&limit=20
  &fields=key,title,author_name,first_publish_year,cover_i,subject,number_of_pages_median
- getBookById(id): GET {base}/works/{id}.json, then fetch author names from
  {base}/authors/{authorId}.json in parallel (Promise.all). If an author request fails,
  use "Unknown author" instead of failing the whole page.
- Throw readable errors (e.g. "Could not fetch books. Please check your connection and try again.").
- Return an empty array when there are no results.

## Mapping (utils/mapBook.ts, utils/coverUrl.ts)
- Work key "/works/OL123W" becomes id "OL123W".
- Fallbacks: "Unknown author", "Uncategorized", "No description available", "Unknown year".
- Description: handle both string and { value } formats.
- Cover: https://covers.openlibrary.org/b/id/{coverId}-M.jpg (use -L on details page).
  If there's no cover ID, use a local placeholder (an inline SVG data URI is fine).

## localStorage service (bookshelfStorage.ts)
- Storage key: "booknest:bookshelf".
- Functions: getShelf(), addToShelf(book, status), updateShelfStatus(bookId, status),
  removeFromShelf(bookId), isOnShelf(bookId).
- Wrap every read and write in try/catch. If data is missing or invalid JSON, return an empty shelf.
- Don't add the same book twice. getShelf returns newest first.
- No React hooks in this file.

## Features
1. Header: "BookNest" logo linking to "/", nav links "Search" (/) and "My Bookshelf" (/bookshelf)
   with a count badge showing how many books are on the shelf. Active link is highlighted. Responsive.
2. Home (/): search form. Query must be at least 2 characters after trimming.
   States: welcome message before searching, loading, error, "No books found", results grid.
   Prevent duplicate searches while one is loading.
3. BookCard: cover, title, authors, year. Links to /book/:id. Shows "Add to Shelf" button,
   or a StatusBadge if already saved. Clicking the button must not trigger the link.
   Images use lazy loading and have alt text.
4. Book details (/book/:id): large cover, title, authors, category, year, page count (if known),
   description, Add to Shelf or status dropdown if already saved, "Back to search" link.
   Ignore results if the user leaves the page before the request finishes.
5. Bookshelf (/bookshelf): stats at the top (total books, currently reading, finished),
   filter tabs All / Want to Read / Reading / Finished with counts, a status dropdown per book,
   a Remove button with confirmation, and an empty state with a link to search.
6. NotFound page for unknown routes.
7. The shelf count in the Header and the status on cards must update immediately after any change.
   Choose a clean way to share shelf state (e.g. a small context or a custom event),
   explain your choice in the plan, and keep it consistent with MVVM.

## Also required
- README.md with description, features, tech stack, MVVM folder explanation, setup steps
  (npm install, npm run dev — no keys needed), and empty sections titled
  "Prompts Used", "AI Assistance", and "Manual Improvements".
- Clean, modern, responsive design: CSS variables, responsive grid, hover and focus states,
  works well at 375px mobile width.

## Build phases (I will tell you when to start each)
Phase 1: project setup, env, types, utils, booksService, routing, Header, NotFound.
Phase 2: Home (MVVM), BookCard, Book details (MVVM).
Phase 3: bookshelfStorage, shared shelf state, Add to Shelf, Bookshelf page (MVVM).
Phase 4: styling polish, README, final checks.

Now produce the implementation plan and task list only.
```

**Result:** The AI produced an implementation plan and task list with four phases. I reviewed and approved it.

---

## Prompt 2 – Phase 1: Setup

```
Plan approved. Start Phase 1 only: create the Vite React TypeScript project in this folder,
remove all default Vite demo content, install react-router-dom, create .env, .env.example,
.gitignore, vite-env.d.ts, types, utils, booksService, routing with placeholder pages,
Header, and NotFound.
When done, run `npm run build`, fix any TypeScript errors, and summarize what you created.
```

**Result:** Project created with types, API service, routing, Header, and NotFound page. Build passed.

---

## Prompt 3 – Phase 2: Search and details pages

```
Start Phase 2: build Home (MVVM), BookCard, and Book details (MVVM) following the spec.
For now, the "Add to Shelf" button can be visible but do nothing.
Run `npm run build` and fix errors. Then give me a checklist of what to test in the browser,
including: searching "harry potter", searching "xqzvw" (should show No books found),
searching "a" (should show the validation error), opening a details page,
and a book with no cover image.
```

**Result:** Home search page, BookCard, and Book details page built. I tested them in the browser using the checklist.

---

## Prompt 4 – Phase 3: Bookshelf

```
Start Phase 3: bookshelfStorage, shared shelf state, working "Add to Shelf" on Home and
Book details, the status dropdown on details, and the Bookshelf page (MVVM).
Run `npm run build` and fix errors. Then give me a test checklist, including:
add 3 books, check the Header count updates, change statuses, check tab counts and stats,
remove a book, refresh the page and confirm the shelf is still there, and try adding the same book twice.
```

**Result:** localStorage service, BookshelfContext, and Bookshelf page built. I tested the checklist in the browser.

---

## Prompt 5 – Phase 4: Styling

```
Start Phase 4: polish the styling across all pages (consistent colors, spacing, responsive grid,
mobile layout at 375px, hover and focus states) and write README.md.
Do not change any app logic in this phase.
```

**Result:** Styling improved across all pages. The README was not created in this step, so it was written separately later.

---

## Prompt 6 – Code review (list only)

```
Review the entire codebase against the spec and list problems only — do not fix anything:
MVVM violations, any `any` types, unused code, missing loading/error/empty states,
duplicated logic, effects without cleanup, accessibility issues (labels, alt text,
keyboard focus), and anything in the spec that is missing or implemented differently.
```

**Result:** The AI listed issues including unused code, a hardcoded message in a ViewModel, duplicated card markup, an "Unknown year" bug, a NotFound redirect, and accessibility gaps. It confirmed there were no `any` types and that all effects had cleanup.

---

## Prompt 7 – Fixing the selected issues

```
Fix the following issues from the code review. Apply them one at a time, and after each fix
make sure `npm run build` passes. Don't change anything else — no styling changes, no new
features, no renaming unrelated code.

1. Remove the unused `isBookComplete` function from BookDetailsModel.ts, and remove the
   `isComplete` value and its import from useBookDetailsViewModel.ts.

2. Add an aria-label to the "Remove from Shelf" button in BookDetailsView.tsx that includes
   the book title, e.g. `Remove ${book.title} from shelf`, consistent with the other remove buttons.

3. Remove the redundant aria-label from the Link in BookCard.tsx, since the link already
   contains the image alt text and the title.

4. In App.tsx, render <NotFoundView /> directly on <Route path="*" /> instead of redirecting
   to /404. Remove the /404 route and any imports that become unused.

5. Move the hardcoded remove-confirmation text from useBookDetailsViewModel.ts into a
   `getRemoveConfirmationMessage(title: string)` function in BookDetailsModel.ts, and use it
   in the ViewModel — same approach as BookshelfModel.

6. Refactor BookCard to accept an optional `actions` prop (ReactNode) rendered in the card footer,
   replacing the built-in Add to Shelf button when provided. Use BookCard in BookshelfView,
   passing the status dropdown and Remove button as `actions`, and delete the duplicated card
   markup from BookshelfView. Keep BookCard presentational. Keep the Bookshelf page looking the same.

7. Complete the ARIA tab pattern in BookshelfView.tsx: each tab gets an id, aria-controls,
   and aria-selected; the book list container gets role="tabpanel", an id, and aria-labelledby
   pointing to the active tab.

8. Fix "Unknown year" on the Book Details page:
   - First use `first_publish_date` from the work response if present (extract the 4-digit year).
   - Otherwise, if the book is on the shelf, use the year stored there.
   - Otherwise, use the year passed via React Router location state when navigating from a BookCard.
   - If none are available, hide the year row instead of showing "Unknown year".
   Keep all fetching in booksService and all mapping in mapBook.ts.

Leave isOnShelf and the src/context/ folder as they are.

When all fixes are done:
- Run `npm run build` one final time and confirm it passes.
- Create a file FIXES.md in the project root. For each fix, write: the problem (1 line),
  what was changed (1 line), and short before/after code snippets.
- Then give me a checklist of things to test in the browser to confirm everything still works.
```

**Result:** All eight fixes applied, the build passed, and FIXES.md was created with before/after snippets. I tested the app in the browser afterward.
