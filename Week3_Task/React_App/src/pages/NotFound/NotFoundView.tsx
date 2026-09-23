import React from 'react';
import { Link } from 'react-router-dom';

export const NotFoundView: React.FC = () => {
  return (
    <div className="container" style={{ padding: '4rem 1rem', textAlign: 'center' }}>
      <div className="empty-state">
        <div className="empty-state-icon" aria-hidden="true">🍂</div>
        <h1 className="empty-state-title" style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>
          404 - Page Not Found
        </h1>
        <p className="empty-state-desc" style={{ maxWidth: '400px', margin: '0 auto 2rem' }}>
          We couldn't find the page you're looking for. It might have been moved or doesn't exist.
        </p>
        <Link to="/" className="btn btn-primary">
          <span>Return to Search</span>
        </Link>
      </div>
    </div>
  );
};
