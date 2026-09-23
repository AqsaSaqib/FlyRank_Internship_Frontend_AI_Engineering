import React from 'react';
import { Book } from '../types/book';
import { BOOK_TAG_LABELS, BookTag, formatPrice, getBookPrice } from '../utils/bookMeta';

export interface StarRatingProps {
  rating?: number | null;
  count?: number | null;
  size?: 'sm' | 'md';
}

export const StarRating: React.FC<StarRatingProps> = ({ rating, count, size = 'sm' }) => {
  if (!rating) {
    return <span className={`star-rating star-rating-${size} is-empty`}>No ratings yet</span>;
  }

  const fillPercent = Math.min(100, Math.max(0, (rating / 5) * 100));

  return (
    <span
      className={`star-rating star-rating-${size}`}
      aria-label={`Rated ${rating.toFixed(1)} out of 5${count ? ` by ${count} readers` : ''}`}
    >
      <span className="stars" aria-hidden="true">
        <span className="stars-base">★★★★★</span>
        <span className="stars-fill" style={{ width: `${fillPercent}%` }}>★★★★★</span>
      </span>
      <span className="rating-value" aria-hidden="true">{rating.toFixed(1)}</span>
      {count ? (
        <span className="rating-count" aria-hidden="true">({count.toLocaleString()})</span>
      ) : null}
    </span>
  );
};

export interface PriceTagProps {
  book: Book;
  size?: 'sm' | 'lg';
}

export const PriceTag: React.FC<PriceTagProps> = ({ book, size = 'sm' }) => {
  const { price, originalPrice } = getBookPrice(book);

  return (
    <span className={`price-tag price-tag-${size}`}>
      <span className="book-card-price">{formatPrice(price)}</span>
      {originalPrice !== null && (
        <span className="price-original" aria-label={`Was ${formatPrice(originalPrice)}`}>
          {formatPrice(originalPrice)}
        </span>
      )}
    </span>
  );
};

export interface BookTagsProps {
  tags: BookTag[];
  className?: string;
}

export const BookTags: React.FC<BookTagsProps> = ({ tags, className = '' }) => {
  if (tags.length === 0) return null;

  return (
    <div className={`book-tags ${className}`}>
      {tags.map((tag) => (
        <span key={tag} className={`book-tag ${tag}`}>
          {BOOK_TAG_LABELS[tag]}
        </span>
      ))}
    </div>
  );
};
