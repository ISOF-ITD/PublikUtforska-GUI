import {
  lazy, Suspense, useEffect, useState,
} from 'react';
import {
  Await, Link, useLocation, useNavigate, useRouteLoaderData,
} from 'react-router-dom';
import PropTypes from 'prop-types';
import { faExpand } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import MapLoadingPlaceholder from '../../components/MapLoadingPlaceholder';
import { createDetailLocation } from '../../utils/routeHelper';
import { createMatkultSearch, matkultDetailSearch } from './matkult';

const MapView = lazy(() => import('../../components/views/MapView'));
// Same breakpoint as Folke's search results with a map alongside the list.
const WIDE_RESULTS_QUERY = '(min-width: 1440px)';

function ResolvedMap({ data }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [mapData, recordsData] = data;
  const params = new URLSearchParams(location.search);
  params.set('showmap', '1');
  params.set('view', 'cards');
  const detailSearch = matkultDetailSearch(params.toString());
  const count = mapData?.data?.length;
  const error = recordsData?.metadata?.collection_error;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="border-b border-border px-4 py-3">
        <h2 className="!m-0 !text-lg">Matkult på kartan</h2>
        <p className="!mb-2 !mt-1 text-sm text-muted">
          {Number.isFinite(count) ? `${count.toLocaleString('sv-SE')} platser i Matkult` : 'Utforska materialets platser'}
        </p>
      </div>
      <div className="relative min-h-0 flex-1">
        <Link
          to={createMatkultSearch({}, detailSearch)}
          className="button absolute left-3 top-3 z-[1101] !m-0 inline-flex !h-auto min-h-11 items-center justify-center gap-2 rounded-md border border-border bg-surface px-3 py-2 !text-sm font-semibold !text-body shadow-md hover:bg-surface-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-focus focus-visible:outline-offset-2"
        >
          <FontAwesomeIcon icon={faExpand} aria-hidden="true" />
          Öppna helkartan
        </Link>
        {error || !Array.isArray(mapData?.data) ? (
          <p role="alert" className="p-4 pt-20 text-sm text-body">{error || 'Kartan kunde inte hämtas. Prova att öppna helkartan.'}</p>
        ) : (
          <Suspense fallback={<MapLoadingPlaceholder />}>
            <MapView
              mapData={mapData}
              active
              isMobileViewport={false}
              layout="desktop-split"
              onMarkerClick={(id) => navigate(createDetailLocation({
                resource: 'places', id, search: detailSearch,
              }))}
            />
          </Suspense>
        )}
      </div>
    </div>
  );
}

ResolvedMap.propTypes = { data: PropTypes.array.isRequired };

export default function MatkultStartMap() {
  const rootData = useRouteLoaderData('root');
  const [isWide, setIsWide] = useState(() => window.matchMedia(WIDE_RESULTS_QUERY).matches);

  useEffect(() => {
    const query = window.matchMedia(WIDE_RESULTS_QUERY);
    const onChange = (event) => setIsWide(event.matches);
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, []);

  if (!isWide) return null;
  return (
    <Suspense fallback={<MapLoadingPlaceholder />}>
      <Await
        resolve={rootData.results}
        errorElement={<p role="alert" className="p-4 text-body">Kartan kunde inte hämtas. Försök igen senare.</p>}
      >
        {(data) => <ResolvedMap data={data} />}
      </Await>
    </Suspense>
  );
}
