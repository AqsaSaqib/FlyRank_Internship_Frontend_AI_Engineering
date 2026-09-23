/**
 * Formats the list of authors into a readable comma-separated string.
 */
export function formatAuthors(authors?: string[]): string {
  if (!authors || authors.length === 0) {
    return 'Unknown author';
  }
  return authors.join(', ');
}

/**
 * Formats the page count into a human-friendly string or indicates unavailability.
 */
export function formatPageCount(pageCount: number | null): string {
  if (pageCount === null || pageCount <= 0) {
    return 'Page count unavailable';
  }
  return `${pageCount.toLocaleString()} pages`;
}

/**
 * Resolves the published year using the hierarchy:
 * 1. Work response year (first_publish_date extracted 4-digit year)
 * 2. Stored shelf book year
 * 3. Route location state passed from BookCard
 * Returns null if none are available.
 */
export function resolvePublishedYear(
  workYear?: string | null,
  shelfYear?: string | null,
  locationStateYear?: string | null
): string | null {
  if (workYear && workYear !== 'Unknown year' && workYear.trim() !== '') {
    return workYear.trim();
  }
  if (shelfYear && shelfYear !== 'Unknown year' && shelfYear.trim() !== '') {
    return shelfYear.trim();
  }
  if (locationStateYear && locationStateYear !== 'Unknown year' && locationStateYear.trim() !== '') {
    return locationStateYear.trim();
  }
  return null;
}

/**
 * Constructs confirmation message when removing a book from the shelf.
 */
export function getRemoveConfirmationMessage(title: string): string {
  return `Are you sure you want to remove "${title}" from your bookshelf?`;
}
