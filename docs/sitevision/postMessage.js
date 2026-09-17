/**
 * SiteVision adapter for Folke's intro overlay.
 *
 * Publish this file in the SiteVision template used by the Folke help pages.
 * It keeps the parent application informed about iframe navigation and scroll.
 */
(function () {
  'use strict';

  if (window.self !== window.top) {
    document.documentElement.classList.add('lp-is-iframe');
  }

  window.parent.postMessage({ newSrc: window.location.href }, '*');

  function notifyParentOfNavigation() {
    window.parent.postMessage({ type: 'navigateAway' }, '*');
  }

  document.addEventListener('click', function (event) {
    var link = event.target.closest('a[href][target="_parent"]');
    if (link) notifyParentOfNavigation();
  });

  var scrollMessageFrame = null;

  function notifyParentOfScroll() {
    if (scrollMessageFrame !== null) return;

    scrollMessageFrame = window.requestAnimationFrame(function () {
      window.parent.postMessage({
        type: 'introScroll',
        scrollY: window.scrollY || document.documentElement.scrollTop || 0
      }, '*');
      scrollMessageFrame = null;
    });
  }

  window.addEventListener('scroll', notifyParentOfScroll, { passive: true });
  notifyParentOfScroll();
}());
