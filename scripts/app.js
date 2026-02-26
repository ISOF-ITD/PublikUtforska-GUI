import { createRoot } from 'react-dom/client';
import { lazy, Suspense } from 'react';
import { createBrowserRouter, RouterProvider, defer, redirect } from 'react-router-dom';
import EventBus from 'eventbusjs';
import Application from './components/Application';
import RoutePopupWindow from './components/RoutePopupWindow';
import RecordView from './features/RecordView/RecordView';
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

const PlaceView = lazy(() => import('./components/views/PlaceView'));
const PersonView = lazy(() => import('./components/views/PersonView'));

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

// Normalize old-style "accession_subrecord" IDs to just the accession ID.
// Example: "03644_49362_1" -> "03644_49362"
function normalizeRecordId(recordId) {
  const str = String(recordId || '');
  const parts = str.split('_');

  // Only treat as an "uppteckning suffix" if there are at least 2 underscores
  // and the last segment is all digits (the "_1", "_2", ... part).
  // Only replace when id for outdated one_record starts with ifgh, vff, liu to avoid:
  // Do not replace last part for ids that may be part of valid IDs, 
  // for example: s03781:b_f_128340
  if (parts.length > 2 && /^(ifgh|vff|liu)/.test(parts[0])) {
    const last = parts[parts.length - 1];
    if (/^\d+$/.test(last)) {
      return parts.slice(0, -1).join('_');
    }
  }

  // Everything else is a canonical ID already
  return str;
}


// prefix is either 'transcribe' or '' for respectively Application mode trnascribe or material
function createPopupRoutes(prefix) {
  return [
    {
      path: "places/:placeId/*?",
      id: `${prefix}place`,
      loader: ({ params, request }) =>
        defer({ results: fetchPlace(params.placeId, request.signal) }),
      element: (
        <RoutePopupWindow manuallyOpen={false} routeId={`${prefix}place`}>
          <Suspense fallback={<div className="p-4 text-center">Laddar vy...</div>}>
            <PlaceView mode={prefix.slice(0, -1) || "material"} />
          </Suspense>
        </RoutePopupWindow>
      ),
    },
    {
      path: "records/:recordId/*?",
      id: `${prefix}record`,
      loader: ({ params: { recordId, "*": star }, request }) => {
        // 1) Normalize "03644_49362_1" -> "03644_49362"
        const normalizedId = normalizeRecordId(recordId);

        // 2) If it changed, redirect to the canonical accession URL
        if (normalizedId !== recordId) {
          const url = new URL(request.url);

          // Works for both "/records/…" and "/transcribe/records/…"
          url.pathname = url.pathname.replace(
            `/records/${recordId}`,
            `/records/${normalizedId}`
          );

          // Keep any existing ?query params
          return redirect(`${url.pathname}${url.search}`);
        }

        // 3) Normal loader behavior
        const cleaned = star?.startsWith("audio/") ? "" : star;
        const { search } = createParamsFromSearchRoute(cleaned);

        return defer({
          results: fetchRecordAndCountSubrecords(
            normalizedId,
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
          path: "audio/:id/transcribe",
          element: <CorrectionView />,
        },
      ],
    },
    {
      path: "persons/:personId/*?",
      id: `${prefix}person`,
      loader: async ({ params: { personId }, request }) =>
        fetchPerson(personId, request.signal),
      element: (
        <RoutePopupWindow manuallyOpen={false} routeId={`${prefix}person`}>
          <Suspense fallback={<div className="p-4 text-center">Laddar vy...</div>}>
            <PersonView mode={prefix.slice(0, -1) || "material"} />
          </Suspense>
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
