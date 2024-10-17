import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronLeft, faChevronRight, faAngleDoubleRight } from '@fortawesome/free-solid-svg-icons';

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
      <FontAwesomeIcon icon={faChevronLeft} style={{ marginRight: '5px' }} />
      Föregående sida
    </button>
    <button
      className="button"
      onClick={goToNextPage}
      disabled={currentPageIndex === pages.length - 1}
      type="button"
    >
      Nästa sida
      <FontAwesomeIcon icon={faChevronRight} style={{ marginLeft: '5px' }} />
    </button>
    <button
      className="button"
      onClick={goToNextTranscribePage}
      disabled={pages.slice(currentPageIndex + 1).every((page) => page.transcriptionstatus !== 'readytotranscribe')}
      type="button"
    >
      <FontAwesomeIcon icon={faAngleDoubleRight} style={{ marginRight: '5px' }} />
      Nästa sida att skriva av
    </button>
  </div>
);

export default NavigationPanel;
