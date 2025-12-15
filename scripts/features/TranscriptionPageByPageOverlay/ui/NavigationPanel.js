import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChevronLeft,
  faChevronRight,
  faAngleDoubleRight,
} from "@fortawesome/free-solid-svg-icons";

const Btn = ({ children, ...props }) => (
  <button
    className="inline-flex !mb-0 items-center gap-2 hover:cursor-pointer disabled:hover:cursor-not-allowed disabled:opacity-60"
    type="button"
    {...props}
  >
    {children}
  </button>
);

const NavigationPanel = ({
  currentPageIndex,
  pages,
  goToPreviousPage,
  goToNextPage,
  goToNextTranscribePage,
}) => (
  <div className="flex gap-2 items-center">
    <Btn
      onClick={goToPreviousPage}
      disabled={currentPageIndex === 0}
      aria-label="Föregående sida"
    >
      <FontAwesomeIcon icon={faChevronLeft} aria-hidden="true" />
      Föregående sida
    </Btn>

    <Btn
      onClick={goToNextPage}
      disabled={currentPageIndex === pages.length - 1}
      aria-label="Nästa sida"
    >
      Nästa sida
      <FontAwesomeIcon icon={faChevronRight} aria-hidden="true" />
    </Btn>

    <Btn
      onClick={goToNextTranscribePage}
      disabled={pages
        .slice(currentPageIndex + 1)
        .every((p) => p.transcriptionstatus !== "readytotranscribe")}
      aria-label="Nästa sida att skriva av"
    >
      <FontAwesomeIcon icon={faAngleDoubleRight} aria-hidden="true" />
      Nästa sida att skriva av
    </Btn>
  </div>
);

export default NavigationPanel;
