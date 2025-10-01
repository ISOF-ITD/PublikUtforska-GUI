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
import RecordListWrapper from '../features/RecordList/RecordListWrapper';
import ImageOverlay from './views/ImageOverlay';
import FeedbackOverlay from './views/FeedbackOverlay';
import ContributeInfoOverlay from './views/ContributeInfoOverlay';
import TranscriptionHelpOverlay from './views/transcribe/TranscriptionHelpOverlay';
import TranscriptionOverlay from './views/transcribe/TranscriptionOverlay';
import TranscriptionPageByPageOverlay from './views/transcribe/TranscriptionPageByPageOverlay';
import HelpTextOverlay from './views/HelpTextOverlay';
import GlobalAudioPlayer from '../features/AudioPlayer/GlobalAudioPlayer';
import { NavigationContext } from '../NavigationContext';
import RequestToTranscribeOverlay from './views/RequestToTranscribeOverlay';

import MapWrapper from './MapWrapper';
import Header from './Header';
import Footer from './Footer';

import { createSearchRoute, createParamsFromSearchRoute } from '../utils/routeHelper';

import config from '../config';


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

  useEffect(() => {
    const onVisible = () => document.body.classList.add("has-docked-control");
    const onHidden = () => document.body.classList.remove("has-docked-control");

    window.eventBus.addEventListener("audio.playervisible", onVisible);
    window.eventBus.addEventListener("audio.playerhidden", onHidden);

    document.title = config.siteTitle;
    setTimeout(() => document.body.classList.add("app-initialized"), 1000);

    results.then((data) => {
      setMapData(data[0]);
      setRecordsData(data[1]);
      setLoading(false);
    });

    // Cleanup event listeners on unmount
    return () => {
      window.eventBus.removeEventListener("audio.playervisible", onVisible);
      window.eventBus.removeEventListener("audio.playerhidden", onHidden);
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

        <Header />

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
        <RequestToTranscribeOverlay />
        <TranscriptionPageByPageOverlay />
        <TranscriptionHelpOverlay />
        <HelpTextOverlay />
        <Footer />
      </div>
    </AudioProvider>
  );
}

Application.propTypes = {
  // The mode of the application, either 'transcribe' or 'material'
  mode: PropTypes.string.isRequired,
};
