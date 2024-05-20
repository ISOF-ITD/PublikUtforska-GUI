import React from 'react';

const NavigationPanel = ({
  currentPageIndex,
  pages,
  goToPreviousPage,
  goToNextPage,
  goToNextTranscribePage,
}) => (
  <div className="navigation-panel">
    <button
      className="button"
      onClick={goToPreviousPage}
      disabled={currentPageIndex === 0}
      type="button"
    >
      Föregående sida
    </button>
    <button
      className="button"
      onClick={goToNextPage}
      disabled={currentPageIndex === pages.length - 1}
      type="button"
    >
      Nästa sida
    </button>
    <button
      className="button"
      onClick={goToNextTranscribePage}
      disabled={pages.slice(currentPageIndex + 1).every((page) => page.transcriptionstatus !== 'readytotranscribe')}
    >
      Nästa sida att skriva av
    </button>
  </div>
);

export default NavigationPanel;
