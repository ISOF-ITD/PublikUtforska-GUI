/* eslint-disable react/require-default-props */
import {
  lazy, Suspense, useEffect, useState, useRef, useCallback,
} from 'react';
import { useLocation } from "react-router-dom";
import PropTypes from "prop-types";
import { faQuestion } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import classNames from 'classnames';
import Folkelogga from "../../img/folke-white.svg";
import IsofLogoWhite from '../../img/Isof_logotyp_vit.png';
import { l } from "../lang/Lang";
import SearchPanel from "../features/Search/SearchPanel";
import StatisticsLoadingPlaceholder from './StatisticsLoadingPlaceholder';
import IntroOverlay from "./views/IntroOverlay";
import config from "../config";

const StatisticsContainer = lazy(() => import('./StatisticsContainer'));

// Helpers
function SurveyLink() {
  const openSurvey = () =>
    window.open("https://www.isof.se/enkat-folke", "_blank");
  return (
    <button
      type="button"
      onClick={openSurvey}
      onKeyDown={(e) => ["Enter", " "].includes(e.key) && openSurvey()}
      style={{
        backgroundColor: "#3ed494",
        padding: "1.2rem 1rem 1.1rem",
        textAlign: "center",
        borderRadius: 13,
        marginBottom: 10,
        cursor: "pointer",
        textDecoration: "underline",
        width: "100%",
      }}
    >
      Användarenkät Folke 2023
    </button>
  );
}

function Warning() {
  const [html, setHtml] = useState("");
  useEffect(() => {
    fetch("/varning.html")
      .then((r) => (r.ok ? r.text() : null))
      .then(setHtml);
  }, []);
  return html ? (
    <div
      role="alert"
      aria-label="Varning"
      style={{
        backgroundColor: "#ffc107",
        padding: "1.2rem 1rem 1.1rem",
        textAlign: "center",
        borderRadius: 13,
        marginBottom: 10,
      }}
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: html }}
    />
  ) : null;
}

// Component

