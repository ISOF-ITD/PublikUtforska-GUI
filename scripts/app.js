import Client from 'react-dom/client';
import { createHashRouter, RouterProvider, defer } from 'react-router-dom';
import Application from './components/Application';
import RoutePopupWindow from './components/RoutePopupWindow';
import RecordView from './components/views/RecordView';
import PersonView from './components/views/PersonView';
import PlaceView from './components/views/PlaceView';

import {
  getMapFetchLocation,
  getPlaceFetchLocation,
  getRecordFetchLocation,
  getRecordsCountLocation,
  getPersonFetchLocation,
} from './utils/helpers';

import '../less/style-basic.less';
import { createParamsFromSearchRoute } from './utils/routeHelper';
import Lang from '../ISOF-React-modules/lang/Lang';
import NavigationContextProvider from './NavigationContext';

function initializeLanguage() {
  Lang.setCurrentLang('sv');
  window.Lang = Lang;
  window.l = Lang.get;
}
initializeLanguage();

const container = document.getElementById('app');
const root = Client.createRoot(container);

function fetchMapAndRecords(params) {
  const mapPromise = fetch(getMapFetchLocation(params)).then((resp) => resp.json());
  const recordsPromise = fetch(getRecordsCountLocation(params)).then((resp) => resp.json());
  return Promise.all([mapPromise, recordsPromise]);
}

function fetchPlace(placeId) {
  return fetch(getPlaceFetchLocation(placeId)).then((resp) => resp.json());
}

function fetchRecord(recordId) {
  return fetch(getRecordFetchLocation(recordId));
}

function fetchPerson(personId) {
  return fetch(getPersonFetchLocation(personId));
}

// prefix is either 'transcribe' or ''
function createPopupRoutes(prefix) {
  return [
    {
      path: 'places/:placeId/*?',
      id: `${prefix}place`,
      loader: ({ params }) => defer({ results: fetchPlace(params.placeId) }),
      element: (
        <RoutePopupWindow
          manuallyOpen={false}
          onClose={() => {
            window.history.back();
          }}
          routeId={`${prefix}place`}
        >
          <PlaceView mode={prefix.slice(0, -1) || 'material'} />
        </RoutePopupWindow>
      ),
    },
    {
      path: 'records/:recordId/*?',
      id: `${prefix}record`,
      loader: async ({ params: { recordId } }) => fetchRecord(recordId),
      element: (
        <RoutePopupWindow
          manuallyOpen={false}
          onClose={() => {
            window.history.back();
          }}
          routeId={`${prefix}record`}
        >
          <RecordView mode={prefix.slice(0, -1) || 'material'} />
        </RoutePopupWindow>
      ),
    },
    {
      path: 'persons/:personId/*?',
      id: `${prefix}person`,
      loader: async ({ params: { personId } }) => fetchPerson(personId),
      element: (
        <RoutePopupWindow
          manuallyOpen={false}
          onClose={() => {
            window.history.back();
          }}
          routeId={`${prefix}person`}
        >
          <PersonView mode={prefix.slice(0, -1) || 'material'} />
        </RoutePopupWindow>
      ),
    },
  ];
}

function createRootRoute() {
  return {
    path: '/*?',
    loader: ({ params }) => {
      const queryParams = {
        ...createParamsFromSearchRoute(params['*']),
        transcriptionstatus: 'published,accession',
      };
      return defer({
        results: fetchMapAndRecords(queryParams),
      });
    },
    id: 'root',
    element: <Application mode="material" hasFilter />,
    children: createPopupRoutes(''),
  };
}

function createTranscribeRoute() {
  return {
    path: '/transcribe/*?',
    loader: async ({ params }) => {
      const queryParams = {
        ...createParamsFromSearchRoute(params['*']),
        recordtype: 'one_accession_row',
        has_untranscribed_records: true,
      };
      return defer({
        results: fetchMapAndRecords(queryParams),
      });
    },
    id: 'transcribe-root',
    element: <Application mode="transcribe" hasFilter={false} />,
    children: createPopupRoutes('transcribe-'),
  };
}

const router = createHashRouter([
  createRootRoute(),
  createTranscribeRoute(),
]);

root.render(
  <NavigationContextProvider>
    <RouterProvider router={router} />
  </NavigationContextProvider>,
);
