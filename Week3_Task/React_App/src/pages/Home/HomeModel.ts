export interface SearchValidationResult {
  isValid: boolean;
  errorMessage: string | null;
  trimmedQuery: string;
}

/**
 * Validates the search input query according to business rules:
 * - Query must be at least 2 characters after trimming.
 */
export function validateSearchQuery(query: string): SearchValidationResult {
  const trimmed = query.trim();

  if (trimmed.length === 0) {
    return {
      isValid: false,
      errorMessage: 'Please enter a book title or author to search.',
      trimmedQuery: '',
    };
  }

  if (trimmed.length < 2) {
    return {
      isValid: false,
      errorMessage: 'Search query must be at least 2 characters long.',
      trimmedQuery: trimmed,
    };
  }

  return {
    isValid: true,
    errorMessage: null,
    trimmedQuery: trimmed,
  };
}
