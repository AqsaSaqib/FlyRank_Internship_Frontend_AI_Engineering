import { Book, ShelfBook, ShelfStatus } from '../types/book';

const STORAGE_KEY = 'booknest:bookshelf';

/**
 * Validates if an object conforms to the ShelfBook structure.
 */
function isValidShelfBook(item: unknown): item is ShelfBook {
  if (!item || typeof item !== 'object') return false;
  const candidate = item as Partial<ShelfBook>;
  return (
    typeof candidate.id === 'string' &&
    typeof candidate.title === 'string' &&
    Array.isArray(candidate.authors) &&
    typeof candidate.category === 'string' &&
    typeof candidate.description === 'string' &&
    typeof candidate.publishedYear === 'string' &&
    (candidate.pageCount === null || typeof candidate.pageCount === 'number') &&
    typeof candidate.coverUrl === 'string' &&
    (candidate.status === 'want-to-read' || candidate.status === 'reading' || candidate.status === 'finished') &&
    typeof candidate.addedAt === 'number'
  );
}

/**
 * Retrieves the stored shelf items, sorted newest first.
 * Wraps read in try/catch and falls back to an empty array on corruption.
 */
export function getShelf(): ShelfBook[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }

    const validBooks = parsed.filter(isValidShelfBook);
    // Sort newest first by addedAt descending
    return validBooks.sort((a, b) => b.addedAt - a.addedAt);
  } catch {
    return [];
  }
}

/**
 * Saves shelf array to localStorage with try/catch wrapping.
 */
function saveShelf(shelf: ShelfBook[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(shelf));
  } catch (err) {
    console.error('Failed to save bookshelf to localStorage:', err);
  }
}

/**
 * Adds a book to the shelf.
 * If the book already exists, prevents duplicate entry.
 * Returns the updated shelf with newest items first.
 */
export function addToShelf(book: Book, status: ShelfStatus = 'want-to-read'): ShelfBook[] {
  try {
    const currentShelf = getShelf();
    const existingIndex = currentShelf.findIndex((item) => item.id === book.id);

    if (existingIndex !== -1) {
      // Already on shelf - do not create a duplicate
      return currentShelf;
    }

    const newShelfBook: ShelfBook = {
      ...book,
      status,
      addedAt: Date.now(),
    };

    const updatedShelf = [newShelfBook, ...currentShelf];
    saveShelf(updatedShelf);
    return updatedShelf;
  } catch {
    return getShelf();
  }
}

/**
 * Updates the reading status of an existing book on the shelf.
 */
export function updateShelfStatus(bookId: string, status: ShelfStatus): ShelfBook[] {
  try {
    const currentShelf = getShelf();
    const target = currentShelf.find((item) => item.id === bookId);

    if (!target) {
      return currentShelf;
    }

    const updatedShelf = currentShelf.map((item) =>
      item.id === bookId ? { ...item, status } : item
    );

    saveShelf(updatedShelf);
    return updatedShelf;
  } catch {
    return getShelf();
  }
}

/**
 * Removes a book from the shelf by ID.
 */
export function removeFromShelf(bookId: string): ShelfBook[] {
  try {
    const currentShelf = getShelf();
    const updatedShelf = currentShelf.filter((item) => item.id !== bookId);
    saveShelf(updatedShelf);
    return updatedShelf;
  } catch {
    return getShelf();
  }
}

/**
 * Checks if a book exists on the shelf.
 */
export function isOnShelf(bookId: string): boolean {
  try {
    const currentShelf = getShelf();
    return currentShelf.some((item) => item.id === bookId);
  } catch {
    return false;
  }
}
