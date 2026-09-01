/* eslint-disable react/require-default-props */
import {
  useCallback, useEffect, useRef, useState,
} from 'react';
import PropTypes from 'prop-types';
import { faChartColumn, faQuestion } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Link, useLocation } from 'react-router-dom';
import Folkelogga from '../../img/folke-white.svg';
import headerBack from '../../img/header-back.gif';
import IsofLogoWhite from '../../img/logotyp-isof-vit.svg';
import { l } from '../lang/Lang';
import SearchPanel from '../features/Search/SearchPanel';
import useTranscriptionAvailability from '../hooks/useTranscriptionAvailability';
import { createStatisticsLocation } from '../utils/routeHelper';
import FilterSwitch from './FilterSwitch';
import IntroOverlay from './views/IntroOverlay';
import config from '../config';

function getWarningUrl() {
  const script = Array.from(document.scripts)
    .find(({ src }) => src.includes('/bndl.') || src.includes('/releases/'));

  if (!script) return '/varning.html';

  return new URL('varning.html', script.src).href;
}

function Warning() {
  const [html, setHtml] = useState('');

  useEffect(() => {
    fetch(getWarningUrl())
      .then((response) => (response.ok ? response.text() : null))
      .then(setHtml);
  }, []);

  return html ? (
    <div
      role="alert"
      aria-label={l('Varning')}
      className="m-3 rounded-md bg-accent p-4 text-body"
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: html }}
    />
  ) : null;
}

