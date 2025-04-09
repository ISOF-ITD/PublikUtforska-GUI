/* eslint-disable react/require-default-props */
import {
  useState, useEffect, useMemo, useCallback,
} from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import PropTypes from 'prop-types';
import { l } from '../../lang/Lang';
import RecordsCollection from '../collections/RecordsCollection';
import RecordListItem from './RecordListItem';
import Timeline from './Timeline';
import { createSearchRoute } from '../../utils/routeHelper';
import Filter from './Filter';
import config from '../../config';

const {
  filterParameterName,
  filterParameterValues,
  hitsPerPage,
  maxTotal,
  siteOptions,
} = config;

function Pagination({
  currentPage, total, onStep, maxPage,
}) {
  const from = (currentPage - 1) * hitsPerPage + 1;
  const to = currentPage * hitsPerPage > total ? total : currentPage * hitsPerPage;

  return (
    (total > 2) && (
      <div className="list-pagination">
        <p className="page-info">
          <strong>
            {`${l('Visar')} ${from}-${to} ${l(total ? 'av' : '')}${l('')} ${total || ''}`}
          </strong>
        </p>
        <br />
        {total > hitsPerPage && (
          <>
            <button
              disabled={currentPage === 1}
              className="button prev-button"
              onClick={() => onStep(-1)}
              type="button"
            >
              {l('Föregående')}
            </button>
            <span> </span>
            <button
              disabled={currentPage >= maxPage}
              className="button next-button"
              onClick={() => onStep(1)}
              type="button"
            >
              {l('Nästa')}
            </button>
          </>
        )}
        {total >= maxTotal && currentPage >= maxPage && (
          <span className="limit-message">
            {l(`Du har nått det maximala antalet sidor (${maxTotal.toLocaleString('sv-SE')} poster).`)}
          </span>
        )}
      </div>
    )
  );
}

Pagination.propTypes = {
  currentPage: PropTypes.number.isRequired,
  total: PropTypes.number.isRequired,
  onStep: PropTypes.func.isRequired,
  maxPage: PropTypes.number.isRequired,
};

