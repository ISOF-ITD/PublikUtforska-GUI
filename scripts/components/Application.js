import {
  lazy, Suspense, useState, useEffect, useRef, useCallback,
} from 'react';
import {
  useNavigate,
  useLoaderData,
  useParams,
  Outlet,
  useLocation,
  useMatches,
} from 'react-router-dom';

import PropTypes from 'prop-types';
import { AudioProvider } from '../contexts/AudioContext';
import GlobalAudioPlayer from '../features/AudioPlayer/GlobalAudioPlayer';
import MapWrapper from './MapWrapper';
import Footer from './Footer';

import {
  createParamsFromSearchRoute,
  createSearchRoute,
  mergeRouteSearch,
} from '../utils/routeHelper';

import config from '../config';
import { toastError } from '../utils/toast';
import useTranscriptionAvailability from '../hooks/useTranscriptionAvailability';

const ContributeInfoOverlay = lazy(() => import('./views/ContributeInfoOverlay'));
const TranscriptionHelpOverlay = lazy(() => import('../features/TranscriptionPageByPageOverlay/ui/TranscriptionHelpOverlay'));
const HelpTextOverlay = lazy(() => import('./views/HelpTextOverlay'));
const ImageOverlay = lazy(() => import('../features/RecordTextPanel/ui/ImageOverlay'));

function OverlayReady({
  onReady,
  children,
}) {
  useEffect(() => {
    onReady();
  }, [onReady]);

  return children;
}

OverlayReady.propTypes = {
  onReady: PropTypes.func.isRequired,
  children: PropTypes.node.isRequired,
};

// DeferredEventOverlay is a wrapper
// that listens for specific events on the event bus and only renders its children
// when one of those events has been dispatched. This is useful for overlays that
// are rendered in response to an event, for example the image overlay that is rendered
// when the user clicks on an image in a record.
// We use it in conjunction with React.lazy.
function DeferredEventOverlay({
  events,
  fallback = null,
  children,
}) {
  const [enabled, setEnabled] = useState(false);
  const [overlayReady, setOverlayReady] = useState(false);
  const pendingEventRef = useRef(null);
  const markOverlayReady = useCallback(() => {
    setOverlayReady(true);
  }, []);

  useEffect(() => {
    if (overlayReady || !window.eventBus) return undefined;

    const listeners = events.map((name) => {
      const handler = (event, data) => {
        pendingEventRef.current = {
          type: name,
          payload: event?.detail ?? event?.target ?? data ?? event ?? {},
        };
        setEnabled(true);
      };
      window.eventBus.addEventListener(name, handler);
      return { name, handler };
    });

    return () => {
      listeners.forEach(({ name, handler }) => {
        window.eventBus.removeEventListener(name, handler);
      });
    };
  }, [overlayReady, events]);

  useEffect(() => {
    if (
      !enabled
      || !overlayReady
      || !window.eventBus
      || !pendingEventRef.current
    ) return undefined;

    const pending = pendingEventRef.current;
    const replayId = window.setTimeout(() => {
      window.eventBus.dispatch(pending.type, pending.payload);
      pendingEventRef.current = null;
    }, 0);

    return () => {
      window.clearTimeout(replayId);
    };
  }, [enabled, overlayReady]);

  if (!enabled) return null;
  return (
    <Suspense fallback={fallback}>
      <OverlayReady onReady={markOverlayReady}>
        {children}
      </OverlayReady>
    </Suspense>
  );
}

DeferredEventOverlay.propTypes = {
  events: PropTypes.arrayOf(PropTypes.string).isRequired,
  fallback: PropTypes.node,
  children: PropTypes.node.isRequired,
};

