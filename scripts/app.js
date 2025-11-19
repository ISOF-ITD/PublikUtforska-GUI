import { createRoot } from 'react-dom/client';
import { createBrowserRouter, RouterProvider, defer } from 'react-router-dom';
import EventBus from 'eventbusjs';
import Application from './components/Application';
import RoutePopupWindow from './components/RoutePopupWindow';
import RecordView from './components/views/RecordView/RecordView';
import PersonView from './components/views/PersonView';
import PlaceView from './components/views/PlaceView';
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
import {
  createParamsFromSearchRoute,
  removeViewParamsFromRoute,
} from './utils/routeHelper';

import '../less/style-basic.less';
import NavigationContextProvider from './NavigationContext';

const container = document.getElementById('app');
const root = createRoot(container);

window.eventBus = EventBus;

function fetchMapAndCountRecords(params, signal) {
  const mapPromise = fetch(getMapFetchLocation(params), { signal }).then((r) => r.json());
  const recordsPromise = fetch(getRecordsCountLocation(params), { signal }).then((r) => r.json());
  return Promise.all([mapPromise, recordsPromise]);
}

function countRecords(params, signal) {
  return fetch(getRecordsCountLocation(params), { signal }).then((r) => r.json());
}

function fetchPlace(placeId, signal) {
  return fetch(getPlaceFetchLocation(placeId), { signal }).then((r) => r.json());
}

function fetchRecordAndCountSubrecords(recordId, searchValue = null, signal) {
  // if there was a search, also get the highlighted version
 const searchPromise = searchValue
    ? fetch(getRecordsFetchLocation({ search: searchValue, id: recordId }), { signal }).then((r) => r.json())
    : Promise.resolve(null);

  const recordPromise = fetch(getRecordFetchLocation(recordId), { signal }).then((r) => r.json());

  // return both
  return Promise.all([searchPromise, recordPromise]);
}


function fetchPerson(personId, signal) {
  return fetch(getPersonFetchLocation(personId), { signal }).then((r) => r.json());
 }

// prefix is either 'transcribe' or '' for respectively Application mode trnascribe or material
function createPopupRoutes(prefix) {
  return [
    {
      path: 'places/:placeId/*?',
      id: `${prefix}place`,
      loader: ({ params, request }) =>
        defer({ results: fetchPlace(params.placeId, request.signal) }),
      element: (
        <RoutePopupWindow manuallyOpen={false} routeId={`${prefix}place`}>
          <PlaceView mode={prefix.slice(0, -1) || "material"} />
        </RoutePopupWindow>
      ),
    },
    {
      path: 'records/:recordId/*?',
      id: `${prefix}record`,
      loader: ({ params: { recordId, "*": star }, request }) => {
        const cleaned = star?.startsWith("audio/") ? "" : star;
        const { search } = createParamsFromSearchRoute(cleaned);
        return defer({
          results: fetchRecordAndCountSubrecords(
            recordId,
            search,
            request.signal
          ),
        });
      },
      element: (
        <RoutePopupWindow manuallyOpen={false} routeId={`${prefix}record`}>
          <RecordView mode={prefix.slice(0, -1) || "material"} />
        </RoutePopupWindow>
      ),
      // This was added to point to the exact audio file, not used for text transcriptions yet
      children: [
        {
          path: 'audio/:id/transcribe',
          element: <CorrectionView />,
        },
      ],
    },
    {
      path: 'persons/:personId/*?',
      id: `${prefix}person`,
      loader: async ({ params: { personId }, request }) =>
        fetchPerson(personId, request.signal),
      element: (
        <RoutePopupWindow manuallyOpen={false} routeId={`${prefix}person`}>
          <PersonView mode={prefix.slice(0, -1) || "material"} />
        </RoutePopupWindow>
      ),
    },
  ];
}

// Main Application mode 'material' (empty route) routes
function createRootRoute() {
  return {
    path: '/*?',
    loader: ({ params, request }) => {
      const basePath = removeViewParamsFromRoute(params['*'] || "");

      const queryParams = {
        ...createParamsFromSearchRoute(basePath),
        transcriptionstatus: 'published,accession,readytotranscribe,readytocontribute',
        // Mode Arkiv: only for: one_accession_row
        // In requiredParams in config.js:
        // recordtype: 'one_accession_row',
      };

      return defer({
        results: fetchMapAndCountRecords(queryParams, request.signal),
        audioResults: countRecords(
          { ...queryParams, category: "contentG5" },
          request.signal
        ),
        pictureResults: countRecords(
          { ...queryParams, category: "contentG2" },
          request.signal
        ),
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
    loader: async ({ params, request }) => {
      const basePath = removeViewParamsFromRoute(params['*'] || "");
      const base = createParamsFromSearchRoute(basePath);

      const queryParams = {
        ...base,
        recordtype: base.recordtype ?? 'one_accession_row',
        // Used in counting untranscribed records
        transcriptionstatus: base.transcriptionstatus ?? 'readytotranscribe',
        //has_untranscribed_records: base.has_untranscribed_records ?? true,
      };

      return defer({
        results: fetchMapAndCountRecords(queryParams, request.signal),
        audioResults: countRecords(
          { ...queryParams, category: 'contentG5' },
          request.signal
        ),
        pictureResults: countRecords(
          { ...queryParams, category: 'contentG2' },
          request.signal
        ),
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
