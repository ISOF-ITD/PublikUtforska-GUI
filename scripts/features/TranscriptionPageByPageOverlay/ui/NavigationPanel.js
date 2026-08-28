import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faChevronLeft,
  faChevronRight,
  faAngleDoubleRight,
} from '@fortawesome/free-solid-svg-icons';
import PropTypes from 'prop-types';

function NavigationButton({
  children,
  onClick,
  disabled,
  ariaLabel,
}) {
  return (
    <button
      className="button button-secondary inline-flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus disabled:hover:cursor-not-allowed disabled:opacity-60"
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
    >
      {children}
    </button>
  );
}

NavigationButton.propTypes = {
  children: PropTypes.node.isRequired,
  onClick: PropTypes.func.isRequired,
  disabled: PropTypes.bool.isRequired,
  ariaLabel: PropTypes.string.isRequired,
};

export default function NavigationPanel({
  currentPageIndex,
  pages,
  goToPreviousPage,
  goToNextPage,
  goToNextTranscribePage,
}) {
  const noLaterPageToTranscribe = pages
    .slice(currentPageIndex + 1)
    .every((page) => page.transcriptionstatus !== 'readytotranscribe');

  return (
    <div className="flex gap-2 items-center">
      <NavigationButton
        onClick={goToPreviousPage}
        disabled={currentPageIndex === 0}
        ariaLabel="Föregående sida"
      >
        <FontAwesomeIcon icon={faChevronLeft} aria-hidden="true" />
        Föregående sida
      </NavigationButton>

      <NavigationButton
        onClick={goToNextPage}
        disabled={currentPageIndex === pages.length - 1}
        ariaLabel="Nästa sida"
      >
        Nästa sida
        <FontAwesomeIcon icon={faChevronRight} aria-hidden="true" />
      </NavigationButton>

      <NavigationButton
        onClick={goToNextTranscribePage}
        disabled={noLaterPageToTranscribe}
        ariaLabel="Nästa sida att skriva av"
      >
        <FontAwesomeIcon icon={faAngleDoubleRight} aria-hidden="true" />
        Nästa sida att skriva av
      </NavigationButton>
    </div>
  );
}

NavigationPanel.propTypes = {
  currentPageIndex: PropTypes.number.isRequired,
  pages: PropTypes.arrayOf(PropTypes.shape({
    transcriptionstatus: PropTypes.string,
  })).isRequired,
  goToPreviousPage: PropTypes.func.isRequired,
  goToNextPage: PropTypes.func.isRequired,
  goToNextTranscribePage: PropTypes.func.isRequired,
};
