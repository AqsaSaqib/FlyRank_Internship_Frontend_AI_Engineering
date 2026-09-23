import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { Book, ShelfStatus } from '../types/book';
import { getBookTags } from '../utils/bookMeta';
import { BookTags, PriceTag, StarRating } from './BookMeta';
import { StatusBadge } from './StatusBadge';

export interface QuickViewModalProps {
  book: Book;
  shelfStatus?: ShelfStatus | null;
  onAddToShelf?: (book: Book, status: ShelfStatus) => void;
  onClose: () => void;
}

export const QuickViewModal: React.FC<QuickViewModalProps> = ({
  book,
  shelfStatus,
  onAddToShelf,
  onClose,
}) => {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const titleId = `quick-view-title-${book.id}`;

  // Focus the dialog, close on Escape, lock page scroll, and restore focus on close
  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    closeButtonRef.current?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus();
    };
  }, [onClose]);

  const authorsText = book.authors.length > 0 ? book.authors.join(', ') : 'Unknown author';

  return createPortal(
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          ref={closeButtonRef}
          type="button"
          className="modal-close"
          onClick={onClose}
          aria-label="Close quick view"
        >
          ✕
        </button>

        <div className="modal-cover-wrap">
          <img src={book.coverUrl} alt={`Cover of ${book.title}`} className="modal-cover" />
        </div>

        <div className="modal-body">
          <BookTags tags={getBookTags(book)} />
          {book.category && <span className="book-card-category">{book.category}</span>}
          <h2 id={titleId} className="modal-title">{book.title}</h2>
          <p className="modal-authors">By {authorsText}</p>

          <StarRating rating={book.rating} count={book.ratingCount} size="md" />
          <PriceTag book={book} size="lg" />

          <dl className="modal-meta">
            <div>
              <dt>Published</dt>
              <dd>{book.publishedYear}</dd>
            </div>
            <div>
              <dt>Pages</dt>
              <dd>{book.pageCount ?? 'N/A'}</dd>
            </div>
          </dl>

          <div className="modal-actions">
            {shelfStatus ? (
              <StatusBadge status={shelfStatus} />
            ) : onAddToShelf ? (
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => onAddToShelf(book, 'want-to-read')}
              >
                <span aria-hidden="true">+</span>
                <span>Add to Shelf</span>
              </button>
            ) : null}
            <Link
              to={`/book/${book.id}`}
              state={{ publishedYear: book.publishedYear }}
              className="btn btn-outline"
              onClick={onClose}
            >
              View Full Details
            </Link>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
