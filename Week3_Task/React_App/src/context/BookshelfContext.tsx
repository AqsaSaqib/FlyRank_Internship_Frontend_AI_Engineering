import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { Book, ShelfBook, ShelfStatus } from '../types/book';
import * as bookshelfStorage from '../services/bookshelfStorage';

export interface BookshelfContextType {
  shelf: ShelfBook[];
  totalCount: number;
  addToShelf: (book: Book, status?: ShelfStatus) => void;
  updateStatus: (bookId: string, status: ShelfStatus) => void;
  removeFromShelf: (bookId: string) => void;
  getShelfStatus: (bookId: string) => ShelfStatus | null;
  isOnShelf: (bookId: string) => boolean;
}

const BookshelfContext = createContext<BookshelfContextType | null>(null);

export const BookshelfProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [shelf, setShelf] = useState<ShelfBook[]>(() => bookshelfStorage.getShelf());

  // Keep state in sync with external storage changes (e.g. other tabs)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'booknest:bookshelf') {
        setShelf(bookshelfStorage.getShelf());
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const handleAddToShelf = useCallback((book: Book, status: ShelfStatus = 'want-to-read') => {
    const updated = bookshelfStorage.addToShelf(book, status);
    setShelf(updated);
  }, []);

  const handleUpdateStatus = useCallback((bookId: string, status: ShelfStatus) => {
    const updated = bookshelfStorage.updateShelfStatus(bookId, status);
    setShelf(updated);
  }, []);

  const handleRemoveFromShelf = useCallback((bookId: string) => {
    const updated = bookshelfStorage.removeFromShelf(bookId);
    setShelf(updated);
  }, []);

  const getShelfStatus = useCallback(
    (bookId: string): ShelfStatus | null => {
      const found = shelf.find((item) => item.id === bookId);
      return found ? found.status : null;
    },
    [shelf]
  );

  const isOnShelf = useCallback(
    (bookId: string): boolean => {
      return shelf.some((item) => item.id === bookId);
    },
    [shelf]
  );

  const totalCount = shelf.length;

  const value = useMemo(
    () => ({
      shelf,
      totalCount,
      addToShelf: handleAddToShelf,
      updateStatus: handleUpdateStatus,
      removeFromShelf: handleRemoveFromShelf,
      getShelfStatus,
      isOnShelf,
    }),
    [shelf, totalCount, handleAddToShelf, handleUpdateStatus, handleRemoveFromShelf, getShelfStatus, isOnShelf]
  );

  return <BookshelfContext.Provider value={value}>{children}</BookshelfContext.Provider>;
};

export function useBookshelf(): BookshelfContextType {
  const context = useContext(BookshelfContext);
  if (!context) {
    throw new Error('useBookshelf must be used within a BookshelfProvider');
  }
  return context;
}
