import Client from 'react-dom/client';
import { createHashRouter, RouterProvider, defer } from 'react-router-dom';
import EventBus from 'eventbusjs';
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
  getRecordsFetchLocation,
} from './utils/helpers';

import '../less/style-basic.less';
import { createParamsFromSearchRoute } from './utils/routeHelper';
import NavigationContextProvider from './NavigationContext';

const container = document.getElementById('app');
const root = Client.createRoot(container);

window.eventBus = EventBus;

function fetchMapAndCountRecords(params) {
  const mapPromise = fetch(getMapFetchLocation(params)).then((resp) => resp.json());
  const recordsPromise = fetch(getRecordsCountLocation(params)).then((resp) => resp.json());
  return Promise.all([mapPromise, recordsPromise]);
}

function countRecords(params) {
  return fetch(getRecordsCountLocation(params)).then((resp) => resp.json());
}

function fetchPlace(placeId) {
  return fetch(getPlaceFetchLocation(placeId)).then((resp) => resp.json());
}

function fetchRecord(recordId, searchValue = null) {
  // if there is a search value, we use both the search and the document endpoint because
  // the search endpoint it will return highlighted text also
  if (searchValue) {
    const recordsPromise = fetch(getRecordsFetchLocation({ search: searchValue, id: recordId }))
      .then((resp) => resp.json());
    const recordPromise = fetch(getRecordFetchLocation(recordId)).then((resp) => resp.json());
    return Promise.all([recordsPromise, recordPromise]);
  }
  // otherwise we use the document endpoint, which will only return the document without
  // performing a search
  const recordPromise = fetch(getRecordFetchLocation(recordId)).then((resp) => resp.json());
  return Promise.all([recordPromise]);
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
      loader: ({ params: { recordId, '*': star } }) => defer({ results: fetchRecord(recordId, createParamsFromSearchRoute(star).search) }),
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
        results: fetchMapAndCountRecords(queryParams),
        audioResults: countRecords({ ...queryParams, category: 'contentG5' }),
        pictureResults: countRecords({ ...queryParams, category: 'contentG2' }),
      });
    },
    // shouldRevalidate: ({ currentParams, nextParams }) => {
    //   const current = currentParams['*'] || '';
    //   const next = nextParams['*'] || '';
    //   return current !== next;
    // },
    // shouldProcessLinkClick: false,
    id: 'root',
    element: <Application mode="material" />,
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
        results: fetchMapAndCountRecords(queryParams),
        audioResults: countRecords({ ...queryParams, category: 'contentG5' }),
        pictureResults: countRecords({ ...queryParams, category: 'contentG2' }),
      });
    },
    shouldRevalidate: ({ currentParams, nextParams }) => {
      const current = currentParams['*'] || '';
      const next = nextParams['*'] || '';
      return JSON.stringify(current) !== JSON.stringify(next);
    },
    id: 'transcribe-root',
    element: <Application mode="transcribe" />,
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
