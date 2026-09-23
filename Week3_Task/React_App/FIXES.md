# Code Review Fixes Log

This document records the 8 targeted fixes applied across the codebase according to the review findings.

---

### Fix 1: Remove Unused `isBookComplete`
- **Problem**: `isBookComplete` in `BookDetailsModel.ts` and its exposed `isComplete` property in `useBookDetailsViewModel.ts` were unused.
- **What was changed**: Removed `isBookComplete` function, its import, and the `isComplete` field from `useBookDetailsViewModel.ts`.

#### Before
```typescript
// BookDetailsModel.ts
export function isBookComplete(book: Book | null): book is Book {
  return book !== null && typeof book.id === 'string' && book.id.length > 0;
}
```

#### After
```typescript
// BookDetailsModel.ts
// (Function removed)
```

---

### Fix 2: Add `aria-label` to BookDetails Removal Button
- **Problem**: The "Remove from Shelf" button in `BookDetailsView.tsx` lacked an `aria-label` specifying the book title.
- **What was changed**: Added `aria-label={`Remove ${book.title} from shelf`}` to the button.

#### Before
```tsx
// BookDetailsView.tsx
<button
  type="button"
  className="btn btn-outline btn-sm"
  style={{ width: '100%', marginTop: '0.5rem', color: 'var(--danger-color)', borderColor: 'var(--danger-border)' }}
  onClick={handleRemoveFromShelf}
>
  Remove from Shelf
</button>
```

#### After
```tsx
// BookDetailsView.tsx
<button
  type="button"
  className="btn btn-outline btn-sm"
  style={{ width: '100%', marginTop: '0.5rem', color: 'var(--danger-color)', borderColor: 'var(--danger-border)' }}
  onClick={handleRemoveFromShelf}
  aria-label={`Remove ${book.title} from shelf`}
>
  Remove from Shelf
</button>
```

---

### Fix 3: Remove Redundant `aria-label` from `BookCard` Link
- **Problem**: The `<Link>` in `BookCard.tsx` had an `aria-label` that overrode child text content (`<h3>` and `alt`).
- **What was changed**: Removed `aria-label` attribute from the `<Link>` element.

#### Before
```tsx
// BookCard.tsx
<Link to={`/book/${book.id}`} className="book-card-link" aria-label={`View details for ${book.title}`}>
```

#### After
```tsx
// BookCard.tsx
<Link to={`/book/${book.id}`} state={{ publishedYear: book.publishedYear }} className="book-card-link">
```

---

### Fix 4: Direct `<NotFoundView />` Route on Wildcard in `App.tsx`
- **Problem**: Unknown routes redirected to `/404` instead of rendering `<NotFoundView />` directly on `*`.
- **What was changed**: Removed the `/404` route and `Navigate` import, rendering `<Route path="*" element={<NotFoundView />} />` directly.

#### Before
```tsx
// App.tsx
<Route path="/404" element={<NotFoundView />} />
<Route path="*" element={<Navigate to="/404" replace />} />
```

#### After
```tsx
// App.tsx
<Route path="*" element={<NotFoundView />} />
```

---

### Fix 5: Move Removal Confirmation Text to `BookDetailsModel.ts`
- **Problem**: `useBookDetailsViewModel.ts` had a hardcoded confirmation string instead of delegating to a Model function.
- **What was changed**: Added `getRemoveConfirmationMessage` to `BookDetailsModel.ts` and called it inside `useBookDetailsViewModel.ts`.

#### Before
```typescript
// useBookDetailsViewModel.ts
const confirmRemove = window.confirm(`Remove "${book?.title || 'this book'}" from your bookshelf?`);
```

#### After
```typescript
// BookDetailsModel.ts
export function getRemoveConfirmationMessage(title: string): string {
  return `Are you sure you want to remove "${title}" from your bookshelf?`;
}

// useBookDetailsViewModel.ts
const confirmRemove = window.confirm(getRemoveConfirmationMessage(book?.title || 'this book'));
```

---

### Fix 6: Refactor `BookCard` with Optional `actions` Prop
- **Problem**: `BookshelfView.tsx` duplicated `BookCard` markup to render custom status dropdowns and remove buttons.
- **What was changed**: Added `actions?: React.ReactNode` to `BookCardProps`, replacing the default button when provided, and used `<BookCard />` in `BookshelfView.tsx`.

#### Before
```tsx
// BookshelfView.tsx
<article key={book.id} className="book-card" aria-label={book.title}>
  <Link to={`/book/${book.id}`} className="book-card-link">...</Link>
  <div className="book-card-footer shelf-card-footer">
    <select ... />
    <button ... />
  </div>
</article>
```

#### After
```tsx
// BookshelfView.tsx
<BookCard
  key={book.id}
  book={book}
  actions={
    <>
      <select ... />
      <button ... />
    </>
  }
/>
```

---

### Fix 7: Complete ARIA Tab Pattern in `BookshelfView.tsx`
- **Problem**: Filter tabs lacked `id` and `aria-controls`, and the list container lacked `role="tabpanel"` and `aria-labelledby`.
- **What was changed**: Added `id="shelf-tab-{tab}"`, `aria-controls="shelf-tabpanel"` to tabs, and wrapped the book grid in `<div id="shelf-tabpanel" role="tabpanel" aria-labelledby={`shelf-tab-${activeTab}`}>`.

#### Before
```tsx
// BookshelfView.tsx
<div className="shelf-tabs" role="tablist" aria-label="Bookshelf Filter Tabs">
  <button type="button" role="tab" aria-selected={activeTab === 'all'} ...>
</div>
<div className="books-grid">...</div>
```

#### After
```tsx
// BookshelfView.tsx
<div className="shelf-tabs" role="tablist" aria-label="Bookshelf Filter Tabs">
  <button
    type="button"
    role="tab"
    id="shelf-tab-all"
    aria-controls="shelf-tabpanel"
    aria-selected={activeTab === 'all'}
    ...
  >
</div>
<div id="shelf-tabpanel" role="tabpanel" aria-labelledby={`shelf-tab-${activeTab}`}>
  <div className="books-grid">...</div>
</div>
```

---

### Fix 8: Resolve Published Year Hierarchy and Fallback on Book Details
- **Problem**: Book Details displayed "Unknown year" when the works endpoint omitted publish dates.
- **What was changed**:
  1. Extracted 4-digit year from `work.first_publish_date` in `mapBook.ts`.
  2. Fallback to year stored on shelf if present.
  3. Fallback to year passed in router location state from `BookCard`.
  4. Hide the year metadata row in `BookDetailsView.tsx` if no year is resolved.

#### Before
```tsx
// mapBook.ts
publishedYear: 'Unknown year'

// BookDetailsView.tsx
<div className="metadata-item">
  <span className="metadata-label">Published</span>
  <span className="metadata-value">{book.publishedYear}</span>
</div>
```

#### After
```tsx
// mapBook.ts
const extractedYear = extractYear(work.first_publish_date);
publishedYear: extractedYear || 'Unknown year'

// BookDetailsView.tsx
{publishedYear && (
  <div className="metadata-item">
    <span className="metadata-label">Published</span>
    <span className="metadata-value">{publishedYear}</span>
  </div>
)}
```
