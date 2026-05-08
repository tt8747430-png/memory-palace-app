/**
 * Shared utility functions used across multiple modules.
 */

/** Reusable detached element for DOM-based HTML escaping (§5.5 perf). */
let _escapeEl;

/**
 * Escape HTML to prevent XSS.
 * Uses the browser's own text-content escaping for correctness.
 * Reuses a single detached element for performance.
 *
 * NOTE: validation.js has its own string-replace _escapeHtml for use inside
 * DOMParser-based sanitisation — that's intentionally separate since it
 * operates on already-parsed nodes, not on raw user strings.
 *
 * @param {string} text
 * @returns {string} Safe HTML string
 */
export function escapeHtml(text) {
  if (typeof document !== 'undefined') {
    if (!_escapeEl) _escapeEl = document.createElement('span');
    _escapeEl.textContent = text ?? '';
    return _escapeEl.innerHTML;
  }
  // Fallback for non-browser environments (Node scripts, pure test environments)
  return String(text ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Format an ISO date string as a human-friendly relative time label.
 * @param {string} isoDate — ISO 8601 timestamp
 * @returns {string} e.g. "3 min ago", "2 hr ago", "5 days ago"
 */
export function formatRelativeTime(isoDate) {
  const diffMs = Date.now() - new Date(isoDate).getTime();
  const diffMinutes = Math.max(1, Math.round(diffMs / 60000));

  if (diffMinutes < 60) return `${diffMinutes} min ago`;

  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} hr ago`;

  const diffDays = Math.round(diffHours / 24);
  return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
}
