import { Book, OpenLibrarySearchDoc, OpenLibraryWork } from '../types/book';
import { getCoverUrl } from './coverUrl';

/**
 * Extracts clean ID from a work key (e.g. "/works/OL123W" -> "OL123W" or "OL123W" -> "OL123W").
 */
export function extractWorkId(key: string): string {
  return key.replace(/^\/?works\//, '').trim();
}

/**
 * Parses description from OpenLibrary work object, supporting both string and { value: string } shapes.
 */
export function parseDescription(description?: string | { type?: string; value: string }): string {
  if (!description) {
    return 'No description available';
  }
  if (typeof description === 'string') {
    const trimmed = description.trim();
    return trimmed.length > 0 ? trimmed : 'No description available';
  }
  if (typeof description === 'object' && description.value) {
    const trimmed = description.value.trim();
    return trimmed.length > 0 ? trimmed : 'No description available';
  }
  return 'No description available';
}

/**
 * Maps an OpenLibrary search result document to the standard Book domain model.
 */
export function mapSearchDocToBook(doc: OpenLibrarySearchDoc): Book {
  const authors = (doc.author_name && doc.author_name.length > 0)
    ? doc.author_name
    : ['Unknown author'];

  const category = (doc.subject && doc.subject.length > 0)
    ? doc.subject[0]
    : 'Uncategorized';

  const publishedYear = doc.first_publish_year
    ? String(doc.first_publish_year)
    : 'Unknown year';

  const coverUrl = getCoverUrl(doc.cover_i, 'M');

  return {
    id: extractWorkId(doc.key),
    title: doc.title || 'Untitled',
    authors,
    category,
    description: 'No description available',
    publishedYear,
    pageCount: doc.number_of_pages_median ?? null,
    coverUrl,
    rating: doc.ratings_average ?? null,
    ratingCount: doc.ratings_count ?? null,
  };
}

/**
 * Extracts 4-digit year from date string if present.
 */
export function extractYear(dateString?: string): string | null {
  if (!dateString) return null;
  const match = dateString.match(/\b\d{4}\b/);
  return match ? match[0] : null;
}

/**
 * Maps an OpenLibrary work object and resolved authors to the standard Book domain model.
 */
export function mapWorkToBook(
  workId: string,
  work: OpenLibraryWork,
  authorNames: string[],
  coverSize: 'M' | 'L' = 'L'
): Book {
  const authors = authorNames.length > 0 ? authorNames : ['Unknown author'];
  const category = (work.subjects && work.subjects.length > 0)
    ? work.subjects[0]
    : 'Uncategorized';
  
  const coverId = (work.covers && work.covers.length > 0) ? work.covers[0] : null;
  const extractedYear = extractYear(work.first_publish_date);

  return {
    id: extractWorkId(workId),
    title: work.title || 'Untitled',
    authors,
    category,
    description: parseDescription(work.description),
    publishedYear: extractedYear || 'Unknown year',
    pageCount: null,
    coverUrl: getCoverUrl(coverId, coverSize),
  };
}
