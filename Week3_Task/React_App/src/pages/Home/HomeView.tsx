import React from 'react';
import { useHomeViewModel } from './useHomeViewModel';
import { BookCard } from '../../components/BookCard';

export const HomeView: React.FC = () => {
  const {
    query,
    setQuery,
    searchState,
    books,
    validationError,
    errorMessage,
    lastSearchedQuery,
    isLoading,
    handleSubmit,
    handleClearSearch,
    handleAddToShelf,
    getBookShelfStatus,
  } = useHomeViewModel();

  return (
    <div className="container">
      {/* Hero / Search Section */}
      <section className="search-hero" aria-label="Book Search Header">
        <h1 className="search-hero-title">Discover Your Next Favorite Read</h1>
        <p className="search-hero-subtitle">
          Search millions of books from Open Library, explore authors, and curate your personal bookshelf.
        </p>

        <form className="search-form" onSubmit={handleSubmit} role="search" noValidate>
          <div className="search-input-wrap">
            <span className="search-icon" aria-hidden="true">🔍</span>
            <input
              type="text"
              className={`search-input ${validationError ? 'has-error' : ''}`}
              placeholder="Search by book title, author, or keyword..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              disabled={isLoading}
              aria-label="Search books"
              aria-invalid={!!validationError}
              aria-describedby={validationError ? 'search-validation-error' : undefined}
            />
            {query.length > 0 && (
              <button
                type="button"
                className="search-clear-btn"
                onClick={handleClearSearch}
                aria-label="Clear search query"
              >
                ✕
              </button>
            )}
          </div>

          <button
            type="submit"
            className="btn btn-primary search-submit-btn"
            disabled={isLoading}
          >
            {isLoading ? 'Searching...' : 'Search'}
          </button>
        </form>

        {validationError && (
          <p id="search-validation-error" className="form-error-msg" role="alert">
            <span aria-hidden="true">⚠️</span> {validationError}
          </p>
        )}
      </section>

      {/* Main Content States */}
      <section className="search-results-section" aria-live="polite">
        {/* Welcome / Idle State */}
        {searchState === 'idle' && (
          <div className="welcome-state">
            <div className="welcome-card">
              <span className="welcome-icon" aria-hidden="true">📚</span>
              <h3>Start Exploring</h3>
              <p>Type at least 2 characters in the search bar above to look up titles, authors, or genres.</p>
            </div>
            <div className="welcome-features">
              <div className="feature-pill">✨ Instant Search</div>
              <div className="feature-pill">📖 Full Details & Descriptions</div>
              <div className="feature-pill">🔖 Personal Local Bookshelf</div>
            </div>
          </div>
        )}

        {/* Loading Spinner */}
        {searchState === 'loading' && (
          <div className="loading-container" aria-label="Loading search results">
            <div className="spinner" />
            <p className="loading-text">Searching books for "{lastSearchedQuery}"...</p>
          </div>
        )}

        {/* Error State */}
        {searchState === 'error' && (
          <div className="empty-state error-state" role="alert">
            <div className="empty-state-icon" aria-hidden="true">⚠️</div>
            <h2 className="empty-state-title">Something went wrong</h2>
            <p className="empty-state-desc">{errorMessage}</p>
          </div>
        )}

        {/* Empty / No Books Found State */}
        {searchState === 'empty' && (
          <div className="empty-state">
            <div className="empty-state-icon" aria-hidden="true">🔍</div>
            <h2 className="empty-state-title">No books found</h2>
            <p className="empty-state-desc">
              We couldn't find any books matching "{lastSearchedQuery}". Try checking for typos or searching with different keywords.
            </p>
          </div>
        )}

        {/* Success / Results Grid */}
        {searchState === 'success' && (
          <div>
            <div className="results-header">
              <h2 className="results-title">
                Search Results for <span className="results-highlight">"{lastSearchedQuery}"</span>
              </h2>
              <span className="results-count">{books.length} books found</span>
            </div>

            <div className="books-grid">
              {books.map((book) => (
                <BookCard
                  key={book.id}
                  book={book}
                  shelfStatus={getBookShelfStatus(book.id)}
                  onAddToShelf={handleAddToShelf}
                />
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
};
