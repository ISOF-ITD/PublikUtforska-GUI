import { createRoot } from 'react-dom/client';
import { lazy, Suspense } from 'react';
import {
  createBrowserRouter, RouterProvider, redirect, replace,
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
  getResultSearchSignature,
  parseResultSearch,
} from './utils/routeHelper';
import canonicalizeLegacyLocation from './utils/legacyRouteHelper';
import { audioTranscriptLoader } from './features/AudioDescription/transcriptUtils';
import { buildResultApiParams } from './utils/resultFilterHelper';
import { isMatkultLocation, validateCollectionResponse } from './utils/collectionHelper';

import '../less/style-basic.less';
import '../tw.css';

const PlaceView = lazy(() => import('./components/views/PlaceView'));
const PersonView = lazy(() => import('./components/views/PersonView'));
const RecordView = lazy(() => import('./features/RecordView/RecordView'));
const TranscriptionPage = lazy(
  () => import('./features/TranscriptionPageByPageOverlay/TranscriptionPageByPageOverlay'),
);
const StatisticsPage = lazy(() => import('./features/Statistics/StatisticsPage'));
const MatkultPage = lazy(() => import('./features/Matkult/MatkultPage'));

const container = document.getElementById('app');
const root = createRoot(container);

window.eventBus = EventBus;

function fetchMapAndCountRecords(params, signal) {
  const mapPromise = fetch(getMapFetchLocation(params), { signal })
    .then((response) => response.json()).then((json) => validateCollectionResponse(json, params));
  const recordsPromise = fetch(getRecordsCountLocation(params), { signal })
    .then((response) => response.json()).then((json) => validateCollectionResponse(json, params));
  return Promise.all([mapPromise, recordsPromise]).catch((error) => {
    if (error.code !== 'CATEGORY_MATCH_UNSUPPORTED') throw error;
    return [null, {
      data: [], metadata: { collection_error: error.message },
    }];
  });
}

function countRecords(params, signal) {
  return fetch(getRecordsCountLocation(params), { signal }).then((r) => r.json());
}

function fetchPlace(placeId, signal) {
  return fetch(getPlaceFetchLocation(placeId), { signal }).then((r) => r.json());
}

function fetchRecordAndCountSubrecords(recordId, searchValue, signal, theme) {
  // if there was a search, also get the highlighted version
  const searchPromise = searchValue
    ? fetch(getRecordsFetchLocation({ search: searchValue, id: recordId, theme }), { signal })
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
function createPageRoutes() {
  return [
    {
      path: 'matkult',
      id: 'matkult',
      handle: { surface: 'page' },
      element: (
        <RoutePageShell>
          <Suspense fallback={<RouteViewLoadingPlaceholder />}>
            <MatkultPage />
          </Suspense>
        </RoutePageShell>
      ),
    },
    {
      path: 'statistik/*?',
      id: 'statistics',
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
      id: 'place',
      handle: { surface: 'page' },
      loader: ({ params, request }) => (
        { results: fetchPlace(params.placeId, request.signal) }
      ),
      element: (
        <RoutePageShell>
          <Suspense fallback={<RouteViewLoadingPlaceholder kind="place" />}>
            <PlaceView />
          </Suspense>
        </RoutePageShell>
      ),
    },
    {
      path: 'records/:recordId',
      id: 'record',
      handle: { surface: 'page' },
      loader: ({ params: { recordId }, request }) => {
        const normalizedId = normalizeRecordId(recordId);

        // 2) If it changed, redirect to the canonical accession URL
        if (normalizedId !== recordId) {
          const url = new URL(request.url);

          // Keep the query string when redirecting to the canonical record ID.
          url.pathname = url.pathname.replace(
            `/records/${recordId}`,
            `/records/${normalizedId}`,
          );

          // Keep any existing ?query params
          return redirect(`${url.pathname}${url.search}`);
        }

        // 3) Normal loader behavior
        const { search } = parseResultSearch(new URL(request.url).search);

        return {
          results: fetchRecordAndCountSubrecords(
            normalizedId,
            search,
            request.signal,
            parseResultSearch(new URL(request.url).search).theme,
          ),
        };
      },
      shouldRevalidate: ({
        currentParams, nextParams, currentUrl, nextUrl,
      }) => {
        if (currentParams.recordId !== nextParams.recordId) return true;
        const currentSearch = parseResultSearch(currentUrl.search).search;
        const nextSearch = parseResultSearch(nextUrl.search).search;
        return currentSearch !== nextSearch
          || parseResultSearch(currentUrl.search).theme !== parseResultSearch(nextUrl.search).theme;
      },
      element: (
        <RoutePageShell>
          <Suspense fallback={<RouteViewLoadingPlaceholder kind="record" />}>
            <RecordView />
          </Suspense>
        </RoutePageShell>
      ),
      children: [
        {
          path: 'audio/:audioId/transcribe/*?',
          id: 'record-audio-transcript-redirect',
          loader: audioTranscriptLoader,
          element: <RouteViewLoadingPlaceholder kind="record" />,
        },
        {
          path: 'transcribe/*?',
          id: 'record-transcription',
          handle: { surface: 'page', task: 'transcription' },
          element: (
            <Suspense fallback={<RouteViewLoadingPlaceholder kind="record" />}>
              <TranscriptionPage />
            </Suspense>
          ),
        },
        {
          path: '*?',
          id: 'record-details',
        },
      ],
    },
    {
      path: 'persons/:personId/*?',
      id: 'person',
      handle: { surface: 'page' },
      loader: ({ params: { personId }, request }) => (
        fetchPerson(personId, request.signal)
      ),
      element: (
        <RoutePageShell>
          <Suspense fallback={<RouteViewLoadingPlaceholder kind="person" />}>
            <PersonView />
          </Suspense>
        </RoutePageShell>
      ),
    },
  ];
}

function createRootRoute() {
  return {
    path: '/*?',
    loader: ({ request }) => {
      const url = new URL(request.url);
      const canonicalLocation = canonicalizeLegacyLocation(
        url.pathname,
        url.search,
      );
      if (canonicalLocation) return replace(canonicalLocation);

      const queryParams = buildResultApiParams(
        {
          ...parseResultSearch(url.search),
          ...(isMatkultLocation(url) ? { theme: 'matkult' } : {}),
        },
        { materialRecordtype: 'one_accession_row' },
      );

      return {
        results: fetchMapAndCountRecords(queryParams, request.signal),
        audioResults: countRecords(
          { ...queryParams, category: 'contentG5' },
          request.signal,
        ),
        pictureResults: countRecords(
          { ...queryParams, category: 'contentG2' },
          request.signal,
        ),
      };
    },
    shouldRevalidate: ({ currentUrl, nextUrl }) => {
      if (canonicalizeLegacyLocation(nextUrl.pathname, nextUrl.search)) return true;
      if (isMatkultLocation(currentUrl) !== isMatkultLocation(nextUrl)) return true;
      return getResultSearchSignature(currentUrl.search)
        !== getResultSearchSignature(nextUrl.search);
    },
    id: 'root',
    element: <Application />,
    children: createPageRoutes(),
  };
}

const router = createBrowserRouter([
  createRootRoute(),
]);

root.render(
  <>
    <RouterProvider router={router} />
    <Toaster position="bottom-center" toastOptions={{ duration: 3500 }} />
  </>,
);
