export interface OpenLibrarySearchDoc {
  key: string;
  title: string;
  author_name?: string[];
  first_publish_year?: number;
  cover_i?: number;
  subject?: string[];
  number_of_pages_median?: number;
  ratings_average?: number;
  ratings_count?: number;
}

export interface OpenLibrarySearchResponse {
  numFound: number;
  start: number;
  numFoundExact: boolean;
  docs: OpenLibrarySearchDoc[];
}

export interface OpenLibraryWorkAuthorRef {
  author: {
    key: string;
  };
  type?: {
    key: string;
  };
}

export interface OpenLibraryWork {
  title: string;
  description?: string | { type?: string; value: string };
  covers?: number[];
  subjects?: string[];
  authors?: OpenLibraryWorkAuthorRef[];
  first_publish_date?: string;
}

export interface OpenLibraryRatingsResponse {
  summary?: {
    average?: number | null;
    count?: number;
  };
}

export interface OpenLibraryAuthorResponse {
  name: string;
  personal_name?: string;
  key?: string;
}

export interface Book {
  id: string;
  title: string;
  authors: string[];
  category: string;
  description: string;
  publishedYear: string;
  pageCount: number | null;
  coverUrl: string;
  /** Average reader rating out of 5, when Open Library has one */
  rating?: number | null;
  ratingCount?: number | null;
}

export type ShelfStatus = 'want-to-read' | 'reading' | 'finished';

export interface ShelfBook extends Book {
  status: ShelfStatus;
  addedAt: number;
}
