import React, { useState, useEffect } from 'react';
import {
  useNavigate, useLoaderData, useParams, Outlet,
} from 'react-router-dom';

import EventBus from 'eventbusjs';

import PropTypes from 'prop-types';
import RoutePopupWindow from './RoutePopupWindow';
import RecordListWrapper from './views/RecordListWrapper';
import StatisticsOverlay from './StatisticsOverlay';
import ImageOverlay from './views/ImageOverlay';
import FeedbackOverlay from './views/FeedbackOverlay';
import ContributeInfoOverlay from './views/ContributeInfoOverlay';
import TranscriptionHelpOverlay from './views/TranscriptionHelpOverlay';
import TranscriptionOverlay from './views/TranscriptionOverlay';
import SwitcherHelpTextOverlay from './views/SwitcherHelpTextOverlay';

import MapWrapper from './MapWrapper';
import Footer from './Footer';

import { createSearchRoute, createParamsFromSearchRoute } from '../utils/routeHelper';

import config from '../config';

import Lang from '../lang/Lang';

const l = Lang.get;

export default function Application({
  children, mode, openSwitcherHelptext,
}) {
  Application.propTypes = {
    children: PropTypes.node.isRequired,
    mode: PropTypes.string,
    openSwitcherHelptext: PropTypes.func.isRequired,
  };

  Application.defaultProps = {
    mode: 'material',
  };

  window.eventBus = EventBus;

  const navigate = useNavigate();
  const { results } = useLoaderData();
  const [mapData, setMapData] = useState(null);
  const [recordsData, setRecordsData] = useState({ data: [], metadata: { } });
  const [loading, setLoading] = useState(true);

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
    document.title = config.siteTitle;

    setTimeout(() => {
      document.body.classList.add('app-initialized');
    }, 1000);

    results.then((data) => {
      setMapData(data[0]);
      setRecordsData(data[1]);
      setLoading(false);
    });
  }, []);

  return (
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

      <MapWrapper
        mapMarkerClick={mapMarkerClick}
        mode={mode}
        params={params}
        mapData={mapData}
        recordsData={recordsData}
        loading={loading}
      />

      <ImageOverlay />
      <FeedbackOverlay />
      <ContributeInfoOverlay />
      <TranscriptionOverlay />
      <TranscriptionHelpOverlay />
      <SwitcherHelpTextOverlay />
      <StatisticsOverlay />
      <Footer />
    </div>
  );
}
