import PropTypes from 'prop-types';

import { useState } from 'react';

import { useParams, useLocation } from 'react-router-dom';

import RecordList from './RecordList';
import { createParamsFromSearchRoute } from '../../utils/routeHelper';

import L from '../../../ISOF-React-modules/lang/Lang';

const l = L.get;

export default function RecordListWrapper({
  disableListPagination,
  disableRouterPagination,
  highlightRecordsWithMetadataField,
  mode,
  hasFilter,
}) {
  RecordListWrapper.propTypes = {
    disableListPagination: PropTypes.bool,
    disableRouterPagination: PropTypes.bool,
    highlightRecordsWithMetadataField: PropTypes.string,
    mode: PropTypes.string,
    hasFilter: PropTypes.bool,
  };

  RecordListWrapper.defaultProps = {
    disableListPagination: false,
    disableRouterPagination: true,
    highlightRecordsWithMetadataField: null,
    mode: 'material',
    hasFilter: false,
  };

  const params = useParams();
  const location = useLocation();
  const [filter, setFilter] = useState('');

  const handleFilterChange = (event) => {
    setFilter(event.target.value);
  };

  return (
    <div className="container">
      <div className="container-header">
        <div className="row">
          <div className="twelve columns">
            <h2>
              {l('Sökträffar som lista')}
            </h2>
          </div>
        </div>
      </div>

      <div className="row">
        <div className="records-list-wrapper">
          {
            hasFilter
            && (
            <div className="filter-wrapper">
              <label htmlFor="all-filter">
                <input type="radio" name="filter" value="" checked={filter === ''} onChange={handleFilterChange} id="all-filter" />
                Allt
              </label>
              <label htmlFor="one-accession-row-filter">
                <input type="radio" name="filter" value="one_accession_row" checked={filter === 'one_accession_row'} onChange={handleFilterChange} id="one-accession-row-filter" />
                Accessioner
              </label>
              <label htmlFor="one-record-filter">
                <input type="radio" name="filter" value="one_record" checked={filter === 'one_record'} onChange={handleFilterChange} id="one-record-filter" />
                Uppteckningar
              </label>
            </div>
            )
          }
          <RecordList
            key={`RecordListWrapper-RecordList-${location.pathname}`}
            // searchParams={routeHelper.createParamsFromPlacesRoute(this.props.location.pathname)}
            highlightRecordsWithMetadataField={highlightRecordsWithMetadataField}
            disableListPagination={disableListPagination}
            disableRouterPagination={disableRouterPagination}
            params={{
              ...createParamsFromSearchRoute(params['*']),
              recordtype: mode === 'transcribe' ? 'one_accession_row' : (filter || null),
              has_untranscribed_records: mode === 'transcribe' ? 'true' : null,
              transcriptionstatus: mode === 'transcribe' ? null : 'published,accession',
            }}
            mode={mode}
          />
        </div>
      </div>
    </div>
  );
}
