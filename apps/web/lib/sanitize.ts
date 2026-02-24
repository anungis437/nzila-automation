/**
 * HTML sanitization utility using DOMPurify
 * Use this to sanitize any HTML before rendering with dangerouslySetInnerHTML
 */
import DOMPurify from 'dompurify';

/**
 * Sanitize HTML content to prevent XSS attacks.
 */
export function sanitizeHtml(dirty: string): string {
  if (typeof window === 'undefined') {
    return dirty.replace(/<[^>]*>/g, '');
  }
  return DOMPurify.sanitize(dirty, {
    USE_PROFILES: { html: true },
    ALLOWED_TAGS: [
      'p', 'br', 'b', 'i', 'em', 'strong', 'a', 'ul', 'ol', 'li',
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'pre', 'code',
      'table', 'thead', 'tbody', 'tr', 'th', 'td', 'img', 'div', 'span',
      'hr', 'sup', 'sub', 'dl', 'dt', 'dd', 'figure', 'figcaption',
    ],
    ALLOWED_ATTR: [
      'href', 'src', 'alt', 'title', 'class', 'id', 'target', 'rel',
      'width', 'height', 'style', 'colspan', 'rowspan',
    ],
    ALLOW_DATA_ATTR: false,
  });
}
