/**
 * Inline SVG placeholder data URI for books without a cover.
 */
export const PLACEHOLDER_COVER = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="300" height="450" viewBox="0 0 300 450" fill="none">
  <rect width="300" height="450" rx="8" fill="#E9DECB"/>
  <rect x="15" y="15" width="270" height="420" rx="6" fill="#F2E8D8" stroke="#DDCFB9" stroke-width="2" stroke-dasharray="6 6"/>
  <path d="M110 180C110 168.954 118.954 160 130 160H170C181.046 160 190 168.954 190 180V240C190 251.046 181.046 260 170 260H130C118.954 260 110 251.046 110 240V180Z" fill="#7A1F3D"/>
  <path d="M135 190H165M135 210H165M135 230H155" stroke="#F2E8D8" stroke-width="3" stroke-linecap="round"/>
  <text x="150" y="295" fill="#5E534B" font-family="system-ui, -apple-system, sans-serif" font-size="14" font-weight="600" text-anchor="middle">No Cover Available</text>
  <text x="150" y="320" fill="#0F5E63" font-family="system-ui, -apple-system, sans-serif" font-size="12" text-anchor="middle">BookNest</text>
</svg>
`)}`;

/**
 * Returns the Open Library cover image URL for a given cover ID.
 * @param coverId - The Open Library cover ID number
 * @param size - 'M' for medium (~180px) or 'L' for large (~500px)
 */
export function getCoverUrl(coverId?: number | null, size: 'M' | 'L' = 'M'): string {
  if (!coverId || coverId <= 0) {
    return PLACEHOLDER_COVER;
  }
  return `https://covers.openlibrary.org/b/id/${coverId}-${size}.jpg`;
}
