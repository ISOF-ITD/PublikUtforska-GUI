import Client from 'react-dom/client';
import { createHashRouter, HashRouter, Navigate, RouterProvider } from 'react-router-dom';
// import ApplicationWrapper from './components/ApplicationWrapper';

import Application from './components/Application';
import RoutePopupWindow from './components/RoutePopupWindow';
import RecordListWrapper from './components/views/RecordListWrapper';
import RecordView from './components/views/RecordView';

import '../less/style-basic.less';

// Initalisera stöd för flerspråkighet
// Språk:
import Lang from '../ISOF-React-modules/lang/Lang';

Lang.setCurrentLang('sv');
window.Lang = Lang;
window.l = Lang.get;

const container = document.getElementById('app');
const root = Client.createRoot(container);

const router = createHashRouter([
  { path: '/', element: <Navigate to="/places/recordtype/one_accession_row/has_media/true" /> },
  { path: '/places', element: <Navigate to="/places/recordtype/one_accession_row/has_media/true" /> },
  {
    path: '/places/*',
    element: (
      <Application>
        <RoutePopupWindow>
          <RecordListWrapper
            manuallyOpenPopup
            openButtonLabel="Visa sökträffar som lista"
            disableRouterPagination={false}
          />
        </RoutePopupWindow>
      </Application>),
  },
  {
    path: '/records/:record_id',
    element: (
      <Application>
        <RoutePopupWindow>
          <RecordView />
        </RoutePopupWindow>
      </Application>),
  },

  // { path: '/records/:record_id/*', element: <Application /> },
  // { path: '/person/:person_id/*', element: <Application /> },
]);

root.render(
  <RouterProvider router={router} />,
);
