import Client from 'react-dom/client';
import { createHashRouter, RouterProvider, defer } from 'react-router-dom';
// import ApplicationWrapper from './components/ApplicationWrapper';

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

// Initalisera stöd för flerspråkighet
// Språk:
import Lang from '../ISOF-React-modules/lang/Lang';

Lang.setCurrentLang('sv');
window.Lang = Lang;
window.l = Lang.get;

const container = document.getElementById('app');
const root = Client.createRoot(container);

const router = createHashRouter([
  {
    path: '/*?',
    loader: async ({ params }) => {
      const mapPromise = fetch(getMapFetchLocation({
        ...createParamsFromSearchRoute(params['*']),
        transcriptionstatus: 'published,accession',
      })).then((resp) => resp.json());
      const recordsPromise = fetch(getRecordsCountLocation({
        ...createParamsFromSearchRoute(params['*']),
        transcriptionstatus: 'published,accession',
      })).then((resp) => resp.json());
      return Promise.all([mapPromise, recordsPromise]);
      // return defer({results: mapPromise})
    },
    id: 'root',
    element: (
      <Application
        mode="material"
      />
    ),
    children: [
      {
        path: 'places/:placeId/*?',
        id: 'places',
        loader: ({ params }) => {
          const placePromise = fetch(
            getPlaceFetchLocation(params.placeId),
          ).then((resp) => resp.json());
          // const recordsPromise = fetch(getRecordsFetchLocation({
          //   ...createParamsFromSearchRoute(params['*']),
          //   socken_id: params.placeId,
          // })).then((resp) => resp.json());
          // const allRecordsPromise = fetch(getRecordsFetchLocation({
          //   socken_id: params.placeId,
          // })).then((resp) => resp.json());
          // Here we use defer to be able to start building DOM elements before the data is loaded
          // We then use <React.Suspense> and <Await> to wait for the data to be loaded
          return defer({ results: placePromise });
          // return defer({ results: Promise.all([placePromise]) });
        },
        element: (
          <RoutePopupWindow
            manuallyOpen={false}
            onClose={() => {
              window.history.back();
            }}
          >
            <PlaceView
              mode="material"
            />
          </RoutePopupWindow>
        ),
      },
      {
        path: 'records/:recordId/*?',
        id: 'record',
        loader: async ({ params: { recordId } }) => fetch(getRecordFetchLocation(recordId)),
        element: (
          <RoutePopupWindow
            manuallyOpen={false}
            routeId="record"
          >
            <RecordView
              mode="material"
            />
          </RoutePopupWindow>
        ),
      },
      {
        path: 'persons/:personId/*?',
        id: 'person',
        loader: async ({ params: { personId } }) => fetch(getPersonFetchLocation(personId)),
        element: (
          <RoutePopupWindow
            manuallyOpen={false}
            onClose={() => {
              window.history.back();
            }}
            routeId="person"
          >
            <PersonView
              mode="material"
            />
          </RoutePopupWindow>
        ),
      },
    ],
  },
  // {
  //   path: 'records/:record_id/search?/:search?',
  //   id: 'records',
  //   loader: async () => fetch(getRecordsFetchLocation()),
  //   element: (
  //     <Application
  //       mode="material"
  //     >
  //       <RoutePopupWindow
  //         manuallyOpen={false}
  //         onClose={() => {
  //           // navigate one step back in history
  //           // TODO: This is a hack, find a better way to do this
  //           window.history.back();
  //         }}
  //       >
  //         <RecordView />
  //       </RoutePopupWindow>
  //       ,
  //     </Application>),
  // },
  // {
  //   path: 'persons/:person_id/search?/:search?',
  //   id: 'persons',
  //   element: (
  //     <Application>
  //       <RoutePopupWindow
  //         onClose={() => {
  //           // navigate one step back in history
  //           // TODO: This is a hack, find a better way to do this
  //           window.history.back();
  //         }}
  //       >
  //         <PersonView />
  //       </RoutePopupWindow>
  //     </Application>),
  // },
  // {
  //   path: 'places/:place_id/search?/:search?',
  //   id: 'places',
  //   // TODO: add a loader for the map???
  //   element: (
  //     <Application>
  //       <RoutePopupWindow
  //         onClose={() => {
  //           // navigate one step back in history
  //           // TODO: This is a hack, find a better way to do this
  //           window.history.back();
  //         }}
  //       >
  //         <PlaceView />
  //       </RoutePopupWindow>
  //     </Application>),
  // },
  {
    path: '/transcribe/*?',
    loader: async ({ params }) => {
      const mapPromise = fetch(getMapFetchLocation({
        ...createParamsFromSearchRoute(params['*']),
        recordtype: 'one_accession_row',
        has_untranscribed_records: true,
      })).then((resp) => resp.json());
      const recordsPromise = fetch(getRecordsCountLocation(
        {
          ...createParamsFromSearchRoute(params['*']),
          recordtype: 'one_accession_row',
          has_untranscribed_records: true,
        },
      )).then((resp) => resp.json());
      return Promise.all([mapPromise, recordsPromise]);
    },
    id: 'transcribe-root',
    element: (
      <Application
        mode="transcribe"
      />
    ),
    children: [
      {
        path: 'places/:placeId/*?',
        id: 'transcribe-place',
        loader: ({ params }) => {
          const placePromise = fetch(
            getPlaceFetchLocation(params.placeId),
          ).then((resp) => resp.json());
          // const recordsPromise = fetch(getRecordsFetchLocation({
          //   ...createParamsFromSearchRoute(params['*']),
          //   socken_id: params.placeId,
          // })).then((resp) => resp.json());
          // const allRecordsPromise = fetch(getRecordsFetchLocation({
          //   socken_id: params.placeId,
          // })).then((resp) => resp.json());
          // Here we use defer to be able to start building DOM elements before the data is loaded
          // We then use <React.Suspense> and <Await> to wait for the data to be loaded
          return defer({ results: placePromise });
          // return defer({ results: Promise.all([placePromise]) });
        },
        element: (
          <RoutePopupWindow
            manuallyOpen={false}
            onClose={() => {
              window.history.back();
            }}
          >
            <PlaceView
              mode="transcribe"
            />
          </RoutePopupWindow>
        ),
      },
      {
        path: 'records/:recordId/*?',
        id: 'transcribe-record',
        loader: async ({ params: { recordId } }) => fetch(getRecordFetchLocation(recordId)),
        element: (
          <RoutePopupWindow
            manuallyOpen={false}
            onClose={() => {
              window.history.back();
            }}
            routeId="transcribe-record"
          >
            <RecordView
              mode="transcribe"
            />
          </RoutePopupWindow>
        ),
      },
      {
        path: 'persons/:personId/*?',
        id: 'transcribe-person',
        loader: async ({ params: { personId } }) => fetch(getPersonFetchLocation(personId)),
        element: (
          <RoutePopupWindow
            manuallyOpen={false}
            onClose={() => {
              window.history.back();
            }}
          >
            <PersonView
              mode="transcribe"
            />
          </RoutePopupWindow>
        ),
      },
    ],
  },
  // { path: '/records/:record_id/*', element: <Application /> },
  // { path: '/persons/:person_id/*', element: <Application /> },
]);

root.render(
  <RouterProvider router={router} />,
);
