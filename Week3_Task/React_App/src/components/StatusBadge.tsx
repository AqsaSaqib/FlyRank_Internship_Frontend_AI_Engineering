import React from 'react';
import { ShelfStatus } from '../types/book';

export interface StatusBadgeProps {
  status: ShelfStatus;
}

const STATUS_LABELS: Record<ShelfStatus, string> = {
  'want-to-read': 'Want to Read',
  'reading': 'Reading',
  'finished': 'Finished',
};

const STATUS_ICONS: Record<ShelfStatus, string> = {
  'want-to-read': '🔖',
  'reading': '📖',
  'finished': '✅',
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  return (
    <span className={`status-badge ${status}`} aria-label={`Status: ${STATUS_LABELS[status]}`}>
      <span aria-hidden="true">{STATUS_ICONS[status]}</span>
      <span>{STATUS_LABELS[status]}</span>
    </span>
  );
};
