export const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'textarea:not([disabled])',
  'select:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ');

/* Returns all focusable elements inside the given root element
  excluding those that are hidden or have aria-hidden="true". */
export function getFocusableElements(root) {
  if (!root) return [];

  return Array.from(root.querySelectorAll(FOCUSABLE_SELECTOR)).filter(
    (element) => (
      element.getAttribute('aria-hidden') !== 'true'
      && element.getClientRects().length > 0
    ),
  );
}
