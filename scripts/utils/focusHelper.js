export const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'textarea:not([disabled])',
  'select:not([disabled])',
  'iframe',
  '[tabindex]:not([tabindex="-1"])',
].join(', ');

const TAB_NAVIGATION_CLASS = 'tab-navigation';
let tabNavigationCleanup = null;

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

export function isTabNavigationActive() {
  if (typeof document === 'undefined') return false;

  return document.body?.classList.contains(TAB_NAVIGATION_CLASS) ?? false;
}

export function focusDialogOnOpen(root, focusableElements = getFocusableElements(root)) {
  if (!root) return;

  if (isTabNavigationActive() && focusableElements.length > 0) {
    focusableElements[0].focus();
    return;
  }

  root.focus();
}

export function setupTabNavigationDetection() {
  if (typeof document === 'undefined') return () => {};
  if (tabNavigationCleanup) return tabNavigationCleanup;

  const onTabKeyDown = (event) => {
    if (
      event.key === 'Tab'
      && !event.altKey
      && !event.ctrlKey
      && !event.metaKey
    ) {
      document.body?.classList.add(TAB_NAVIGATION_CLASS);
    }
  };

  const onPointerInput = () => {
    document.body?.classList.remove(TAB_NAVIGATION_CLASS);
  };

  document.addEventListener('keydown', onTabKeyDown, true);
  document.addEventListener('pointerdown', onPointerInput, true);
  document.addEventListener('mousedown', onPointerInput, true);
  document.addEventListener('touchstart', onPointerInput, true);

  tabNavigationCleanup = () => {
    document.removeEventListener('keydown', onTabKeyDown, true);
    document.removeEventListener('pointerdown', onPointerInput, true);
    document.removeEventListener('mousedown', onPointerInput, true);
    document.removeEventListener('touchstart', onPointerInput, true);
    document.body?.classList.remove(TAB_NAVIGATION_CLASS);
  };

  return tabNavigationCleanup;
}

setupTabNavigationDetection();
