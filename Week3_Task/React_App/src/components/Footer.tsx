import React from 'react';
import { Link } from 'react-router-dom';

export const Footer: React.FC = () => {
  const year = new Date().getFullYear();

  return (
    <footer className="footer" role="contentinfo">
      <div className="container footer-inner">
        <div className="footer-brand">
          <Link to="/" className="logo footer-logo" aria-label="BookNest Home">
            <span className="logo-icon" aria-hidden="true">📖</span>
            <span>BookNest</span>
          </Link>
          <p className="footer-tagline">
            Your cozy corner for discovering books, tracking your reading, and building a shelf you love.
          </p>
        </div>

        <nav className="footer-col" aria-label="Footer Navigation">
          <h3 className="footer-heading">Explore</h3>
          <Link to="/" className="footer-link">Search Books</Link>
          <Link to="/bookshelf" className="footer-link">My Bookshelf</Link>
        </nav>

        <div className="footer-col">
          <h3 className="footer-heading">Resources</h3>
          <a href="https://openlibrary.org" target="_blank" rel="noopener noreferrer" className="footer-link">
            Open Library ↗
          </a>
          <a href="https://openlibrary.org/developers/api" target="_blank" rel="noopener noreferrer" className="footer-link">
            Books API ↗
          </a>
        </div>
      </div>

      <div className="container footer-bottom">
        <span>© {year} BookNest. All rights reserved.</span>
        <span>Book data &amp; ratings from Open Library · Prices shown are for demo purposes.</span>
      </div>
    </footer>
  );
};
