import { useState, useEffect, useMemo } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { Book, ShelfStatus } from '../../types/book';
import { getBookById } from '../../services/booksService';
import { useBookshelf } from '../../context/BookshelfContext';
import {
  formatAuthors,
  formatPageCount,
  getRemoveConfirmationMessage,
  resolvePublishedYear,
} from './BookDetailsModel';

export type BookDetailsStatus = 'loading' | 'success' | 'error' | 'not-found';

export interface UseBookDetailsViewModelReturn {
  book: Book | null;
  status: BookDetailsStatus;
  errorMessage: string | null;
  formattedAuthors: string;
  formattedPages: string;
  publishedYear: string | null;
  isOnShelf: boolean;
  shelfStatus: ShelfStatus | null;
  retryFetch: () => void;
  handleAddToShelf: (status?: ShelfStatus) => void;
  handleUpdateStatus: (status: ShelfStatus) => void;
  handleRemoveFromShelf: () => void;
}

export function useBookDetailsViewModel(): UseBookDetailsViewModelReturn {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const locationState = location.state as { publishedYear?: string } | null;

  const [book, setBook] = useState<Book | null>(null);
  const [status, setStatus] = useState<BookDetailsStatus>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fetchTrigger, setFetchTrigger] = useState(0);

  const { shelf, addToShelf, updateStatus, removeFromShelf, getShelfStatus } = useBookshelf();

  useEffect(() => {
    let isMounted = true;
    const abortController = new AbortController();

    if (!id || id.trim() === '') {
      setStatus('not-found');
      setErrorMessage('No book identifier provided.');
      return;
    }

    setStatus('loading');
    setErrorMessage(null);

    async function loadBook() {
      try {
        const fetchedBook = await getBookById(id!, abortController.signal);
        if (!isMounted) return;

        setBook(fetchedBook);
        setStatus('success');
      } catch (err: unknown) {
        if (!isMounted) return;

        if (err instanceof DOMException && err.name === 'AbortError') {
          return;
        }

        if (err instanceof Error && err.message === 'Book not found.') {
          setStatus('not-found');
          setErrorMessage('Book not found.');
        } else {
          setStatus('error');
          const message = err instanceof Error
            ? err.message
            : 'Could not fetch book details. Please check your connection and try again.';
          setErrorMessage(message);
        }
      }
    }

    void loadBook();

    return () => {
      isMounted = false;
      abortController.abort();
    };
  }, [id, fetchTrigger]);

  const retryFetch = () => {
    setFetchTrigger((prev) => prev + 1);
  };

  const shelfItem = useMemo(() => {
    if (!id) return undefined;
    return shelf.find((item) => item.id === id);
  }, [shelf, id]);

  const resolvedYear = useMemo(() => {
    return resolvePublishedYear(
      book?.publishedYear,
      shelfItem?.publishedYear,
      locationState?.publishedYear
    );
  }, [book?.publishedYear, shelfItem?.publishedYear, locationState?.publishedYear]);

  const currentShelfStatus = id ? getShelfStatus(id) : null;
  const isBookOnShelf = currentShelfStatus !== null;

  const handleAddToShelf = (shelfStatus: ShelfStatus = 'want-to-read') => {
    if (book) {
      const bookToSave: Book = {
        ...book,
        publishedYear: resolvedYear || 'Unknown year',
      };
      addToShelf(bookToSave, shelfStatus);
    }
  };

  const handleUpdateStatus = (newStatus: ShelfStatus) => {
    if (id) {
      updateStatus(id, newStatus);
    }
  };

  const handleRemoveFromShelf = () => {
    if (id) {
      const confirmRemove = window.confirm(getRemoveConfirmationMessage(book?.title || 'this book'));
      if (confirmRemove) {
        removeFromShelf(id);
      }
    }
  };

  const formattedAuthors = formatAuthors(book?.authors);
  const formattedPages = formatPageCount(book?.pageCount ?? null);

  return {
    book,
    status,
    errorMessage,
    formattedAuthors,
    formattedPages,
    publishedYear: resolvedYear,
    isOnShelf: isBookOnShelf,
    shelfStatus: currentShelfStatus,
    retryFetch,
    handleAddToShelf,
    handleUpdateStatus,
    handleRemoveFromShelf,
  };
}
