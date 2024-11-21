import {
  useState, useEffect, useContext,
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
import RecordListWrapper from './views/RecordListWrapper';
import ImageOverlay from './views/ImageOverlay';
import FeedbackOverlay from './views/FeedbackOverlay';
import ContributeInfoOverlay from './views/ContributeInfoOverlay';
import TranscriptionHelpOverlay from './views/transcribe/TranscriptionHelpOverlay';
import TranscriptionOverlay from './views/transcribe/TranscriptionOverlay';
import TranscriptionPageByPageOverlay from './views/transcribe/TranscriptionPageByPageOverlay';
import SwitcherHelpTextOverlay from './views/SwitcherHelpTextOverlay';
import GlobalAudioPlayer from './views/GlobalAudioPlayer';
import { NavigationContext } from '../NavigationContext';

import MapWrapper from './MapWrapper';
import Footer from './Footer';

import { createSearchRoute, createParamsFromSearchRoute } from '../utils/routeHelper';

import config from '../config';

export default function Application({
  mode = 'material',
}) {
  const navigate = useNavigate();
  const location = useLocation(); // Added useLocation
  const { results, audioResults, pictureResults } = useLoaderData();
  const [mapData, setMapData] = useState(null);
  const [recordsData, setRecordsData] = useState({ data: [], metadata: { } });
  const [audioRecordsData, setAudioRecordsData] = useState({ data: [], metadata: { } });
  const [pictureRecordsData, setPictureRecordsData] = useState({ data: [], metadata: { } });
  const [loading, setLoading] = useState(true);
  const [
    transcriptionPageByPageOverlayVisible,
    setTranscriptionPageByPageOverlayVisible,
  ] = useState(false);
  const [transcriptionPageByPageEvent, setTranscriptionPageByPageEvent] = useState(null);

  const params = useParams();

  const {
    addToNavigationHistory,
  } = useContext(NavigationContext);

  const mapMarkerClick = (placeId) => {
    let target = `/places/${(placeId)}${createSearchRoute(createParamsFromSearchRoute(params['*']))}`;
    if (mode === 'transcribe') {
      target = `/transcribe${target}`;
    }
    navigate(target);
  };

  useEffect(() => {
    setLoading(true);
    results.then((data) => {
      setMapData(data[0]);
      setRecordsData(data[1]);
      setLoading(false);
    });
  }, [results]);

  useEffect(() => {
    audioResults.then((data) => {
      setAudioRecordsData(data);
    });
  }, [audioResults]);

  useEffect(() => {
    pictureResults.then((data) => {
      setPictureRecordsData(data);
    });
  }, [pictureResults]);

  const handleShowOverlay = (event) => {
    setTranscriptionPageByPageOverlayVisible(true);
    setTranscriptionPageByPageEvent(event);
  };

  const handleHideOverlay = () => {
    setTranscriptionPageByPageOverlayVisible(false);
  };

  useEffect(() => {
    window.eventBus.addEventListener('overlay.transcribePageByPage', handleShowOverlay);
    window.eventBus.addEventListener('overlay.hide', handleHideOverlay);

    // Listen for events when the audio player becomes visible
    window.eventBus.addEventListener('audio.playervisible', () => {
      // When GlobalAudioPlayer is visible, add class to document.body to make space for the audio player in the UI
      document.body.classList.add('has-docked-control');
    });
    // Listen for when the audio player is hidden, remove .has-docked-control from body class
    window.eventBus.addEventListener('audio.playerhidden', () => {
      document.body.classList.remove('has-docked-control');
    });

    document.title = config.siteTitle;

    setTimeout(() => {
      document.body.classList.add('app-initialized');
    }, 1000);

    results.then((data) => {
      setMapData(data[0]);
      setRecordsData(data[1]);
      setLoading(false);
    });

    // Cleanup event listeners on unmount
    return () => {
      window.eventBus.removeEventListener('audio.playervisible');
      window.eventBus.removeEventListener('audio.playerhidden');

      window.eventBus.removeEventListener('overlay.transcribePageByPage', handleShowOverlay);
      window.eventBus.removeEventListener('overlay.hide', handleHideOverlay);
    };
  }, [location.pathname, location.search, results]);

  // Separate useEffect to handle location changes, tracking for "back"-button in RoutePopupWindow
  useEffect(() => {
    addToNavigationHistory(`${location.pathname}${location.search}`);
  }, [location]);

  return (
    <AudioProvider>
      <div className="app" id="app">
        <RoutePopupWindow manuallyOpenPopup>
          <RecordListWrapper
            openButtonLabel="Visa sökträffar som lista"
            disableRouterPagination
            mode={mode}
          />
        </RoutePopupWindow>

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

        <GlobalAudioPlayer />
        <ImageOverlay />
        <FeedbackOverlay />
        <ContributeInfoOverlay />
        <TranscriptionOverlay />
        {
          transcriptionPageByPageOverlayVisible
          && (
            <TranscriptionPageByPageOverlay
              event={transcriptionPageByPageEvent}
            />
          )
        }
        <TranscriptionHelpOverlay />
        <SwitcherHelpTextOverlay />
        <Footer />
      </div>
    </AudioProvider>
  );
}

Application.propTypes = {
  mode: PropTypes.string.isRequired,
};
