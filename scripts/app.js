import Client from 'react-dom/client';
import { createBrowserRouter, RouterProvider, defer } from 'react-router-dom';
import EventBus from 'eventbusjs';
import Application from './components/Application';
import RoutePopupWindow from './components/RoutePopupWindow';
import RecordView from './components/views/RecordView/RecordView';
import PersonView from './components/views/PersonView';
import PlaceView from './components/views/PlaceView';
import CorrectionEditor from './features/ASRCorrection/CorrectionEditor';
import CorrectionView from './features/ASRCorrection/CorrectionView';
import "../tw.css";
import { Toaster } from "react-hot-toast";

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

function fetchRecordAndCountSubrecords(recordId, searchValue = null) {
  // if there is a search value, we use both the search and the document endpoint because
  // the search endpoint will return highlighted text also
  // making sure to use the same search and highlight logic including stemmers
  const recordsPromise = searchValue
    ? fetch(
      getRecordsFetchLocation({ search: searchValue, id: recordId }),
    ).then((resp) => resp.json())
    : Promise.resolve(null);

  // Hämta huvudposten direkt
  const recordPromise = fetch(getRecordFetchLocation(recordId)).then((resp) => resp.json());

  // Hämta subrecords count
  const subrecordsCountPromise = fetch(getRecordsCountLocation({ search: recordId, recordtype: 'one_record' }))
    .then((resp) => resp.json());

  return Promise.all([recordsPromise, recordPromise, subrecordsCountPromise]);
}

function fetchPerson(personId) {
  return fetch(getPersonFetchLocation(personId));
}

// prefix is either 'transcribe' or '' for respectively Application mode trnascribe or material
function createPopupRoutes(prefix) {
  return [
    {
      path: 'places/:placeId/*?',
      id: `${prefix}place`,
      loader: ({ params }) => defer({ results: fetchPlace(params.placeId) }),
      element: (
        <RoutePopupWindow
          manuallyOpen={false}
          routeId={`${prefix}place`}
        >
          <PlaceView mode={prefix.slice(0, -1) || 'material'} />
        </RoutePopupWindow>
      ),
    },
    {
      path: 'records/:recordId/*?',
      id: `${prefix}record`,
      loader: ({ params: { recordId, '*': star } }) => {
   const cleaned = star?.startsWith('audio/') ? '' : star;
   const { search } = createParamsFromSearchRoute(cleaned);
   return defer({ results: fetchRecordAndCountSubrecords(recordId, search) });
 },
      element: (
        <RoutePopupWindow
          manuallyOpen={false}
          routeId={`${prefix}record`}
        >
          <RecordView mode={prefix.slice(0, -1) || 'material'} />
        </RoutePopupWindow>
      ),
      children: [
        {
          path: 'audio/:source/transcribe',
          element: <CorrectionView />,
        }
      ],
    },
    {
      path: 'persons/:personId/*?',
      id: `${prefix}person`,
      loader: async ({ params: { personId } }) => fetchPerson(personId),
      element: (
        <RoutePopupWindow
          manuallyOpen={false}
          routeId={`${prefix}person`}
        >
          <PersonView mode={prefix.slice(0, -1) || 'material'} />
        </RoutePopupWindow>
      ),
    },
  ];
}

// Main Application mode 'material' (empty route) routes
function createRootRoute() {
  return {
    path: '/*?',
    loader: ({ params }) => {
      const queryParams = {
        ...createParamsFromSearchRoute(params['*']),
        transcriptionstatus: 'published,accession,readytocontribute',
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
      return current !== next;
    },
    id: 'root',
    element: <Application mode="material" />,
    children: createPopupRoutes(''),
  };
}

// Main Application mode 'transcribe' routes
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

const router = createBrowserRouter([
  // Main routes changes Application mode: material or transcribe
  createRootRoute(),
  createTranscribeRoute(),
]);

root.render(
  // vi vill hålla koll på Navigationen i hela appen
  <NavigationContextProvider>
    <RouterProvider router={router} />
    <Toaster position="bottom-center" toastOptions={{ duration: 3500 }} />
  </NavigationContextProvider>,
);
