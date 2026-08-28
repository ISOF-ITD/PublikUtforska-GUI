import { createRoot } from 'react-dom/client';
import { lazy, Suspense } from 'react';
import {
  createBrowserRouter, RouterProvider, defer, redirect,
} from 'react-router-dom';
import EventBus from 'eventbusjs';
import { Toaster } from 'react-hot-toast';
import Application from './components/Application';
import RoutePageShell from './components/RoutePageShell';
import RouteViewLoadingPlaceholder from './components/RouteViewLoadingPlaceholder';

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
import '../tw.css';

const PlaceView = lazy(() => import('./components/views/PlaceView'));
const PersonView = lazy(() => import('./components/views/PersonView'));
const RecordView = lazy(() => import('./features/RecordView/RecordView'));
const CorrectionView = lazy(() => import('./features/ASRCorrection/CorrectionView'));
const TranscriptionPage = lazy(
  () => import('./features/TranscriptionPageByPageOverlay/TranscriptionPageByPageOverlay'),
);
const StatisticsPage = lazy(() => import('./features/Statistics/StatisticsPage'));

const container = document.getElementById('app');
const root = createRoot(container);

window.eventBus = EventBus;

function fetchMapAndCountRecords(params, signal) {
  const mapPromise = fetch(getMapFetchLocation(params), { signal })
    .then((response) => response.json());
  const recordsPromise = fetch(getRecordsCountLocation(params), { signal })
    .then((response) => response.json());
  return Promise.all([mapPromise, recordsPromise]);
}

function countRecords(params, signal) {
  return fetch(getRecordsCountLocation(params), { signal }).then((r) => r.json());
}

function fetchPlace(placeId, signal) {
  return fetch(getPlaceFetchLocation(placeId), { signal }).then((r) => r.json());
}

function fetchRecordAndCountSubrecords(recordId, searchValue, signal) {
  // if there was a search, also get the highlighted version
  const searchPromise = searchValue
    ? fetch(getRecordsFetchLocation({ search: searchValue, id: recordId }), { signal })
      .then((response) => response.json())
    : Promise.resolve(null);

  const recordPromise = fetch(getRecordFetchLocation(recordId), { signal })
    .then((response) => response.json());

  // return both
  return Promise.all([searchPromise, recordPromise]);
}
function fetchPerson(personId, signal) {
  return fetch(getPersonFetchLocation(personId), { signal }).then((r) => r.json());
}

// Normalize old-style accession subrecord IDs to just the accession ID.
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
function createPageRoutes(prefix) {
  const mode = prefix ? 'transcribe' : 'material';
  return [
    {
      path: 'statistik/*?',
      id: `${prefix}statistics`,
      handle: { surface: 'page' },
      element: (
        <RoutePageShell>
          <Suspense fallback={<RouteViewLoadingPlaceholder />}>
            <StatisticsPage />
          </Suspense>
        </RoutePageShell>
      ),
    },
    {
      path: 'places/:placeId/*?',
      id: `${prefix}place`,
      handle: { surface: 'page' },
      loader: ({ params, request }) => (
        defer({ results: fetchPlace(params.placeId, request.signal) })
      ),
      element: (
        <RoutePageShell>
          <Suspense fallback={<RouteViewLoadingPlaceholder kind="place" />}>
            <PlaceView mode={mode} />
          </Suspense>
        </RoutePageShell>
      ),
    },
    {
      path: 'records/:recordId',
      id: `${prefix}record`,
      handle: { surface: 'page' },
      loader: ({ params: { recordId, '*': star }, request }) => {
        const normalizedId = normalizeRecordId(recordId);

        // 2) If it changed, redirect to the canonical accession URL
        if (normalizedId !== recordId) {
          const url = new URL(request.url);

          // Works for both "/records/…" and "/transcribe/records/…"
          url.pathname = url.pathname.replace(
            `/records/${recordId}`,
            `/records/${normalizedId}`,
          );

          // Keep any existing ?query params
          return redirect(`${url.pathname}${url.search}`);
        }

        // 3) Normal loader behavior
        const { search } = createParamsFromSearchRoute(star);

        return defer({
          results: fetchRecordAndCountSubrecords(
            normalizedId,
            search,
            request.signal,
          ),
        });
      },
      shouldRevalidate: ({ currentParams, nextParams }) => {
        if (currentParams.recordId !== nextParams.recordId) return true;
        const currentContext = removeViewParamsFromRoute(currentParams['*'] || '');
        const nextContext = removeViewParamsFromRoute(nextParams['*'] || '');
        return currentContext !== nextContext;
      },
      element: (
        <RoutePageShell>
          <Suspense fallback={<RouteViewLoadingPlaceholder kind="record" />}>
            <RecordView mode={mode} />
          </Suspense>
        </RoutePageShell>
      ),
      // This was added to point to the exact audio file, not used for text transcriptions yet
      children: [
        {
          path: 'audio/:audioId/transcribe/*?',
          id: `${prefix}record-correction`,
          handle: { surface: 'page', task: 'correction' },
          element: (
            <Suspense fallback={<RouteViewLoadingPlaceholder kind="correction" />}>
              <CorrectionView />
            </Suspense>
          ),
        },
        {
          path: 'transcribe/*?',
          id: `${prefix}record-transcription`,
          handle: { surface: 'page', task: 'transcription' },
          element: (
            <Suspense fallback={<RouteViewLoadingPlaceholder kind="record" />}>
              <TranscriptionPage />
            </Suspense>
          ),
        },
        {
          path: '*?',
          id: `${prefix}record-details`,
        },
      ],
    },
    {
      path: 'persons/:personId/*?',
      id: `${prefix}person`,
      handle: { surface: 'page' },
      loader: ({ params: { personId }, request }) => (
        fetchPerson(personId, request.signal)
      ),
      element: (
        <RoutePageShell>
          <Suspense fallback={<RouteViewLoadingPlaceholder kind="person" />}>
            <PersonView mode={mode} />
          </Suspense>
        </RoutePageShell>
      ),
    },
  ];
}

