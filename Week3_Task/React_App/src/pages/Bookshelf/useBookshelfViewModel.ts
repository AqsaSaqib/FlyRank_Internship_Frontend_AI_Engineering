import { useState, useMemo } from 'react';
import { ShelfBook, ShelfStatus } from '../../types/book';
import { useBookshelf } from '../../context/BookshelfContext';
import {
  ShelfFilterTab,
  ShelfStats,
  calculateShelfStats,
  filterShelf,
  getRemoveConfirmationMessage,
} from './BookshelfModel';

export interface UseBookshelfViewModelReturn {
  activeTab: ShelfFilterTab;
  setActiveTab: (tab: ShelfFilterTab) => void;
  filteredBooks: ShelfBook[];
  stats: ShelfStats;
  totalShelfCount: number;
  handleStatusChange: (bookId: string, status: ShelfStatus) => void;
  handleRemoveBook: (bookId: string, bookTitle: string) => void;
}

export function useBookshelfViewModel(): UseBookshelfViewModelReturn {
  const { shelf, updateStatus, removeFromShelf } = useBookshelf();
  const [activeTab, setActiveTab] = useState<ShelfFilterTab>('all');

  const stats = useMemo(() => calculateShelfStats(shelf), [shelf]);

  const filteredBooks = useMemo(() => filterShelf(shelf, activeTab), [shelf, activeTab]);

  const handleStatusChange = (bookId: string, status: ShelfStatus) => {
    updateStatus(bookId, status);
  };

  const handleRemoveBook = (bookId: string, bookTitle: string) => {
    const confirmation = window.confirm(getRemoveConfirmationMessage(bookTitle));
    if (confirmation) {
      removeFromShelf(bookId);
    }
  };

  return {
    activeTab,
    setActiveTab,
    filteredBooks,
    stats,
    totalShelfCount: shelf.length,
    handleStatusChange,
    handleRemoveBook,
  };
}
