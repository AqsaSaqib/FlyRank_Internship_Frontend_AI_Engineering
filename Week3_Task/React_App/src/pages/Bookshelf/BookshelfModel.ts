import { ShelfBook, ShelfStatus } from '../../types/book';

export type ShelfFilterTab = 'all' | ShelfStatus;

export interface ShelfStats {
  total: number;
  wantToRead: number;
  reading: number;
  finished: number;
}

/**
 * Computes shelf metrics and status counters.
 */
export function calculateShelfStats(shelf: ShelfBook[]): ShelfStats {
  let wantToRead = 0;
  let reading = 0;
  let finished = 0;

  for (const book of shelf) {
    if (book.status === 'want-to-read') wantToRead++;
    else if (book.status === 'reading') reading++;
    else if (book.status === 'finished') finished++;
  }

  return {
    total: shelf.length,
    wantToRead,
    reading,
    finished,
  };
}

/**
 * Filters the shelf list based on selected tab filter.
 */
export function filterShelf(shelf: ShelfBook[], tab: ShelfFilterTab): ShelfBook[] {
  if (tab === 'all') {
    return shelf;
  }
  return shelf.filter((book) => book.status === tab);
}

/**
 * Constructs confirmation message when removing a book from the shelf.
 */
export function getRemoveConfirmationMessage(bookTitle: string): string {
  return `Are you sure you want to remove "${bookTitle}" from your bookshelf?`;
}