// Main Application mode 'material' (empty route) routes
function createRootRoute() {
  return {
    path: '/*?',
    loader: ({ params, request }) => {
      const basePath = removeViewParamsFromRoute(params['*'] || '');

      const queryParams = {
        ...createParamsFromSearchRoute(basePath),
        transcriptionstatus: 'published,accession,readytotranscribe,readytocontribute,undertranscription',
        // Mode Arkiv: only for: one_accession_row
        // In requiredParams in config.js:
        // recordtype: 'one_accession_row',
      };

      return defer({
        results: fetchMapAndCountRecords(queryParams, request.signal),
        audioResults: countRecords(
          { ...queryParams, category: 'contentG5' },
          request.signal,
        ),
        pictureResults: countRecords(
          { ...queryParams, category: 'contentG2' },
          request.signal,
        ),
      });
    },
    shouldRevalidate: ({ currentParams, nextParams }) => {
      const current = removeViewParamsFromRoute(currentParams['*'] || '');
      const next = removeViewParamsFromRoute(nextParams['*'] || '');
      return current !== next;
    },
    id: 'root',
    element: <Application mode="material" />,
    children: createPageRoutes(''),
  };
}

// Main Application mode 'transcribe' routes
function createTranscribeRoute() {
  return {
    path: '/transcribe/*?',
    loader: async ({ params, request }) => {
      const basePath = removeViewParamsFromRoute(params['*'] || '');
      const base = createParamsFromSearchRoute(basePath);

      const queryParams = {
        ...base,
        recordtype: base.recordtype ?? 'one_accession_row',
        // Used in counting untranscribed records
        transcriptionstatus: base.transcriptionstatus ?? 'readytotranscribe,undertranscription',
        // has_untranscribed_records: base.has_untranscribed_records ?? true,
      };

      return defer({
        results: fetchMapAndCountRecords(queryParams, request.signal),
        audioResults: countRecords(
          { ...queryParams, category: 'contentG5' },
          request.signal,
        ),
        pictureResults: countRecords(
          { ...queryParams, category: 'contentG2' },
          request.signal,
        ),
      });
    },
    shouldRevalidate: ({ currentParams, nextParams }) => {
      const current = removeViewParamsFromRoute(currentParams['*'] || '');
      const next = removeViewParamsFromRoute(nextParams['*'] || '');
      return current !== next;
    },
    id: 'transcribe-root',
    element: <Application mode="transcribe" />,
    children: createPageRoutes('transcribe-'),
  };
}

const router = createBrowserRouter([
  // Main routes changes Application mode: material or transcribe
  createRootRoute(),
  createTranscribeRoute(),
]);

root.render(
  <>
    <RouterProvider router={router} />
    <Toaster position="bottom-center" toastOptions={{ duration: 3500 }} />
  </>,
);
