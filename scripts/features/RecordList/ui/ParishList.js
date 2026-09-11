import { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { Link, useLocation } from 'react-router-dom';
import config from '../../../config';
import { l } from '../../../lang/Lang';
import { createDetailLocation } from '../../../utils/routeHelper';
import {
  compareParishes, getParishHitCount, getParishMetadata, getParishName, hasMapPosition,
} from '../../../utils/parishHelper';
import Pagination from './Pagination';
import RecordSortMenu from './RecordSortMenu';
import RecordListLoadingPlaceholder from '../../../components/RecordListLoadingPlaceholder';
import useParishMapPreview from '../hooks/useParishMapPreview';
import {
  RESULT_CARD_CLASS,
  RESULT_CARD_GRID_CLASS,
  RESULT_CARD_LABEL_CLASS,
  RESULT_CARD_LINK_CLASS,
  RESULT_CARD_METADATA_CLASS,
  RESULT_CARD_METADATA_ROW_CLASS,
  RESULT_CARD_TITLE_CLASS,
  RESULT_CARD_VALUE_CLASS,
  RESULT_TABLE_CLASS,
  RESULT_TABLE_HEADER_ROW_CLASS,
  RESULT_TABLE_ROW_CLASS,
  RESULT_TOOLBAR_CLASS,
  RESULT_VIEW_CONTROLS_CLASS,
} from './resultListStyles';

const SORT_OPTIONS = [
  { field: 'doc_count', order: 'desc', label: 'Flest träffar' },
  { field: 'name', order: 'asc', label: 'Sockennamn A–Ö' },
  { field: 'landskap', order: 'asc', label: 'Landskap A–Ö' },
];
function ParishItem({
  point, view, onHover, onFocus,
}) {
  const location = useLocation();
  const name = getParishName(point);
  const landscape = getParishMetadata(point.landskap);
  const district = getParishMetadata(point.harad);
  const count = getParishHitCount(point).toLocaleString('sv-SE');
  const positionMissing = !hasMapPosition(point);
  const handleFocus = () => onFocus(String(point.id));
  const handleBlur = () => onFocus(null);
  const nameLink = (
    <Link
      to={createDetailLocation({
        resource: 'places', id: point.id, pathname: location.pathname, search: location.search,
      })}
      onFocus={handleFocus}
      onBlur={handleBlur}
      className={RESULT_CARD_LINK_CLASS}
    >
      {name}
    </Link>
  );

  if (view === 'table') {
    return (
      <tr
        onMouseEnter={() => onHover(String(point.id))}
        onMouseLeave={() => onHover(null)}
        className={RESULT_TABLE_ROW_CLASS}
      >
        <td className="!px-2 !py-3 text-base">
          {nameLink}
          {positionMissing && (
            <span className="mt-1 block text-sm text-muted">{l('Kartposition saknas')}</span>
          )}
        </td>
        <td className="py-2 text-center">{landscape}</td>
        <td className="py-2 text-center">{district}</td>
        <td className="py-2 text-center tabular-nums">{count}</td>
      </tr>
    );
  }

  return (
    <article
      onPointerEnter={() => onHover(String(point.id))}
      onPointerLeave={() => onHover(null)}
      className={RESULT_CARD_CLASS}
    >
      <span className={RESULT_CARD_TITLE_CLASS}>{nameLink}</span>
      <dl className={RESULT_CARD_METADATA_CLASS}>
        {landscape && (
          <div className={RESULT_CARD_METADATA_ROW_CLASS}>
            <dt className={RESULT_CARD_LABEL_CLASS}>{l('Landskap')}</dt>
            <dd className={`m-0 ${RESULT_CARD_VALUE_CLASS}`}>{landscape}</dd>
          </div>
        )}
        {district && (
          <div className={RESULT_CARD_METADATA_ROW_CLASS}>
            <dt className={RESULT_CARD_LABEL_CLASS}>{l('Härad')}</dt>
            <dd className={`m-0 ${RESULT_CARD_VALUE_CLASS}`}>{district}</dd>
          </div>
        )}
        <div className={RESULT_CARD_METADATA_ROW_CLASS}>
          <dt className={RESULT_CARD_LABEL_CLASS}>{l('Antal träffar')}</dt>
          <dd className={`m-0 tabular-nums ${RESULT_CARD_VALUE_CLASS}`}>{count}</dd>
        </div>
        {positionMissing && (
          <div className={RESULT_CARD_METADATA_ROW_CLASS}>
            <dt className={RESULT_CARD_LABEL_CLASS}>{l('Karta')}</dt>
            <dd className={`m-0 text-muted ${RESULT_CARD_VALUE_CLASS}`}>
              {l('Kartposition saknas')}
            </dd>
          </div>
        )}
      </dl>
    </article>
  );
}

ParishItem.propTypes = {
  point: PropTypes.object.isRequired,
  view: PropTypes.oneOf(['table', 'cards']).isRequired,
  onHover: PropTypes.func.isRequired,
  onFocus: PropTypes.func.isRequired,
};

export default function ParishList({
  data, active, loading, view, cardLayout, controls, onPreview, onReady,
}) {
  const [page, setPage] = useState(1);
  const [sorting, setSorting] = useState(SORT_OPTIONS[0]);
  const [announcement, setAnnouncement] = useState('');
  const points = useMemo(() => (
    !loading && Array.isArray(data?.data)
      ? [...data.data].sort((first, second) => compareParishes(first, second, sorting.field))
      : []
  ), [data, loading, sorting.field]);
  const maxPage = Math.max(1, Math.ceil(points.length / config.hitsPerPage));
  const currentPage = Math.min(page, maxPage);
  const pagePoints = points.slice(
    (currentPage - 1) * config.hitsPerPage,
    currentPage * config.hitsPerPage,
  );
  const mapCount = points.filter(hasMapPosition).length;
  const parishPreview = useParishMapPreview({
    active,
    loading,
    onPreview,
    data,
    resetKey: `${currentPage}:${sorting.field}:${view}`,
  });

  useEffect(() => {
    if (active && !loading) onReady();
  }, [active, loading, onReady]);

  const handleStep = (step) => {
    parishPreview.resetPreview();
    setPage(Math.min(Math.max(currentPage + step, 1), maxPage));
  };

  const items = pagePoints.map((point) => (
    <ParishItem
      key={point.id}
      point={point}
      view={view}
      onHover={parishPreview.onHover}
      onFocus={parishPreview.onFocus}
    />
  ));

  return (
    <div hidden={!active} aria-busy={loading || undefined}>
      <div className={RESULT_TOOLBAR_CLASS}>
        {!loading && (
          <div className="min-w-0">
            <p className="mb-2 font-semibold text-muted" role="status">
              {`${points.length.toLocaleString('sv-SE')} ${l(points.length === 1 ? 'socken' : 'socknar')}`}
            </p>
            <Pagination
              currentPage={currentPage}
              total={points.length}
              maxPage={maxPage}
              onStep={handleStep}
              showRange
              showTotal={false}
              className="!m-0"
            />
          </div>
        )}
        <span className="min-w-0 flex-1" aria-hidden="true" />
        <div className={RESULT_VIEW_CONTROLS_CLASS}>
          {controls}
          <RecordSortMenu
            sort={sorting.field}
            order={sorting.order}
            showRelevance={false}
            options={SORT_OPTIONS}
            onChange={(next) => {
              setSorting(next);
              setPage(1);
              parishPreview.resetPreview();
              setAnnouncement(`${l('Sortering ändrad till')} ${l(next.label)}.`);
            }}
          />
        </div>
      </div>
      <p className="sr-only" role="status" aria-atomic="true">{announcement}</p>
      {loading ? <RecordListLoadingPlaceholder embedded /> : (
        <>
          {points.length === 0 && (
            <p className="py-10 text-center">{l('Inga socknar i nuvarande urval.')}</p>
          )}
          {points.length > 0 && view === 'table' && (
            <table className={RESULT_TABLE_CLASS}>
              <caption className="sr-only">{l('Sökträffar grupperade efter socken')}</caption>
              <thead>
                <tr className={RESULT_TABLE_HEADER_ROW_CLASS}>
                  <th scope="col" className="w-1/2 text-left">{l('Socken')}</th>
                  <th scope="col" className="text-center">{l('Landskap')}</th>
                  <th scope="col" className="text-center">{l('Härad')}</th>
                  <th scope="col" className="text-center">{l('Antal träffar')}</th>
                </tr>
              </thead>
              <tbody>{items}</tbody>
            </table>
          )}
          {points.length > 0 && view === 'cards' && (
            <div className={cardLayout === 'desktop-grid' ? RESULT_CARD_GRID_CLASS : 'space-y-4'}>
              {items}
            </div>
          )}
          <Pagination
            currentPage={currentPage}
            total={points.length}
            maxPage={maxPage}
            onStep={handleStep}
            showTotal={false}
          />
        </>
      )}
    </div>
  );
}

ParishList.propTypes = {
  data: PropTypes.object,
  active: PropTypes.bool.isRequired,
  loading: PropTypes.bool.isRequired,
  view: PropTypes.oneOf(['table', 'cards']).isRequired,
  cardLayout: PropTypes.oneOf(['desktop-grid', 'pane-compact']).isRequired,
  controls: PropTypes.node,
  onPreview: PropTypes.func.isRequired,
  onReady: PropTypes.func.isRequired,
};