export default function MapMenu({
  mode = 'material',
  params,
  recordsData = { data: [], metadata: {} },
  audioRecordsData = { data: [], metadata: {} },
  pictureRecordsData = { data: [], metadata: {} },
  loading,
  hasSubmittedSearch = false,
  activeResultView = 'list',
  onResultViewChange = () => {},
  showResultViewControl = false,
}) {
  const isTranscriptionAvailable = useTranscriptionAvailability();
  const location = useLocation();
  const previousModeRef = useRef(mode);
  const initialLoadRef = useRef(true);
  const [justSwitched, setJustSwitched] = useState(false);
  const [showIntroOverlay, setShowIntroOverlay] = useState(false);
  const activateIntroOverlay = Boolean(config?.activateIntroOverlay);
  const lastGoodRef = useRef({
    recordsData,
    audioRecordsData,
    pictureRecordsData,
  });
  const anyTotals = (recordsData?.metadata?.total?.value ?? 0)
    + (audioRecordsData?.metadata?.total?.value ?? 0)
    + (pictureRecordsData?.metadata?.total?.value ?? 0);

  useEffect(() => {
    let timeoutId;
    if (previousModeRef.current !== mode) {
      previousModeRef.current = mode;
      setJustSwitched(true);
      timeoutId = setTimeout(() => setJustSwitched(false), 400);
    }
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [mode]);

  useEffect(() => {
    if (anyTotals > 0) {
      lastGoodRef.current = {
        recordsData,
        audioRecordsData,
        pictureRecordsData,
      };
    }
  }, [anyTotals, audioRecordsData, pictureRecordsData, recordsData]);

  useEffect(() => {
    if (!activateIntroOverlay) return;
    const isRoot = location.pathname === '/';
    const noHash = !location.hash || location.hash === '#/';
    const locationParams = new URLSearchParams(location.search);
    const hasManualResults = locationParams.has('showlist')
      || locationParams.has('showmap')
      || locationParams.has('record_ids');
    const hasK = locationParams.has('k') && locationParams.get('k') !== '';
    const seenKey = 'folke:introSeen:v1';
    const hasSeen = typeof window !== 'undefined'
      && localStorage.getItem(seenKey) === '1';

    if (hasManualResults) {
      initialLoadRef.current = false;
      return;
    }
    if (initialLoadRef.current && isRoot && noHash && (hasK || !hasSeen)) {
      setShowIntroOverlay(true);
    }
    initialLoadRef.current = false;
  }, [activateIntroOverlay, location]);

  const handleShowIntro = useCallback(() => {
    if (activateIntroOverlay) setShowIntroOverlay(true);
  }, [activateIntroOverlay]);

  const handleCloseOverlay = useCallback(() => {
    setShowIntroOverlay(false);
    try {
      localStorage.setItem('folke:introSeen:v1', '1');
    } catch {
      // Ignore write failures from private/incognito storage contexts.
    }
  }, []);

  const stable = justSwitched && loading
    ? lastGoodRef.current
    : { recordsData, audioRecordsData, pictureRecordsData };
  const panelLoading = loading && !justSwitched;
  const mapMenuPanelStyle = {
    backgroundImage: `var(--image-header-back-tint), url(${headerBack})`,
    backgroundPosition: 'center top',
  };
  const statisticsLocation = createStatisticsLocation(
    location.pathname,
    location.search,
  );

  return (
    <>
      <section
        id="mapmenu-panel"
        aria-label={l('Sök och filter')}
        className="relative z-[1201] max-w-full overflow-visible bg-isof print:hidden"
        style={mapMenuPanelStyle}
      >
        <Warning />
        <header className="max-w-full border-b border-white/20">
          <div className="flex min-h-[4rem] max-w-full items-center justify-between gap-2 px-3 py-2 min-[1440px]:px-5">
            <div className="flex min-w-0 flex-1 items-center gap-2">
              <h1 className="!m-0">
                <img
                  src={Folkelogga}
                  alt={l('Folkelogga')}
                  className="h-10 w-auto max-w-[40vw] object-contain"
                />
              </h1>
              <span aria-hidden="true" className="h-6 w-px bg-white/30" />
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
                  className="h-10 w-auto max-w-[40vw] object-contain"
                />
              </a>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <Link
                to={statisticsLocation}
                aria-label={l('Statistik')}
                title={l('Statistik')}
                className="!m-0 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-md border border-white/70 bg-transparent !text-white no-underline hover:bg-primary-hover focus-visible:bg-primary-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-white focus-visible:outline-offset-2"
              >
                <FontAwesomeIcon icon={faChartColumn} aria-hidden="true" className="text-lg" />
              </Link>
              {activateIntroOverlay && (
                <button
                  type="button"
                  onClick={handleShowIntro}
                  aria-controls="intro-overlay"
                  aria-label={l('Hjälp och nyheter')}
                  title={l('Hjälp och nyheter')}
                  className="!m-0 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-md border border-white/70 bg-transparent !text-white hover:bg-primary-hover focus-visible:bg-primary-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-white focus-visible:outline-offset-2"
                >
                  <FontAwesomeIcon icon={faQuestion} aria-hidden="true" className="text-lg" />
                </button>
              )}
            </div>
          </div>
          {isTranscriptionAvailable && (
            <FilterSwitch
              mode={mode}
              className="max-w-[900px]"
              resultView={hasSubmittedSearch ? activeResultView : null}
            />
          )}
        </header>

        <div className="box-border w-full max-w-[900px] px-2 pb-2 min-[1440px]:px-5 min-[1440px]:pb-5">
          <h2 className="sr-only">{l('Sök och filtrera')}</h2>
          <SearchPanel
            params={params}
            mode={mode}
            recordsData={stable.recordsData}
            audioRecordsData={stable.audioRecordsData}
            pictureRecordsData={stable.pictureRecordsData}
            loading={panelLoading}
            isListView={activeResultView === 'list'}
            onListViewChange={(showList) => {
              onResultViewChange(showList ? 'list' : 'map');
            }}
            showResultViewControl={showResultViewControl}
            showModeSwitch={false}
            showSupplementaryContent={!hasSubmittedSearch}
          />

        </div>
      </section>

      {activateIntroOverlay && (
        <IntroOverlay
          id="intro-overlay"
          show={showIntroOverlay}
          onClose={handleCloseOverlay}
          mode={mode}
        />
      )}
    </>
  );
}

MapMenu.propTypes = {
  mode: PropTypes.string,
  params: PropTypes.object.isRequired,
  recordsData: PropTypes.object,
  audioRecordsData: PropTypes.object,
  pictureRecordsData: PropTypes.object,
  loading: PropTypes.bool.isRequired,
  hasSubmittedSearch: PropTypes.bool,
  activeResultView: PropTypes.oneOf(['map', 'list']),
  onResultViewChange: PropTypes.func,
  showResultViewControl: PropTypes.bool,
};
