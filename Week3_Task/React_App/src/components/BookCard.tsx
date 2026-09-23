import React, { useCallback, useState } from 'react';
import { Link } from 'react-router-dom';
import { Book, ShelfStatus } from '../types/book';
import { getBookTags } from '../utils/bookMeta';
import { BookTags, PriceTag, StarRating } from './BookMeta';
import { QuickViewModal } from './QuickViewModal';
import { StatusBadge } from './StatusBadge';

export interface BookCardProps {
  book: Book;
  shelfStatus?: ShelfStatus | null;
  onAddToShelf?: (book: Book, status: ShelfStatus) => void;
  actions?: React.ReactNode;
}

export const BookCard: React.FC<BookCardProps> = ({
  book,
  shelfStatus,
  onAddToShelf,
  actions,
}) => {
  const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);
  const closeQuickView = useCallback(() => setIsQuickViewOpen(false), []);

  const handleAddClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (onAddToShelf) {
      onAddToShelf(book, 'want-to-read');
    }
  };

  const authorsText = book.authors && book.authors.length > 0
    ? book.authors.join(', ')
    : 'Unknown author';

  return (
    <article className="book-card" aria-label={book.title}>
      <Link to={`/book/${book.id}`} state={{ publishedYear: book.publishedYear }} className="book-card-link">
        <div className="book-card-cover-wrap">
          <img
            src={book.coverUrl}
            alt={`Cover of ${book.title}`}
            className="book-card-cover"
            loading="lazy"
          />
          <BookTags tags={getBookTags(book).slice(0, 2)} className="book-card-tags" />
        </div>
        <div className="book-card-body">
          {book.category && (
            <span className="book-card-category">{book.category}</span>
          )}
          <h3 className="book-card-title" title={book.title}>
            {book.title}
          </h3>
          <p className="book-card-authors" title={authorsText}>
            {authorsText}
          </p>
          <StarRating rating={book.rating} count={book.ratingCount} />
          <div className="book-card-meta-row">
            <PriceTag book={book} />
            <span className="book-card-year">{book.publishedYear}</span>
          </div>
        </div>
      </Link>

      <button
        type="button"
        className="quick-view-btn"
        onClick={() => setIsQuickViewOpen(true)}
        aria-label={`Quick view ${book.title}`}
        title="Quick view"
      >
        <span aria-hidden="true">👁</span>
      </button>

      <div className={`book-card-footer ${actions ? 'shelf-card-footer' : ''}`}>
        {actions ? (
          actions
        ) : shelfStatus ? (
          <StatusBadge status={shelfStatus} />
        ) : (
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={handleAddClick}
            aria-label={`Add ${book.title} to shelf`}
          >
            <span aria-hidden="true">+</span>
            <span>Add to Shelf</span>
          </button>
        )}
      </div>

      {isQuickViewOpen && (
        <QuickViewModal
          book={book}
          shelfStatus={shelfStatus}
          onAddToShelf={onAddToShelf}
          onClose={closeQuickView}
        />
      )}
    </article>
  );
};
