import React, { useState, useEffect } from 'react';
import {
  useNavigate, useLoaderData, useParams, Outlet,
} from 'react-router-dom';

import EventBus from 'eventbusjs';

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

import MapWrapper from './MapWrapper';
import Header from './Header';
import Footer from './Footer';

import { createSearchRoute, createParamsFromSearchRoute } from '../utils/routeHelper';

import config from '../config';

export default function Application({
  children, mode = 'material', openSwitcherHelptext,
}) {
  Application.propTypes = {
    children: PropTypes.node.isRequired,
    mode: PropTypes.string.isRequired,
    openSwitcherHelptext: PropTypes.func.isRequired,
  };

  window.eventBus = EventBus;

  const navigate = useNavigate();
  const { results, audioResults, pictureResults } = useLoaderData();
  const [mapData, setMapData] = useState(null);
  const [recordsData, setRecordsData] = useState({ data: [], metadata: { } });
  const [audioRecordsData, setAudioRecordsData] = useState({ data: [], metadata: { } });
  const [pictureRecordsData, setPictureRecordsData] = useState({ data: [], metadata: { } });
  const [loading, setLoading] = useState(true);
  const [transcriptionPageByPageOverlayVisible, setTranscriptionPageByPageOverlayVisible] = useState(false);
  const [transcriptionPageByPageEvent, setTranscriptionPageByPageEvent] = useState(null);

  const params = useParams();

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

    // Lyssna på event när ljudspelare syns, lägger till .has-docked-control till body class
    window.eventBus.addEventListener('audio.playervisible', () => {
      // När GlobalAudioPlayer visas lägger vi till class till document.body för att
      // få utrymme för ljudspelaren i gränssnittet
      document.body.classList.add('has-docked-control');
    });
    // lyssna på när ljudspelaren stängs, ta bort .has-docked-control från body class
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

    // on unmount, remove listeners to clean as you always should do (might not be needed)
    return () => {
      window.eventBus.removeEventListener('audio.playervisible');
      window.eventBus.removeEventListener('audio.playerhidden');

      window.eventBus.removeEventListener('overlay.transcribePageByPage', handleShowOverlay);
      window.eventBus.removeEventListener('overlay.hide', handleHideOverlay);
    };
  }, []);

  return (
    <AudioProvider>
      <div className="app" id="app">
        <RoutePopupWindow manuallyOpenPopup>
          <RecordListWrapper
            openButtonLabel="Visa sökträffar som lista"
            disableRouterPagination
            mode={mode}
            openSwitcherHelptext={openSwitcherHelptext}
          />
        </RoutePopupWindow>

        <Outlet />
        {
          children
        }

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
