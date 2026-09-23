import React, { useState } from 'react';
import { NavLink, Link } from 'react-router-dom';

export interface HeaderProps {
  shelfCount?: number;
}

type Theme = 'light' | 'dark';

const THEME_STORAGE_KEY = 'booknest-theme';

/** Resolves the active theme from the user's saved choice, falling back to the OS setting. */
function getInitialTheme(): Theme {
  const saved = document.documentElement.dataset.theme;
  if (saved === 'light' || saved === 'dark') return saved;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export const Header: React.FC<HeaderProps> = ({ shelfCount = 0 }) => {
  const [theme, setTheme] = useState<Theme>(getInitialTheme);

  const toggleTheme = () => {
    const next: Theme = theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // Storage unavailable (e.g. private mode) — theme still applies for this visit
    }
    setTheme(next);
  };

  return (
    <header className="header" role="banner">
      <div className="container header-inner">
        <Link to="/" className="logo" aria-label="BookNest Home">
          <span className="logo-icon" aria-hidden="true">📖</span>
          <span>BookNest</span>
        </Link>

        <nav className="nav-links" aria-label="Primary Navigation">
          <NavLink
            to="/"
            end
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            aria-label="Search Books"
          >
            <span aria-hidden="true">🔍</span>
            <span>Search</span>
          </NavLink>

          <NavLink
            to="/bookshelf"
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            aria-label={`My Bookshelf, ${shelfCount} books saved`}
          >
            <span aria-hidden="true">📚</span>
            <span>My Bookshelf</span>
            {shelfCount > 0 && (
              <span className="badge-count" aria-label={`${shelfCount} books`}>
                {shelfCount}
              </span>
            )}
          </NavLink>

          <button
            type="button"
            className="theme-toggle"
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
          >
            <span aria-hidden="true">{theme === 'dark' ? '☀️' : '🌙'}</span>
          </button>
        </nav>
      </div>
    </header>
  );
};
