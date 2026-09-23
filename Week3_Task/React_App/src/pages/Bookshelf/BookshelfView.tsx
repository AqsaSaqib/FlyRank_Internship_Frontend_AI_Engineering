import React from 'react';
import { Link } from 'react-router-dom';
import { useBookshelfViewModel } from './useBookshelfViewModel';
import { ShelfStatus } from '../../types/book';
import { BookCard } from '../../components/BookCard';

export const BookshelfView: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    filteredBooks,
    stats,
    totalShelfCount,
    handleStatusChange,
    handleRemoveBook,
  } = useBookshelfViewModel();

  return (
    <div className="container">
      {/* Page Header */}
      <div className="bookshelf-header">
        <h1 className="bookshelf-title">My Bookshelf</h1>
        <p className="bookshelf-subtitle">Track, organize, and manage your personal reading journey.</p>
      </div>

      {/* Top Stats Dashboard */}
      <section className="stats-dashboard" aria-label="Reading Statistics">
        <div className="stat-card">
          <span className="stat-icon" aria-hidden="true">📚</span>
          <div className="stat-data">
            <span className="stat-value">{stats.total}</span>
            <span className="stat-label">Total Books</span>
          </div>
        </div>

        <div className="stat-card stat-card-reading">
          <span className="stat-icon" aria-hidden="true">📖</span>
          <div className="stat-data">
            <span className="stat-value">{stats.reading}</span>
            <span className="stat-label">Currently Reading</span>
          </div>
        </div>

        <div className="stat-card stat-card-finished">
          <span className="stat-icon" aria-hidden="true">✅</span>
          <div className="stat-data">
            <span className="stat-value">{stats.finished}</span>
            <span className="stat-label">Finished Books</span>
          </div>
        </div>
      </section>

      {/* When the whole shelf is completely empty */}
      {totalShelfCount === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon" aria-hidden="true">🪴</div>
          <h2 className="empty-state-title">Your bookshelf is empty</h2>
          <p className="empty-state-desc">
            You haven't saved any books yet. Explore our library to find your next great read and add it to your shelf.
          </p>
          <Link to="/" className="btn btn-primary">
            <span>Explore & Search Books</span>
          </Link>
        </div>
      ) : (
        <section className="shelf-content">
          {/* Filter Tabs */}
          <div className="shelf-tabs" role="tablist" aria-label="Bookshelf Filter Tabs">
            <button
              type="button"
              role="tab"
              id="shelf-tab-all"
              aria-controls="shelf-tabpanel"
              aria-selected={activeTab === 'all'}
              className={`shelf-tab-btn ${activeTab === 'all' ? 'active' : ''}`}
              onClick={() => setActiveTab('all')}
            >
              <span>All</span>
              <span className="tab-pill">{stats.total}</span>
            </button>

            <button
              type="button"
              role="tab"
              id="shelf-tab-want-to-read"
              aria-controls="shelf-tabpanel"
              aria-selected={activeTab === 'want-to-read'}
              className={`shelf-tab-btn ${activeTab === 'want-to-read' ? 'active' : ''}`}
              onClick={() => setActiveTab('want-to-read')}
            >
              <span>Want to Read</span>
              <span className="tab-pill">{stats.wantToRead}</span>
            </button>

            <button
              type="button"
              role="tab"
              id="shelf-tab-reading"
              aria-controls="shelf-tabpanel"
              aria-selected={activeTab === 'reading'}
              className={`shelf-tab-btn ${activeTab === 'reading' ? 'active' : ''}`}
              onClick={() => setActiveTab('reading')}
            >
              <span>Reading</span>
              <span className="tab-pill">{stats.reading}</span>
            </button>

            <button
              type="button"
              role="tab"
              id="shelf-tab-finished"
              aria-controls="shelf-tabpanel"
              aria-selected={activeTab === 'finished'}
              className={`shelf-tab-btn ${activeTab === 'finished' ? 'active' : ''}`}
              onClick={() => setActiveTab('finished')}
            >
              <span>Finished</span>
              <span className="tab-pill">{stats.finished}</span>
            </button>
          </div>

          {/* Filtered Results Panel */}
          <div
            id="shelf-tabpanel"
            role="tabpanel"
            aria-labelledby={`shelf-tab-${activeTab}`}
          >
            {filteredBooks.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon" aria-hidden="true">🔍</div>
                <h3 className="empty-state-title">No books in this section</h3>
                <p className="empty-state-desc">
                  You don't have any books marked as "{activeTab}".
                </p>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setActiveTab('all')}
                >
                  View All Books
                </button>
              </div>
            ) : (
              <div className="books-grid">
                {filteredBooks.map((book) => (
                  <BookCard
                    key={book.id}
                    book={book}
                    actions={
                      <>
                        <select
                          className="status-select"
                          value={book.status}
                          onChange={(e) =>
                            handleStatusChange(book.id, e.target.value as ShelfStatus)
                          }
                          aria-label={`Update reading status for ${book.title}`}
                        >
                          <option value="want-to-read">🔖 Want to Read</option>
                          <option value="reading">📖 Reading</option>
                          <option value="finished">✅ Finished</option>
                        </select>

                        <button
                          type="button"
                          className="btn btn-danger btn-sm"
                          onClick={() => handleRemoveBook(book.id, book.title)}
                          aria-label={`Remove ${book.title} from bookshelf`}
                          title="Remove from shelf"
                        >
                          Remove
                        </button>
                      </>
                    }
                  />
                ))}
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
};
