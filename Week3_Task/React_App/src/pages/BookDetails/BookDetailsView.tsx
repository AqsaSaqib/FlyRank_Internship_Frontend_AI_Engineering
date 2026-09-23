import React from 'react';
import { Link } from 'react-router-dom';
import { useBookDetailsViewModel } from './useBookDetailsViewModel';
import { ShelfStatus } from '../../types/book';
import { getBookTags } from '../../utils/bookMeta';
import { BookTags, PriceTag, StarRating } from '../../components/BookMeta';

export const BookDetailsView: React.FC = () => {
  const {
    book,
    status,
    errorMessage,
    formattedAuthors,
    formattedPages,
    publishedYear,
    isOnShelf,
    shelfStatus,
    retryFetch,
    handleAddToShelf,
    handleUpdateStatus,
    handleRemoveFromShelf,
  } = useBookDetailsViewModel();

  if (status === 'loading') {
    return (
      <div className="container" style={{ padding: '4rem 1rem', textAlign: 'center' }}>
        <div className="spinner" />
        <p className="loading-text">Loading book details...</p>
      </div>
    );
  }

  if (status === 'not-found' || !book) {
    return (
      <div className="container">
        <div className="empty-state">
          <div className="empty-state-icon" aria-hidden="true">📕</div>
          <h1 className="empty-state-title">Book Not Found</h1>
          <p className="empty-state-desc">
            {errorMessage || "The book you are looking for could not be found or does not exist."}
          </p>
          <Link to="/" className="btn btn-primary">
            ← Back to Search
          </Link>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="container">
        <div className="empty-state error-state">
          <div className="empty-state-icon" aria-hidden="true">⚠️</div>
          <h1 className="empty-state-title">Error Loading Book</h1>
          <p className="empty-state-desc">{errorMessage}</p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <button type="button" className="btn btn-primary" onClick={retryFetch}>
              Try Again
            </button>
            <Link to="/" className="btn btn-outline">
              ← Back to Search
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="book-details-nav">
        <Link to="/" className="back-link" aria-label="Back to search">
          <span aria-hidden="true">←</span>
          <span>Back to Search</span>
        </Link>
      </div>

      <article className="book-details-layout">
        {/* Cover Column */}
        <div className="book-details-cover-col">
          <div className="book-details-cover-wrap">
            <img
              src={book.coverUrl}
              alt={`Cover of ${book.title}`}
              className="book-details-cover"
            />
          </div>

          <div className="book-details-actions">
            {isOnShelf ? (
              <div className="details-shelf-control">
                <label htmlFor="details-shelf-status" className="control-label">
                  Reading Status:
                </label>
                <select
                  id="details-shelf-status"
                  className="status-select"
                  style={{ width: '100%', padding: '0.65rem 0.85rem' }}
                  value={shelfStatus || 'want-to-read'}
                  onChange={(e) => handleUpdateStatus(e.target.value as ShelfStatus)}
                  aria-label="Change reading status"
                >
                  <option value="want-to-read">🔖 Want to Read</option>
                  <option value="reading">📖 Reading</option>
                  <option value="finished">✅ Finished</option>
                </select>

                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  style={{ width: '100%', marginTop: '0.5rem', color: 'var(--danger-color)', borderColor: 'var(--danger-border)' }}
                  onClick={handleRemoveFromShelf}
                  aria-label={`Remove ${book.title} from shelf`}
                >
                  Remove from Shelf
                </button>
              </div>
            ) : (
              <button
                type="button"
                className="btn btn-primary btn-full"
                onClick={() => handleAddToShelf('want-to-read')}
                aria-label={`Add ${book.title} to bookshelf`}
              >
                <span aria-hidden="true">+</span>
                <span>Add to Shelf</span>
              </button>
            )}
          </div>
        </div>

        {/* Info Column */}
        <div className="book-details-info-col">
          <div className="book-details-header">
            {book.category && (
              <span className="book-card-category" style={{ fontSize: '0.85rem' }}>
                {book.category}
              </span>
            )}
            <h1 className="book-details-title">{book.title}</h1>
            <p className="book-details-authors">By {formattedAuthors}</p>
            <BookTags tags={getBookTags(book)} />
            <div className="book-details-rating-row">
              <StarRating rating={book.rating} count={book.ratingCount} size="md" />
              <PriceTag book={book} size="lg" />
            </div>
          </div>

          {/* Quick Metadata Grid */}
          <div className="book-metadata-grid">
            <div className="metadata-item">
              <span className="metadata-label">Category</span>
              <span className="metadata-value">{book.category}</span>
            </div>
            <div className="metadata-item">
              <span className="metadata-label">Pages</span>
              <span className="metadata-value">{formattedPages}</span>
            </div>
            {publishedYear && (
              <div className="metadata-item">
                <span className="metadata-label">Published</span>
                <span className="metadata-value">{publishedYear}</span>
              </div>
            )}
            <div className="metadata-item">
              <span className="metadata-label">Work ID</span>
              <span className="metadata-value">{book.id}</span>
            </div>
          </div>

          {/* Description Section */}
          <div className="book-description-section">
            <h2 className="section-title">Overview</h2>
            <div className="book-description-body">
              {book.description.split('\n\n').map((paragraph, idx) => (
                <p key={idx} className="book-desc-paragraph">
                  {paragraph}
                </p>
              ))}
            </div>
          </div>
        </div>
      </article>
    </div>
  );
};