export default function RecordList({
  columns = null,
  disableListPagination = false,
  disableRouterPagination = true,
  hasFilter = true,
  hasTimeline = false,
  highlightRecordsWithMetadataField = null,
  interval = null,
  openSwitcherHelptext = () => { },
  // sizeMore = null,
  tableClass = null,
  params = {},
  mode = 'material',
  containerRef = null,
  useRouteParams = false,
  smallTitle = false,
}) {
  const navigate = useNavigate();
  const location = useLocation();

  // Separera tillståndet med flera useState-hooks
  const [records, setRecords] = useState([]);
  const [fetchingPage, setFetchingPage] = useState(false);
  const [currentPage, setCurrentPage] = useState(params.page || 1);
  const [yearFilter, setYearFilter] = useState(null);
  const [sort, setSort] = useState('archive.archive_id_row.keyword');
  const [order, setOrder] = useState('asc');
  const [loadedMore, setLoadedMore] = useState(false);
  const [total, setTotal] = useState(0);
  const [filter, setFilter] = useState('');

  /*
  Genera unique id: Varför använda `useMemo`?
  Om du använder useMemo genereras det unika ID
  bara en gång när komponenten först laddas, vilket är exakt vad
  du vill ha för att säkerställa att varje instans har ett stabilt
  och unikt prefix under hela sin livstid.
  Om du inte använder en hook:
  Om du istället använder denna direkt i komponentkroppen utan en hook:
    const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  Så kommer uniqueId att genereras varje gång komponenten renderas, vilket kan orsaka
  att nycklarna ändras varje gång och leda till problem med omrendering.
  */
  const uniqueId = useMemo(() => `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`, []);

  // Anpassa maxPage så att det alltid är baserat på det minsta värdet mellan maxTotal och total
  const maxPage = Math.ceil(Math.min(maxTotal, total) / hitsPerPage);

  const handleFilterChange = (event) => {
    const { value } = event.target;
    setFilter(value);
    setCurrentPage(1);
  };

  // Hantera URL-parametrar för att visa listan
  useEffect(() => {
    // Get the URL search parameters (non-hash parameters)
    const searchParams = new URLSearchParams(window.location.search);

    // Get the hash parameters (after #)
    const { hash } = window.location;
    const hashParams = hash.includes('?') ? new URLSearchParams(hash.split('?')[1]) : new URLSearchParams();

    // Combine both sets of parameters
    const urlParams = new Map([...searchParams.entries(), ...hashParams.entries()]);

    if (urlParams.has('showlist') && window.eventBus) {
      window.eventBus.dispatch('routePopup.show');
    }
  }, [location]);

  const collections = useMemo(() => new RecordsCollection((json) => {
    // const totalPrefixValue = json.metadata.total.relation !== 'eq' ? 'mer än ' : '';

    setRecords(json.data);
    setTotal(json.metadata.total.value);
    setFetchingPage(false);
    // setTotalPrefix(totalPrefixValue);

    if (window.eventBus) {
      window.eventBus.dispatch('recordList.totalRecords', json.metadata.total.value, json.metadata.total.value);
      window.eventBus.dispatch('recordList.fetchingPage', false);
    }
  }), []);

  const fetchData = useCallback((fetchParams) => {
    setFetchingPage(true);
    collections.fetch(fetchParams);
  }, [collections]);

  // Funktion för att generera fetchParams
  const getFetchParams = useCallback(() => ({
    from: Math.min((currentPage - 1) * hitsPerPage, maxTotal - hitsPerPage),
    size: params.size || hitsPerPage,
    search: params.search ? encodeURIComponent(params.search) : undefined,
    search_field: params.search_field || undefined,
    type: params.type,
    category: params.category
      ? `${params.category}${params.subcategory ? `,${params.subcategory}` : ''}`
      : undefined,
    collection_years: yearFilter?.join(',') || undefined,
    gender: params.gender
      ? params.person_relation
        ? `${params.person_relation}:${params.gender}`
        : params.gender
      : undefined,
    birth_years: params.birth_years
      ? params.person_relation
        ? `${params.person_relation}:${params.gender ? `${params.gender}:` : ''}${params.birth_years}`
        : params.birth_years
      : undefined,
    record_ids: params.record_ids || undefined,
    has_metadata: params.has_metadata || undefined,
    has_media: params.has_media || undefined,
    has_transcribed_records: params.has_transcribed_records || undefined,
    has_untranscribed_or_uncontributed_records: params.has_untranscribed_or_uncontributed_records || undefined,
    recordtype:
      params.recordtype
      || (mode === 'transcribe' ? 'one_accession_row' : filter || null),
    person_id: params.person_id || undefined,
    socken_id: params.place_id || undefined,
    transcriptionstatus: params.transcriptionstatus || undefined,
    sort: params.sort || sort || undefined,
    order: params.order || order || undefined,
    // Lägg till applikationsdefinierade filterparametrar
    ...(filterParameterName && filterParameterValues && 'filter' in params
      ? {
        [filterParameterName]: params.filter === 'true' || params.filter === true
          ? filterParameterValues[1]
          : filterParameterValues[0],
      }
      : {}),
  }), [
    currentPage,
    hitsPerPage,
    maxTotal,
    params,
    yearFilter,
    mode,
    filter,
    sort,
    order,
    filterParameterName,
    filterParameterValues,
  ]);

  // Hämta data vid initial render och när relevanta beroenden ändras
  useEffect(() => {
    const fetchParams = getFetchParams();
    fetchData(fetchParams);
  // TODO: se över denna lista. blir aktuellt om man vill utöka filtreringsmöjligheter
  // OBS! lägg inte till `params`, då detta kommer att trigga en än ändring av getFetchParams
  // för ofta och därmed en omhämtning av data
  }, [currentPage, params.person_id, params.sort, params.order, sort, order, filter, yearFilter, mode, fetchData]);

  const loadMore = () => {
    setCurrentPage((prevPage) => prevPage + 1);
    setLoadedMore(true);
  };

  // Hantera interval för datahämtning
  useEffect(() => {
    if (interval) {
      const intervalId = setInterval(() => {
        if (loadedMore) {
          loadMore();
        } else {
          const fetchParams = getFetchParams();
          fetchData(fetchParams);
        }
      }, interval);

      return () => clearInterval(intervalId);
    }
    return undefined;
  }, [interval, loadedMore, getFetchParams, fetchData]);

  const handleStepPage = (step) => {
    if (disableRouterPagination) {
      setCurrentPage((prev) => {
        const nextPage = prev + step;
        if (nextPage > maxPage) {
          return maxPage;
        }
        if (nextPage < 1) {
          return 1;
        }
        return nextPage;
      });
    } else {
      const newPage = currentPage + step;
      if (newPage <= maxPage && newPage >= 1) {
        const newSearchParams = { ...params, page: newPage };
        navigate(`/places${createSearchRoute(newSearchParams)}`);
      }
    }
  };

  const handleSort = (sortField) => {
    const newOrder = sort === sortField && order === 'asc' ? 'desc' : 'asc';
    setSort(sortField);
    setOrder(newOrder);
    setCurrentPage(1);
  };

  const handleYearFilter = (firstYear, lastYear) => {
    setYearFilter([firstYear, lastYear]);
  };

  const resetYearFilter = () => {
    setYearFilter(null);
  };

  const archiveIdClick = (e) => {
    const { archiveidrow, recordtype, search } = e.target.dataset;
    if (archiveidrow) {
      const newParams = { search, recordtype };
      navigate(`/records/${archiveidrow}${createSearchRoute(newParams)}`);
    }
  };

  const renderListPagination = () => (
    !disableListPagination && (
      <Pagination
        currentPage={currentPage}
        total={total}
        onStep={handleStepPage}
        maxPage={maxPage}
      />
    )
  );

  // const renderMoreButton = () => (
  //   sizeMore && records.length < sizeMore && (
  //     <div>
  //       <button className="button" onClick={loadMore} type="button">
  //         {l('Visa fler')}
  //       </button>
  //     </div>
  //   )
  // );

  const shouldRenderColumn = (columnName) => {
    if (columns) {
      return columns.includes(columnName);
    }
    return true;
  };

  const items = records.map((item) => (
    <RecordListItem
      key={`${uniqueId}-${item._source.id}`}
      id={item._source.id}
      item={item}
      routeParams={createSearchRoute(params)}
      highlightRecordsWithMetadataField={highlightRecordsWithMetadataField}
      searchParams={params}
      archiveIdClick={archiveIdClick}
      shouldRenderColumn={shouldRenderColumn}
      columns={columns}
      mode={mode}
      useRouteParams={useRouteParams}
      smallTitle={smallTitle}
    />
  ));

  return (
    <>
      {hasFilter && (
        <Filter
          uniqueId={uniqueId}
          filter={filter}
          onChange={handleFilterChange}
          openHelp={openSwitcherHelptext}
        />
      )}
      {hasTimeline && (
        <Timeline
          containerRef={containerRef}
          params={params}
          filter={filter}
          mode={mode}
          onYearFilter={handleYearFilter}
          resetOnYearFilter={resetYearFilter}
        />
      )}
      {!fetchingPage && (
        <div
          className={`${tableClass || ''} table-wrapper records-list list-container${records.length === 0 ? ' loading' : fetchingPage ? ' loading-page' : ''
          }`}
        >
          {!disableListPagination && renderListPagination()}

          <table width="100%" className="table-responsive">
            <thead>
              <tr>
                {shouldRenderColumn('title') && <th scope="col">{l('Titel')}</th>}
                {shouldRenderColumn('archive_id')
                  && (!siteOptions.recordList
                    || siteOptions.recordList.hideAccessionpage !== true) && (
                    <th scope="col">
                      <button
                        type="button"
                        className="sort"
                        onClick={() => handleSort('archive.archive_id_row.keyword')}
                      >
                        {sort === 'archive.archive_id_row.keyword' && (order === 'asc' ? '▼' : '▲')}
                        {l('Arkivnummer')}
                        {params.recordtype === 'one_record' && ':Sida'}
                      </button>
                    </th>
                )}
                {shouldRenderColumn('place') && <th scope="col">{l('Ort')}</th>}
                {shouldRenderColumn('collector')
                  && (!siteOptions.recordList
                    || siteOptions.recordList.visibleCollecorPersons !== false) && <th scope="col">{l('Insamlare')}</th>}
                {shouldRenderColumn('year') && (
                  <th scope="col">
                    <button type="button" className="sort" onClick={() => handleSort('year')}>
                      {sort === 'year' && (order === 'asc' ? '▼' : '▲')}
                      {l('År')}
                    </button>
                  </th>
                )}
                {shouldRenderColumn('material_type')
                  && (!siteOptions.recordList || siteOptions.recordList.hideMaterialType !== true) && (
                    <th scope="col">{l('Materialtyp')}</th>
                )}
                {shouldRenderColumn('transcriptionstatus')
                  && (!siteOptions.recordList
                    || siteOptions.recordList.hideTranscriptionStatus !== true) && (
                    <th scope="col">
                      <button
                        type="button"
                        className="sort"
                        onClick={() => handleSort('transcriptionstatus')}
                      >
                        {sort === 'transcriptionstatus' && (order === 'asc' ? '▼' : '▲')}
                        {l('Avskriven')}
                      </button>
                    </th>
                )}
                {columns && columns.includes('transcribedby') && (
                  <th scope="col">{l('Transkriberad av')}</th>
                )}
              </tr>
            </thead>
            <tbody>{items}</tbody>
          </table>

          {!disableListPagination && renderListPagination()}
          {/* {renderMoreButton()} */}
        </div>
      )}
      {fetchingPage && <p className="page-info"><strong>Söker...</strong></p>}
      {!fetchingPage && records.length === 0 && (
        <div className="table-wrapper list-container">
          <h3>{l('Inga sökträffar.')}</h3>
        </div>
      )}
    </>
  );
}

RecordList.propTypes = {
  columns: PropTypes.arrayOf(PropTypes.string),
  disableListPagination: PropTypes.bool,
  disableRouterPagination: PropTypes.bool,
  hasFilter: PropTypes.bool,
  hasTimeline: PropTypes.bool,
  highlightRecordsWithMetadataField: PropTypes.string,
  interval: PropTypes.number,
  openSwitcherHelptext: PropTypes.func,
  // sizeMore: PropTypes.number,
  tableClass: PropTypes.string,
  params: PropTypes.objectOf(PropTypes.any),
  mode: PropTypes.string,
  useRouteParams: PropTypes.bool,
  containerRef: PropTypes.objectOf(PropTypes.any),
  smallTitle: PropTypes.bool,
};
