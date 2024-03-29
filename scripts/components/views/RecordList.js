import { useState, useEffect } from 'react';

import { useNavigate } from 'react-router-dom';

import PropTypes from 'prop-types';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFileLines } from '@fortawesome/free-solid-svg-icons';
import { l } from '../../lang/Lang';

import RecordsCollection from '../collections/RecordsCollection';
import RecordListItem from './RecordListItem';
import Timeline from './Timeline';

import config from '../../config';
import { createSearchRoute } from '../../utils/routeHelper';

import PdfGif from '../../../img/pdf.gif';

export default function RecordList({
  columns,
  disableListPagination,
  disableRouterPagination,
  hasFilter,
  hasTimeline,
  highlightRecordsWithMetadataField,
  interval,
  openSwitcherHelptext,
  sizeMore,
  tableClass,
  params,
  mode,
  containerRef,
  // useRouteParams: use the route params instead of the search params for the link
  // maybe this should be the default behaviour and search params via props should be optional?
  useRouteParams,
  smallTitle,
}) {
  RecordList.propTypes = {
    columns: PropTypes.arrayOf(PropTypes.string),
    disableListPagination: PropTypes.bool,
    disableRouterPagination: PropTypes.bool,
    hasFilter: PropTypes.bool,
    hasTimeline: PropTypes.bool,
    highlightRecordsWithMetadataField: PropTypes.string,
    interval: PropTypes.number,
    // searchParams: PropTypes.objectOf(PropTypes.any),
    // siteSearchParams: PropTypes.objectOf(PropTypes.any),
    openSwitcherHelptext: PropTypes.func,
    sizeMore: PropTypes.number,
    tableClass: PropTypes.string,
    params: PropTypes.objectOf(PropTypes.any),
    mode: PropTypes.string,
    useRouteParams: PropTypes.bool,
    containerRef: PropTypes.objectOf(PropTypes.any),
    smallTitle: PropTypes.bool,
  };

  RecordList.defaultProps = {
    columns: null,
    disableListPagination: false,
    disableRouterPagination: true,
    hasFilter: true,
    hasTimeline: false,
    highlightRecordsWithMetadataField: null,
    interval: null,
    // searchParams: null,
    // siteSearchParams: null,
    openSwitcherHelptext: () => {},
    sizeMore: null,
    tableClass: null,
    params: {},
    mode: 'material',
    useRouteParams: false,
    containerRef: null,
    smallTitle: false,
  };

  const navigate = useNavigate();

  const [records, setRecords] = useState([]);
  const [fetchingPage, setFetchingPage] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [yearFilter, setYearFilter] = useState(null);
  const [sort, setSort] = useState('archive.archive_id_row.keyword');
  const [order, setOrder] = useState('asc');
  const [loadedMore, setLoadedMore] = useState(false);
  // const [searchParamsState] = useState(params);
  const [total, setTotal] = useState(0);
  // const [totalRelation, setTotalRelation] = useState('eq');
  const [totalPrefix, setTotalPrefix] = useState('');
  const [filter, setFilter] = useState('');

  const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;

  const handleFilterChange = (event) => {
    setFilter(event.target.value);
    setCurrentPage(1);
  };

  const collections = new RecordsCollection((json) => {
    if (window.eventBus) {
      window.eventBus.dispatch('recordList.totalRecords', json.metadata.total, json.metadata.total);
      window.eventBus.dispatch('recordList.fetchingPage', false);
      // show a message if no records were found
      // if (!json.data || json.data.length == 0) {
      // // Om vi hittade inga postar skickar vi visuell meddelande till användaren
      // window.eventBus.dispatch('popup-notification.notify', null, l(`Inga sökträffar
      // <br><br>Kanske informationen inte har skannats? Du kan pröva att söka i den andra
      // av de två flikarna "Accessioner" och "Uppteckningar" utifall informationen finns där.
      // <br><br>Klicka för att stänga meddelandet.`));
      // }
    }
    // Handle new ES7 total value definition with total.relation parameter
    // Needed sometimes if 'track_total_hits' not set in ES-request:
    // total.relation: "eq": output only value
    // total.relation: "gte": output '"more than "+value+" hits"' (value = 10000 for values > 10000)
    let totalPrefixValue = '';
    if (json.metadata.total.relation !== 'eq') {
      totalPrefixValue = 'mer än ';
    }

    setRecords(json.data);
    setTotal(json.metadata.total.value);
    // setTotalRelation(json.metadata.total.relation);
    setFetchingPage(false);
    setTotalPrefix(totalPrefixValue);
  });

  // render more records once, without pagination
  const loadMore = () => {
    setCurrentPage(1);
    setLoadedMore(true);
  };

  const fetchData = (params) => {
    if (window.eventBus) {
      window.eventBus.dispatch('recordList.fetchingPage', true);
    }
    setFetchingPage(true);

    const fetchParams = {
      from: ((params.page ?? currentPage) - 1) * config.hitsPerPage,
      size: params.size || config.hitsPerPage,
      search: params.search ? encodeURIComponent(params.search) : undefined,
      search_field: params.search_field || undefined,
      type: params.type,
      category: params.category && `${params.category}${params.subcategory ? `,${params.subcategory}` : ''}`, // subcategory for matkartan
      collection_years: yearFilter?.join(',') || undefined,
      gender: params.gender ? (params.person_relation ? `${params.person_relation}:${params.gender}` : params.gender) : undefined,
      // gender: params.gender && params.person_relation ? params.person_relation+':'+params.gender : undefined,
      birth_years: params.birth_years ? (params.person_relation ? `${params.person_relation}:${params.gender ? `${params.gender}:` : ''}${params.birth_years}` : params.birth_years) : undefined,
      record_ids: params.record_ids || undefined,
      has_metadata: params.has_metadata || undefined,
      has_media: params.has_media || undefined,
      has_transcribed_records: params.has_transcribed_records || undefined,
      has_untranscribed_records: params.has_untranscribed_records || undefined,
      recordtype: params.recordtype || (mode === 'transcribe' ? 'one_accession_row' : (filter || null)),
      person_id: params.person_id || undefined,
      socken_id: params.place_id || undefined,
      transcriptionstatus: params.transcriptionstatus || undefined,
      sort: params.sort ?? sort ?? undefined,
      order: params.order ?? order ?? undefined,
    };

    // Add Application defined filter parameter
    if (config.filterParameterName && config.filterParameterValues) {
      if (params && 'filter' in params) {
        if (params.filter === 'true' || params.filter === true) {
          fetchParams[config.filterParameterName] = config.filterParameterValues[1];
        } else {
          fetchParams[config.filterParameterName] = config.filterParameterValues[0];
        }
      }
    }
    collections.fetch(fetchParams);
  };

  useEffect(() => {
    setCurrentPage(params.page || 1);
    // set interval for fetching new data
    // if interval is set, we fetch new data every x seconds
    if (interval) {
      setInterval(() => {
        if (loadedMore) {
          loadMore();
        } else {
          fetchData(params);
        }
      }, interval);
    }
  }, []);

  useEffect(() => {
    fetchData(params);
  }, [currentPage, sort, order, filter, yearFilter]);

  useEffect(() => {
    if (loadedMore) {
      const newSearchParams = { ...params, size: sizeMore };
      fetchData(newSearchParams);
    }
  }, [loadedMore]);

  const shouldRenderColumn = (columnName, columnsArg) => {
    // Föredra columns om de finns, annars använd props som skickas in som argument
    const newColumns = columns || columnsArg;
    // columns is optional, if it's not set we render all columns
    return newColumns ? newColumns.indexOf(columnName) > -1 : true;
  };

  const archiveIdClick = (e) => {
    const archiveIdRow = e.target.dataset.archiveidrow;
    const { recordtype } = e.target.dataset;
    const { search } = e.target.dataset;
    const newParams = {
      search,
      recordtype,
    };
    if (archiveIdRow) {
      navigate(`/records/${archiveIdRow}${createSearchRoute(newParams)}`);
    }
  };

  const stepPage = (e) => {
    const pageStep = Number(e.target.dataset.pageStep);
    /*
        På vanliga sättet använder vi routern för att säga till vilken sida vi hämtar,
        i moduler som innehåller RecordList (PlaceView, PersonView) lägger vi till
        disableRouterPagination={true}
        till RecordList, då hämtar vi ny sida direkt utan att använda routern
      */
    if (disableRouterPagination) {
      setCurrentPage(currentPage + pageStep);
    } else {
      // Skapar ny router adress via routeHelper,
      // den är baserad på nuvarande params och lägger till ny siffra i 'page'
      const newSearchParams = { ...params, page: Number(currentPage) + pageStep };
      navigate(`/places${createSearchRoute(newSearchParams)}`);
    }
  };

  const sortRecords = (e) => {
    const defaultOrder = 'asc';
    const { name } = e.target;
    const finalOrder = (sort === name && order === 'asc') ? 'desc' : defaultOrder;
    setOrder(finalOrder);
    setSort(e.target.name);
    setCurrentPage(1);
  };

  const renderListPagination = () => (
    (total > 2 || fetchingPage)
    && (
      <div className="list-pagination">
        <p className="page-info"><strong>{`${l('Visar')} ${(currentPage * config.hitsPerPage) - (config.hitsPerPage - 1)}-${currentPage * config.hitsPerPage > total ? total : currentPage * config.hitsPerPage} ${l(total ? 'av' : '')}${l(totalPrefix || '')} ${total || ''}`}</strong></p>
        <br />
        {
          // show only if we have more than one page
          total > config.hitsPerPage
          && (
          < >
            <button disabled={currentPage === 1} className="button prev-button" onClick={stepPage} data-page-step={-1} type="button">{l('Föregående')}</button>
            <span> </span>
            <button disabled={total <= currentPage * config.hitsPerPage} className="button next-button" onClick={stepPage} data-page-step={1} type="button">{l('Nästa')}</button>
          </>
          )
        }
      </div>
    )
  );

  const handleYearFilter = (firstYear, lastYear) => {
    setYearFilter([firstYear, lastYear]);
  };

  const resetOnYearFilter = () => {
    setYearFilter(null);
  };

  // render more records once, without pagination
  const renderMoreButton = () => (
    // return (
    <div>
      <button className="button" onClick={loadMore} type="button">{l('Visa fler')}</button>
    </div>
  );

  const items = records ? records.map((item) => (
    <RecordListItem
      key={item._source.id}
      id={item._source.id}
      item={item}
      routeParams={createSearchRoute(params)}
      highlightRecordsWithMetadataField={highlightRecordsWithMetadataField}
      // propagate siteSearchParams to RecordListItem instead of searchParams if the exist
      // this is used in the StatisticsOverlay to write correct links to the list
      searchParams={params}
      archiveIdClick={archiveIdClick}
      shouldRenderColumn={shouldRenderColumn}
      columns={columns}
      mode={mode}
      useRouteParams={useRouteParams}
      smallTitle={smallTitle}
    />
  )) : [];

  return (
    <>
      {
        hasFilter
        && (
        <div className="filter-wrapper">
          <label htmlFor={`all-filter-${uniqueId}`}>
            <input type="radio" name={`filter-${uniqueId}`} value="" checked={filter === ''} onChange={handleFilterChange} id={`all-filter-${uniqueId}`} />
            Allt
          </label>
          <label htmlFor={`one-accession-row-filter-${uniqueId}`}>
            <input type="radio" name={`filter-${uniqueId}`} value="one_accession_row" checked={filter === 'one_accession_row'} onChange={handleFilterChange} id={`one-accession-row-filter-${uniqueId}`} />
            <sub><img src={PdfGif} style={{ marginRight: 5 }} alt="pdf" title="Accession" /></sub>
            Accessioner
          </label>
          <label htmlFor={`one-record-filter-${uniqueId}`}>
            <input type="radio" name={`filter-${uniqueId}`} value="one_record" checked={filter === 'one_record'} onChange={handleFilterChange} id={`one-record-filter-${uniqueId}`} />
            <FontAwesomeIcon icon={faFileLines} style={{ marginRight: 5 }} alt="jpg" title="Uppteckning" />
            Uppteckningar
          </label>
          <span className="switcher-help-button" onClick={openSwitcherHelptext} title="Om accessioner och uppteckningar">?</span>
        </div>
        )
      }
      {
        hasTimeline
        && (
          <Timeline
            containerRef={containerRef}
            params={params}
            filter={filter}
            mode={mode}
            onYearFilter={handleYearFilter}
            resetOnYearFilter={resetOnYearFilter}
          />
        )
      }
      {
        !fetchingPage
      && (
      <div className={
        `${tableClass ?? ''
        } table-wrapper records-list list-container${records.length == 0 ? ' loading' : fetchingPage ? ' loading-page' : ''}`
      }
      >

        {
          !disableListPagination
          && renderListPagination()
        }

        <table width="100%" className="table-responsive">
          <thead>
            <tr>
              {shouldRenderColumn('title')
                && (
                  <th scope="col">
                    {l('Titel')}
                  </th>
                )}
              {
                shouldRenderColumn('archive_id') && (!config.siteOptions.recordList || !config.siteOptions.recordList.hideAccessionpage == true)
                && (
                  <th scope="col">
                    <a className="sort" onClick={sortRecords} name="archive.archive_id_row.keyword">
                      {
                        (sort === 'archive.archive_id_row.keyword') && (order === 'asc' ? '▼' : '▲')
                      }
                      {
                        l('Arkivnummer')
                      }
                      {
                        params.recordtype === 'one_record' ? ':Sida' : ''
                      }
                    </a>
                  </th>
                )
              }
              {/* {
                shouldRenderColumn('category') && (!config.siteOptions.recordList || !config.siteOptions.recordList.hideCategories === true && params.recordtype !== 'one_accession_row')
                && (
                  <th scope="col">
                    <a className="sort" onClick={sortRecords} name="taxonomy.category">
                      {
                        (sort === 'taxonomy.category') && (order === 'asc' ? '▼' : '▲')
                      }
                      {l('Kategori')}
                    </a>
                  </th>
                )
              } */}

              {shouldRenderColumn('place')
                && <th scope="col">{l('Ort')}</th>}
              {
                shouldRenderColumn('collector') && (!config.siteOptions.recordList || !config.siteOptions.recordList.visibleCollecorPersons || config.siteOptions.recordList.visibleCollecorPersons == true)
                && (
                  <th scope="col">
                    {l('Insamlare')}
                  </th>
                )
              }
              {
                shouldRenderColumn('year')
                && (
                  <th scope="col">
                    <a className="sort" onClick={sortRecords} name="year">
                      {
                        (sort === 'year') && (order === 'asc' ? '▼' : '▲')
                      }
                      {l('År')}
                    </a>
                  </th>
                )
              }
              {
                shouldRenderColumn('material_type') && !config.siteOptions.recordList || !config.siteOptions.recordList.hideMaterialType == true
                && <th scope="col">{l('Materialtyp')}</th>
              }
              {
                shouldRenderColumn('transcriptionstatus') && (!config.siteOptions.recordList || !config.siteOptions.recordList.hideTranscriptionStatus == true)
                && (
                  <th scope="col">
                    <a className="sort" onClick={sortRecords} name="transcriptionstatus.keyword">
                      {
                        (sort === 'transcriptionstatus.keyword') && (order === 'asc' ? '▼' : '▲')
                      }
                      {l('Avskriven')}
                    </a>
                  </th>
                )
              }
              {
                // Den här kolumnen måste explicit läggas till i props.columns (används bara för "senast avskrivna" på sidmenyn)
                columns && columns.indexOf('transcribedby') > -1
                && (
                  <th scope="col">
                    {l('Transkriberad av')}
                  </th>
                )
              }
            </tr>
          </thead>
          <tbody>
            {items}
          </tbody>
        </table>

        {
          !disableListPagination
          && renderListPagination()
        }
        {
          // Checks if sizeMore prop is set and if the number of records is less than sizeMore
          // If so, render the more button
          sizeMore && records.length < sizeMore
          && renderMoreButton()

        }
      </div>
      )
}
      {
  fetchingPage && (
    <p className="page-info"><strong>Söker...</strong></p>
  )
}
      {
  !fetchingPage && records.length === 0 && (
    <div className="table-wrapper list-container">
      <h3>{l('Inga sökträffar.')}</h3>
    </div>
  )
}
    </>
  );
}