export default function MapMenu({
  mode = "material",
  params,
  recordsData = { data: [], metadata: {} },
  audioRecordsData = { data: [], metadata: {} },
  pictureRecordsData = { data: [], metadata: {} },
  loading,
  isMobileViewport = false,
  mobileView = 'search',
  onMobileViewChange = () => {},
}) {
  // Track a short transition window when switching mode.
  const prevModeRef = useRef(mode);
  const [justSwitched, setJustSwitched] = useState(false);
  useEffect(() => {
    let timeoutId;
    if (prevModeRef.current !== mode) {
      prevModeRef.current = mode;
      setJustSwitched(true);
      timeoutId = setTimeout(() => setJustSwitched(false), 400);
    }
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [mode]);

  // Remember latest non-empty totals so controls don't blink away on transitions.
  const lastGoodRef = useRef({
    recordsData,
    audioRecordsData,
    pictureRecordsData,
  });
  const anyTotals = (recordsData?.metadata?.total?.value ?? 0)
    + (audioRecordsData?.metadata?.total?.value ?? 0)
    + (pictureRecordsData?.metadata?.total?.value ?? 0);
  useEffect(() => {
    if (anyTotals > 0) {
      lastGoodRef.current = {
        recordsData,
        audioRecordsData,
        pictureRecordsData,
      };
    }
  }, [anyTotals, recordsData, audioRecordsData, pictureRecordsData]);

  const stable = justSwitched && loading
    ? lastGoodRef.current
    : {
      recordsData,
      audioRecordsData,
      pictureRecordsData,
    };

  // Debounce loading inside panel to reduce flashing.
  const [panelLoading, setPanelLoading] = useState(!!loading);
  useEffect(() => {
    let timeoutId;
    if (justSwitched && loading) {
      setPanelLoading(false);
      return undefined;
    }
    if (loading) timeoutId = setTimeout(() => setPanelLoading(true), 150);
    else setPanelLoading(false);
    return () => clearTimeout(timeoutId);
  }, [loading, justSwitched]);

  const location = useLocation();
  const initialLoad = useRef(true);
  const [showIntroOverlay, setShowIntroOverlay] = useState(false);
  const activateIntroOverlay = Boolean(config?.activateIntroOverlay);

  // Auto-open intro on first load when configured.
  useEffect(() => {
    if (!activateIntroOverlay) return;
    const isRoot = location.pathname === '/';
    const noHash = !location.hash || location.hash === '#/';
    const locationParams = new URLSearchParams(location.search);
    const hasK = locationParams.has('k') && locationParams.get('k') !== '';

    const SEEN_KEY = 'folke:introSeen:v1';
    const hasSeen = typeof window !== 'undefined' && localStorage.getItem(SEEN_KEY) === '1';
    if (initialLoad.current && isRoot && noHash) {
      if (hasK || !hasSeen) {
        setShowIntroOverlay(true);
      }
    }
    initialLoad.current = false;
  }, [location, activateIntroOverlay]);

  const handleShowIntro = useCallback(() => {
    if (activateIntroOverlay) {
      setShowIntroOverlay(true);
    }
  }, [activateIntroOverlay]);

  const handleCloseOverlay = useCallback(() => {
    setShowIntroOverlay(false);
    try {
      localStorage.setItem('folke:introSeen:v1', '1');
    } catch {
      // Ignore write failures from private/incognito storage contexts.
    }
  }, []);

  const toggleMobileView = useCallback(() => {
    onMobileViewChange(mobileView === 'map' ? 'search' : 'map');
  }, [mobileView, onMobileViewChange]);

  const mobileToggleLabel = mobileView === 'map' ? l('Till sök') : l('Visa karta');

  const statisticsBlock = (
    <div
      className={classNames(
        'box-border max-w-full overflow-x-hidden rounded-xl bg-white p-3 break-words',
        isMobileViewport ? 'w-auto mx-2 mt-2 mb-2' : 'w-full mb-2 h-full',
      )}
    >
      <Suspense fallback={<StatisticsLoadingPlaceholder />}>
        <StatisticsContainer />
      </Suspense>
    </div>
  );

  const mobileHeader = (
    <header className="max-w-full overflow-x-hidden border-b border-white/20 bg-isof">
      <div className="flex min-h-[5rem] max-w-full flex-wrap items-center justify-between gap-2 px-3 py-2">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <img
            src={Folkelogga}
            alt={l('Folkelogga')}
            className="h-12 w-auto max-w-[40vw] object-contain"
          />
          <span aria-hidden className="h-6 w-px bg-white/30" />
          <a
            href="https://www.isof.se"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-w-0 items-center rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-white focus-visible:outline-offset-2"
            aria-label={l('Öppna Institutet för språk och folkminnens webbplats i nytt fönster')}
            title={l('Institutet för språk och folkminnen')}
          >
            <img
              src={IsofLogoWhite}
              alt={l('Institutet för språk och folkminnen')}
              className="h-12 w-auto max-w-[40vw] object-contain"
            />
          </a>
        </div>
        <div className="ml-auto flex shrink-0 items-center gap-2">
          {activateIntroOverlay && (
            <button
              type="button"
              onClick={handleShowIntro}
              aria-controls="intro-overlay"
              aria-label={l('Hjälp och nyheter')}
              title={l('Hjälp och nyheter')}
              className="inline-flex h-11 w-11 items-center justify-center rounded-md border border-white/70 bg-transparent !text-white hover:bg-darker-isof focus:bg-darker-isof focus-visible:outline focus-visible:outline-2 focus-visible:outline-white focus-visible:outline-offset-2"
            >
              <FontAwesomeIcon icon={faQuestion} aria-hidden="true" className="text-lg font-bold" />
            </button>
          )}
          <button
            type="button"
            onClick={toggleMobileView}
            className="inline-flex h-11 items-center justify-center rounded-md border border-white/70 bg-transparent px-4 text-sm font-semibold !text-white hover:bg-darker-isof focus:bg-darker-isof focus-visible:outline focus-visible:outline-2 focus-visible:outline-white focus-visible:outline-offset-2"
            aria-pressed={mobileView === 'map'}
            aria-label={mobileToggleLabel}
            title={mobileToggleLabel}
          >
            {mobileToggleLabel}
          </button>
        </div>
      </div>
    </header>
  );

  if (isMobileViewport && mobileView === 'map') {
    return (
      <>
        <div className="pointer-events-none absolute left-0 right-0 top-0 z-[1201] print:hidden">
          <div className="pointer-events-auto">{mobileHeader}</div>
        </div>
        {activateIntroOverlay && (
          <IntroOverlay
            id="intro-overlay"
            show={showIntroOverlay}
            onClose={handleCloseOverlay}
          />
        )}
      </>
    );
  }

  if (isMobileViewport) {
    return (
      <div
        id="mapmenu-panel"
        aria-label="Sök och filter"
        className="absolute inset-0 z-[1201] flex flex-col overflow-x-hidden bg-isof print:hidden"
      >
        <div className="flex-1 min-h-0 overflow-x-hidden overflow-y-auto px-2 pb-2">
          {mobileHeader}
          <SearchPanel
            params={params}
            mode={mode}
            recordsData={stable.recordsData}
            audioRecordsData={stable.audioRecordsData}
            pictureRecordsData={stable.pictureRecordsData}
            loading={panelLoading}
            mobileCompact
          />
          {statisticsBlock}
        </div>

        {activateIntroOverlay && (
          <IntroOverlay
            id="intro-overlay"
            show={showIntroOverlay}
            onClose={handleCloseOverlay}
          />
        )}
      </div>
    );
  }

  return (
    <div
      id="mapmenu-panel"
      aria-label="Sök och filter"
      className="bg-isof absolute left-0 top-0 bottom-0 !z-[1201] flex w-[422px] flex-col items-center border-r-2 border-white pt-5 px-5 print:hidden"
    >
      <div>
        <img src={Folkelogga} alt={l('Folkelogga')} className="h-20 w-full" />
      </div>

      <SearchPanel
        params={params}
        mode={mode}
        recordsData={stable.recordsData}
        audioRecordsData={stable.audioRecordsData}
        pictureRecordsData={stable.pictureRecordsData}
        loading={panelLoading}
        onOpenIntroOverlay={handleShowIntro}
      />

      {statisticsBlock}

      {activateIntroOverlay && (
        <IntroOverlay
          id="intro-overlay"
          show={showIntroOverlay}
          onClose={handleCloseOverlay}
        />
      )}
    </div>
  );
}

MapMenu.propTypes = {
  mode: PropTypes.string,
  params: PropTypes.object.isRequired,
  recordsData: PropTypes.object,
  audioRecordsData: PropTypes.object,
  pictureRecordsData: PropTypes.object,
  loading: PropTypes.bool.isRequired,
  isMobileViewport: PropTypes.bool,
  mobileView: PropTypes.oneOf(['search', 'map']),
  onMobileViewChange: PropTypes.func,
};
