import { Book } from '../types/book';

export type BookTag = 'bestseller' | 'new' | 'sale' | 'popular';

export interface BookPrice {
  price: number;
  originalPrice: number | null;
  onSale: boolean;
}

export const BOOK_TAG_LABELS: Record<BookTag, string> = {
  bestseller: 'Bestseller',
  new: 'New',
  sale: 'Sale',
  popular: 'Popular',
};

/**
 * Stable numeric hash of a string, so the same book always gets the same demo price.
 */
function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  return hash;
}

/**
 * Returns a demo price for a book.
 * Open Library does not provide prices, so this is derived from the book ID
 * (always the same for a given book). Replace with real data if a pricing API is added.
 */
export function getBookPrice(book: Book): BookPrice {
  const hash = hashString(book.id);
  const basePrice = 7 + (hash % 18) + 0.99; // $7.99 – $24.99
  const onSale = hash % 5 === 0;

  if (onSale) {
    const salePrice = Math.floor(basePrice * 0.75) + 0.99;
    return { price: salePrice, originalPrice: basePrice, onSale: true };
  }
  return { price: basePrice, originalPrice: null, onSale: false };
}

export function formatPrice(value: number): string {
  return `$${value.toFixed(2)}`;
}

/**
 * Derives display tags from real rating data, publish year and sale status.
 */
export function getBookTags(book: Book): BookTag[] {
  const tags: BookTag[] = [];
  const rating = book.rating ?? 0;
  const ratingCount = book.ratingCount ?? 0;
  const year = parseInt(book.publishedYear, 10);

  if (getBookPrice(book).onSale) tags.push('sale');
  if (ratingCount >= 100 && rating >= 3.8) {
    tags.push('bestseller');
  } else if (ratingCount >= 20) {
    tags.push('popular');
  }
  if (!Number.isNaN(year) && year >= new Date().getFullYear() - 3) tags.push('new');

  return tags;
}
