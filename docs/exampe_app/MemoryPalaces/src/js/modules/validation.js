/**
 * Validation & sanitisation utilities for palace data.
 *
 * Addresses two critical gaps:
 *  1. XSS — raw HTML from imports is sanitised before rendering
 *  2. Data integrity — imported palaces are validated at the boundary
 */

// ── HTML Sanitisation ────────────────────────────────────────────────────

/** Tags allowed in rich station HTML (imageHtml, verse html) */
const ALLOWED_TAGS = new Set(['strong', 'em', 'b', 'i', 'span', 'br', 'p', 'u', 'sub', 'sup']);

/** Attributes allowed on permitted tags */
const ALLOWED_ATTRS = new Set(['class']);

/**
 * Sanitise an HTML string, keeping only safe tags and attributes.
 * Uses the browser's own DOMParser — no external dependency needed.
 *
 * @param {string} html - Untrusted HTML string
 * @returns {string} Safe HTML string
 */
export function sanitizeHtml(html) {
  if (!html || typeof html !== 'string') return '';

  const doc = new DOMParser().parseFromString(html, 'text/html');
  return _sanitizeNode(doc.body);
}

/** Recursively walk the DOM tree, serialising only safe elements. */
function _sanitizeNode(node) {
  let out = '';
  for (const child of node.childNodes) {
    if (child.nodeType === Node.TEXT_NODE) {
      out += _escapeHtml(child.textContent);
    } else if (child.nodeType === Node.ELEMENT_NODE) {
      const tag = child.tagName.toLowerCase();
      if (ALLOWED_TAGS.has(tag)) {
        const attrs = _sanitizeAttrs(child);
        out += `<${tag}${attrs}>${_sanitizeNode(child)}</${tag}>`;
      } else {
        // Strip the tag but keep its text content
        out += _sanitizeNode(child);
      }
    }
  }
  return out;
}

function _sanitizeAttrs(el) {
  let out = '';
  for (const attr of el.attributes) {
    if (ALLOWED_ATTRS.has(attr.name)) {
      out += ` ${attr.name}="${_escapeAttr(attr.value)}"`;
    }
  }
  return out;
}

function _escapeHtml(text) {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function _escapeAttr(value) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// ── Palace Data Validation ───────────────────────────────────────────────

/**
 * Validate a palace object at the import/create boundary.
 *
 * @param {Object} data - Untrusted palace-like object
 * @returns {{ valid: boolean, errors: string[], sanitized: Object }}
 */
export function validatePalace(data) {
  const errors = [];

  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return { valid: false, errors: ['Data must be a non-null object'], sanitized: data };
  }

  // Required fields
  if (!data.name || typeof data.name !== 'string') {
    errors.push('name is required and must be a string');
  }
  if (!data.location || typeof data.location !== 'string') {
    errors.push('location is required and must be a string');
  }

  // Type checks for optional fields
  if (data.stations != null && typeof data.stations !== 'number') {
    errors.push('stations must be a number');
  }
  if (data.verses != null && typeof data.verses !== 'number') {
    errors.push('verses must be a number');
  }
  if (data.tags != null && !Array.isArray(data.tags)) {
    errors.push('tags must be an array');
  }
  if (data.connections != null && !Array.isArray(data.connections)) {
    errors.push('connections must be an array');
  }
  if (data.detailedStations != null && !Array.isArray(data.detailedStations)) {
    errors.push('detailedStations must be an array');
  }

  // Sanitise rich HTML fields if present
  const sanitized = { ...data };
  if (sanitized.detailedStations && Array.isArray(sanitized.detailedStations)) {
    sanitized.detailedStations = sanitized.detailedStations.map((station) => {
      const s = { ...station };
      if (s.imageHtml) s.imageHtml = sanitizeHtml(s.imageHtml);
      if (s.verseBlocks && Array.isArray(s.verseBlocks)) {
        s.verseBlocks = s.verseBlocks.map((vb) => ({
          ...vb,
          html: vb.html ? sanitizeHtml(vb.html) : '',
        }));
      }
      return s;
    });
  }

  return { valid: errors.length === 0, errors, sanitized };
}
