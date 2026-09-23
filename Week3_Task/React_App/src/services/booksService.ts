import { Book, OpenLibraryAuthorResponse, OpenLibraryRatingsResponse, OpenLibrarySearchResponse, OpenLibraryWork } from '../types/book';
import { mapSearchDocToBook, mapWorkToBook } from '../utils/mapBook';

const BASE_URL = import.meta.env.VITE_BOOKS_API_URL || 'https://openlibrary.org';

/**
 * Searches books via Open Library API.
 * @param query - Search term
 * @param signal - Optional AbortSignal to cancel in-flight requests
 * @returns Array of mapped Book objects
 */
export async function searchBooks(query: string, signal?: AbortSignal): Promise<Book[]> {
  const trimmed = query.trim();
  if (!trimmed) {
    return [];
  }

  const encodedQuery = encodeURIComponent(trimmed);
  const fields = 'key,title,author_name,first_publish_year,cover_i,subject,number_of_pages_median,ratings_average,ratings_count';
  const url = `${BASE_URL}/search.json?q=${encodedQuery}&limit=20&fields=${fields}`;

  try {
    const response = await fetch(url, { signal });
    if (!response.ok) {
      throw new Error(`Server returned ${response.status}`);
    }

    const data = (await response.json()) as OpenLibrarySearchResponse;
    if (!data.docs || !Array.isArray(data.docs) || data.docs.length === 0) {
      return [];
    }

    return data.docs.map(mapSearchDocToBook);
  } catch (err: unknown) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw err;
    }
    throw new Error('Could not fetch books. Please check your connection and try again.');
  }
}

/**
 * Fetches an author's name by author key or returns "Unknown author" on failure.
 */
async function fetchAuthorName(authorKey: string, signal?: AbortSignal): Promise<string> {
  const cleanKey = authorKey.replace(/^\/?authors\//, '');
  const url = `${BASE_URL}/authors/${cleanKey}.json`;

  try {
    const response = await fetch(url, { signal });
    if (!response.ok) {
      return 'Unknown author';
    }
    const data = (await response.json()) as OpenLibraryAuthorResponse;
    return data.name || data.personal_name || 'Unknown author';
  } catch {
    return 'Unknown author';
  }
}

/**
 * Fetches a work's reader rating summary, or nulls when unavailable.
 */
async function fetchRatings(
  workId: string,
  signal?: AbortSignal
): Promise<{ rating: number | null; ratingCount: number | null }> {
  try {
    const response = await fetch(`${BASE_URL}/works/${workId}/ratings.json`, { signal });
    if (!response.ok) {
      return { rating: null, ratingCount: null };
    }
    const data = (await response.json()) as OpenLibraryRatingsResponse;
    return {
      rating: data.summary?.average ?? null,
      ratingCount: data.summary?.count ?? null,
    };
  } catch {
    return { rating: null, ratingCount: null };
  }
}

/**
 * Fetches book details by work ID, including author names in parallel.
 * @param id - Clean work ID (e.g. "OL123W")
 * @param signal - Optional AbortSignal
 * @returns Mapped Book object
 */
export async function getBookById(id: string, signal?: AbortSignal): Promise<Book> {
  const cleanId = id.replace(/^\/?works\//, '').trim();
  if (!cleanId) {
    throw new Error('Invalid book identifier.');
  }

  const workUrl = `${BASE_URL}/works/${cleanId}.json`;

  try {
    const ratingsPromise = fetchRatings(cleanId, signal);
    const response = await fetch(workUrl, { signal });
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Book not found.');
      }
      throw new Error(`Server returned ${response.status}`);
    }

    const workData = (await response.json()) as OpenLibraryWork;

    // Fetch author names in parallel if author keys are present
    let authorNames: string[] = [];
    if (workData.authors && workData.authors.length > 0) {
      const authorPromises = workData.authors.map((ref) => {
        if (ref.author && ref.author.key) {
          return fetchAuthorName(ref.author.key, signal);
        }
        return Promise.resolve('Unknown author');
      });

      authorNames = await Promise.all(authorPromises);
    }

    const ratings = await ratingsPromise;
    return { ...mapWorkToBook(cleanId, workData, authorNames, 'L'), ...ratings };
  } catch (err: unknown) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw err;
    }
    if (err instanceof Error && err.message === 'Book not found.') {
      throw err;
    }
    throw new Error('Could not fetch book details. Please check your connection and try again.');
  }
}
