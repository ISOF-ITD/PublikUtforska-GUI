import {
  lazy, Suspense, useState, useEffect, useContext, useRef, useCallback,
} from 'react';
import {
  useNavigate,
  useLoaderData,
  useParams,
  Outlet,
  useLocation,
} from 'react-router-dom';

import PropTypes from 'prop-types';
import { AudioProvider } from '../contexts/AudioContext';
import RoutePopupWindow from './RoutePopupWindow';
import GlobalAudioPlayer from '../features/AudioPlayer/GlobalAudioPlayer';
import { NavigationContext } from '../NavigationContext';
import MapWrapper from './MapWrapper';
import Footer from './Footer';

import { createSearchRoute, createParamsFromSearchRoute } from '../utils/routeHelper';

import config from '../config';
import { toastError } from '../utils/toast';

const RecordListWrapper = lazy(() => import('../features/RecordList/RecordListWrapper'));
const FeedbackOverlay = lazy(() => import('./views/FeedbackOverlay'));
const ContributeInfoOverlay = lazy(() => import('./views/ContributeInfoOverlay'));
const TranscriptionHelpOverlay = lazy(() => import('../features/TranscriptionPageByPageOverlay/ui/TranscriptionHelpOverlay'));
const TranscriptionPageByPageOverlay = lazy(() => import('../features/TranscriptionPageByPageOverlay/TranscriptionPageByPageOverlay'));
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
  const { results, audioResults, pictureResults } = useLoaderData();
  const [mapData, setMapData] = useState(null);
  const [recordsData, setRecordsData] = useState({ data: [], metadata: {} });
  const [audioRecordsData, setAudioRecordsData] = useState({ data: [], metadata: {} });
  const [pictureRecordsData, setPictureRecordsData] = useState({ data: [], metadata: {} });
  const [loading, setLoading] = useState(true);

  const params = useParams();

  // fallback for old hash routes
  useEffect(() => {
    const { hash } = location;
    if (hash.match(/^#\/?/)) {
      const target = hash.replace(/^#\/?/, '');
      navigate(target);
    }
  }, []);

  const {
    addToNavigationHistory,
  } = useContext(NavigationContext);

  const mapMarkerClick = (placeId) => {
    const current = createParamsFromSearchRoute(params['*']);
    const query = { ...current, _advanced: true }; // keep advanced filters when rebuilding URLs
    let target = `/places/${placeId}${createSearchRoute(query)}`;
    if (mode === 'transcribe') target = `/transcribe${target}`;
    navigate(target);
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
        if (err?.name === "AbortError") return; // silent on navigation
        console.error(err);
        setLoading(false);
        toastError("Kunde inte läsa in sökresultat. Försök igen.");
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
      if (err?.name !== "AbortError") console.error(err);
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
      if (err?.name !== "AbortError") console.error(err);
    });
  return () => {
    alive = false;
  };
}, [pictureResults]);


  useEffect(() => {
    const onVisible = () => document.body.classList.add("bottom-16");
    const onHidden = () => document.body.classList.remove("bottom-16");

    window.eventBus.addEventListener("audio.playervisible", onVisible);
    window.eventBus.addEventListener("audio.playerhidden", onHidden);

    document.title = config.siteTitle;
    setTimeout(() => document.body.classList.add("app-initialized"), 1000);
    // Cleanup event listeners on unmount
    return () => {
      window.eventBus.removeEventListener("audio.playervisible", onVisible);
      window.eventBus.removeEventListener("audio.playerhidden", onHidden);
    };
  }, []);


  // Separate useEffect to handle location changes, tracking for "back"-button in RoutePopupWindow
  useEffect(() => {
    addToNavigationHistory(`${location.pathname}${location.search}`);
  }, [location]);

  // If parameter showlist in url show record list using routePopup event
  // Seems to have to be placed here BUT why? Seems it could be placed anywhere in the code? 
  // But in RecordList it does not work. This code in RoutePopupWindow stopped to work.
  useEffect(() => {
    const paramsHere = new URLSearchParams(location.search);
    if (paramsHere.has("showlist")) {
      if (window.eventBus) {
        window.eventBus.dispatch("routePopup.show");
      }
    }
  }, [location]);

  return (
    <AudioProvider>
      <div className="app">
        <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 bg-white text-isof underline px-3 py-2 rounded">
          Hoppa till innehåll
        </a>
        <RoutePopupWindow manuallyOpenPopup>
          <Suspense fallback={<p className="p-4 text-center">Laddar lista...</p>}>
            <RecordListWrapper
              openButtonLabel="Visa sökträffar som lista"
              disableRouterPagination
              mode={mode}
            />
          </Suspense>
        </RoutePopupWindow>
        <main id="main" tabIndex={-1}>
        <Outlet />
        <MapWrapper
          mapMarkerClick={mapMarkerClick}
          mode={mode}
          params={params}
          mapData={mapData}
          recordsData={recordsData}
          audioRecordsData={audioRecordsData}
          pictureRecordsData={pictureRecordsData}
          loading={loading}
        />

        </main>

        <GlobalAudioPlayer />
        <DeferredEventOverlay events={['overlay.viewimage']}>
          <ImageOverlay />
        </DeferredEventOverlay>
        <DeferredEventOverlay events={['overlay.feedback']}>
          <FeedbackOverlay />
        </DeferredEventOverlay>
        <DeferredEventOverlay events={['overlay.contributeinfo']}>
          <ContributeInfoOverlay />
        </DeferredEventOverlay>
        <DeferredEventOverlay events={['overlay.transcribePageByPage']}>
          <TranscriptionPageByPageOverlay />
        </DeferredEventOverlay>
        <DeferredEventOverlay events={['overlay.transcriptionhelp']}>
          <TranscriptionHelpOverlay />
        </DeferredEventOverlay>
        <DeferredEventOverlay events={['overlay.HelpText']}>
          <HelpTextOverlay />
        </DeferredEventOverlay>
        <Footer />
      </div>
    </AudioProvider>
  );
}

Application.propTypes = {
  // The mode of the application, either 'transcribe' or 'material'
  mode: PropTypes.string.isRequired,
};
