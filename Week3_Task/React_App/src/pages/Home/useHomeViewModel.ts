import { useState, useRef, useEffect, FormEvent } from 'react';
import { Book, ShelfStatus } from '../../types/book';
import { searchBooks } from '../../services/booksService';
import { useBookshelf } from '../../context/BookshelfContext';
import { validateSearchQuery } from './HomeModel';

export type SearchState = 'idle' | 'loading' | 'success' | 'empty' | 'error';

export interface UseHomeViewModelReturn {
  query: string;
  setQuery: (val: string) => void;
  searchState: SearchState;
  books: Book[];
  validationError: string | null;
  errorMessage: string | null;
  lastSearchedQuery: string;
  isLoading: boolean;
  handleSubmit: (e: FormEvent<HTMLFormElement>) => void;
  handleClearSearch: () => void;
  handleAddToShelf: (book: Book, status?: ShelfStatus) => void;
  getBookShelfStatus: (bookId: string) => ShelfStatus | null;
}

export function useHomeViewModel(): UseHomeViewModelReturn {
  const [query, setQuery] = useState('');
  const [searchState, setSearchState] = useState<SearchState>('idle');
  const [books, setBooks] = useState<Book[]>([]);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastSearchedQuery, setLastSearchedQuery] = useState('');

  const { addToShelf, getShelfStatus } = useBookshelf();

  const activeAbortControllerRef = useRef<AbortController | null>(null);
  const isSearchingRef = useRef(false);

  useEffect(() => {
    return () => {
      // Clean up in-flight requests on unmount
      if (activeAbortControllerRef.current) {
        activeAbortControllerRef.current.abort();
      }
    };
  }, []);

  const handleQueryChange = (val: string) => {
    setQuery(val);
    if (validationError) {
      setValidationError(null);
    }
  };

  const handleClearSearch = () => {
    setQuery('');
    setValidationError(null);
    setErrorMessage(null);
    setSearchState('idle');
    setBooks([]);
    setLastSearchedQuery('');
    if (activeAbortControllerRef.current) {
      activeAbortControllerRef.current.abort();
      activeAbortControllerRef.current = null;
    }
    isSearchingRef.current = false;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Prevent duplicate searches while one is actively loading
    if (isSearchingRef.current) {
      return;
    }

    const validation = validateSearchQuery(query);
    if (!validation.isValid) {
      setValidationError(validation.errorMessage);
      return;
    }

    setValidationError(null);
    setErrorMessage(null);
    setSearchState('loading');
    setLastSearchedQuery(validation.trimmedQuery);
    isSearchingRef.current = true;

    if (activeAbortControllerRef.current) {
      activeAbortControllerRef.current.abort();
    }
    const abortController = new AbortController();
    activeAbortControllerRef.current = abortController;

    try {
      const results = await searchBooks(validation.trimmedQuery, abortController.signal);
      setBooks(results);
      setSearchState(results.length > 0 ? 'success' : 'empty');
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        return; // Search was cancelled or superseded
      }
      const message = err instanceof Error ? err.message : 'An unexpected error occurred while searching.';
      setErrorMessage(message);
      setSearchState('error');
    } finally {
      isSearchingRef.current = false;
    }
  };

  const handleAddToShelf = (book: Book, status: ShelfStatus = 'want-to-read') => {
    addToShelf(book, status);
  };

  return {
    query,
    setQuery: handleQueryChange,
    searchState,
    books,
    validationError,
    errorMessage,
    lastSearchedQuery,
    isLoading: searchState === 'loading',
    handleSubmit,
    handleClearSearch,
    handleAddToShelf,
    getBookShelfStatus: getShelfStatus,
  };
}