export default function Application({
  mode = 'material',
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const matches = useMatches();
  const { results, audioResults, pictureResults } = useLoaderData();
  const [mapData, setMapData] = useState(null);
  const [recordsData, setRecordsData] = useState({ data: [], metadata: {} });
  const [audioRecordsData, setAudioRecordsData] = useState({ data: [], metadata: {} });
  const [pictureRecordsData, setPictureRecordsData] = useState({ data: [], metadata: {} });
  const [loading, setLoading] = useState(true);
  const resultFocusRef = useRef(null);
  const wasRoutePageRef = useRef(false);
  const isTranscriptionAvailable = useTranscriptionAvailability();
  const hasRoutePage = matches.some(
    (match) => match.handle?.surface === 'page',
  );

  const params = useParams();

  // fallback for old hash routes
  useEffect(() => {
    const { hash } = location;
    if (hash.match(/^#\/?/)) {
      const target = hash.replace(/^#\/?/, '');
      navigate(target);
    }
  }, []);

  useEffect(() => {
    if (mode !== 'transcribe' || isTranscriptionAvailable) return;

    const { pathname, search, hash } = location;
    if (!pathname.startsWith('/transcribe')) return;

    const targetPath = pathname.replace(/^\/transcribe(?=\/|$)/, '') || '/';
    navigate(`${targetPath}${search}${hash}`, { replace: true });
  }, [
    isTranscriptionAvailable,
    location,
    mode,
    navigate,
  ]);

  const mapMarkerClick = (placeId) => {
    const current = createParamsFromSearchRoute(params['*']);
    const query = { ...current, _advanced: true }; // keep advanced filters when rebuilding URLs
    let target = `/places/${placeId}${createSearchRoute(query)}`;
    if (mode === 'transcribe') target = `/transcribe${target}`;
    navigate(mergeRouteSearch(target, location.search));
  };

  useEffect(() => {
    let alive = true;
    setLoading(true);
    results
      .then(([map, recs]) => {
        if (!alive) return;
        setMapData(map);
        setRecordsData(recs);
        setLoading(false);
      })
      .catch((err) => {
        if (err?.name === 'AbortError') return;
        setLoading(false);
        toastError('Kunde inte läsa in sökresultat. Försök igen.');
      });
    return () => {
      alive = false;
    };
  }, [results]);

  useEffect(() => {
    let alive = true;
    audioResults
      .then((data) => {
        if (alive) setAudioRecordsData(data);
      })
      .catch((err) => {
        if (err?.name !== 'AbortError') {
          toastError('Kunde inte läsa in ljudresultat. Försök igen.');
        }
      });
    return () => {
      alive = false;
    };
  }, [audioResults]);

  useEffect(() => {
    let alive = true;
    pictureResults
      .then((data) => {
        if (alive) setPictureRecordsData(data);
      })
      .catch((err) => {
        if (err?.name !== 'AbortError') {
          toastError('Kunde inte läsa in bildresultat. Försök igen.');
        }
      });
    return () => {
      alive = false;
    };
  }, [pictureResults]);

  useEffect(() => {
    const onVisible = () => document.body.classList.add('bottom-16');
    const onHidden = () => document.body.classList.remove('bottom-16');

    window.eventBus.addEventListener('audio.playervisible', onVisible);
    window.eventBus.addEventListener('audio.playerhidden', onHidden);

    setTimeout(() => document.body.classList.add('app-initialized'), 1000);
    // Cleanup event listeners on unmount
    return () => {
      window.eventBus.removeEventListener('audio.playervisible', onVisible);
      window.eventBus.removeEventListener('audio.playerhidden', onHidden);
    };
  }, []);

  const rememberResultFocus = useCallback((event) => {
    if (!(event.target instanceof Element)) return;
    resultFocusRef.current = event.target.closest(
      'a, button, input, select, textarea, [tabindex]',
    );
  }, []);

  useEffect(() => {
    const returningToResults = wasRoutePageRef.current && !hasRoutePage;
    wasRoutePageRef.current = hasRoutePage;
    if (!returningToResults) return undefined;
    document.title = config.siteTitle;

    const animationFrameId = window.requestAnimationFrame(() => {
      const previousTarget = resultFocusRef.current;
      if (previousTarget?.isConnected) {
        previousTarget.focus();
        return;
      }
      document.getElementById('results-viewport')?.focus();
    });

    return () => window.cancelAnimationFrame(animationFrameId);
  }, [hasRoutePage]);

  return (
    <AudioProvider>
      <div className="app">
        <a
          href={hasRoutePage ? '#route-page-content' : '#results-viewport'}
          className="sr-only focus-visible:not-sr-only focus-visible:absolute focus-visible:top-2 focus-visible:left-2 focus-visible:z-[4000] bg-surface text-link underline px-3 py-2 rounded"
        >
          Hoppa till innehåll
        </a>
        <main id="main" tabIndex={-1}>
          <div
            hidden={hasRoutePage}
            inert={hasRoutePage || undefined}
            aria-hidden={hasRoutePage || undefined}
            onFocusCapture={rememberResultFocus}
            onPointerDownCapture={rememberResultFocus}
          >
            <MapWrapper
              active={!hasRoutePage}
              mapMarkerClick={mapMarkerClick}
              mode={mode}
              params={params}
              mapData={mapData}
              recordsData={recordsData}
              audioRecordsData={audioRecordsData}
              pictureRecordsData={pictureRecordsData}
              loading={loading}
            />
          </div>
          <Outlet />
        </main>

        <GlobalAudioPlayer />
        <DeferredEventOverlay events={['overlay.viewimage']}>
          <ImageOverlay />
        </DeferredEventOverlay>
        <DeferredEventOverlay events={['overlay.contributeinfo']}>
          <ContributeInfoOverlay />
        </DeferredEventOverlay>
        <DeferredEventOverlay events={['overlay.transcriptionhelp']}>
          <TranscriptionHelpOverlay />
        </DeferredEventOverlay>
        <DeferredEventOverlay events={['overlay.HelpText']}>
          <HelpTextOverlay />
        </DeferredEventOverlay>
        <div
          hidden={hasRoutePage}
          inert={hasRoutePage || undefined}
          aria-hidden={hasRoutePage || undefined}
        >
          {/* <Footer /> */}
        </div>
      </div>
    </AudioProvider>
  );
}

Application.propTypes = {
  // The mode of the application, either 'transcribe' or 'material'
  mode: PropTypes.string.isRequired,
};
