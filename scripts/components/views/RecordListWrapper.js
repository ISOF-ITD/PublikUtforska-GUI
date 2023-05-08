import PropTypes from 'prop-types';

import { useState } from 'react';

import { useParams, useLocation } from 'react-router-dom';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFileLines } from '@fortawesome/free-solid-svg-icons';
import PdfGif from '../../../img/pdf.gif';

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
  openSwitcherHelptext,
}) {
  RecordListWrapper.propTypes = {
    disableListPagination: PropTypes.bool,
    disableRouterPagination: PropTypes.bool,
    highlightRecordsWithMetadataField: PropTypes.string,
    mode: PropTypes.string,
    hasFilter: PropTypes.bool,
    openSwitcherHelptext: PropTypes.func.isRequired,
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
                <sub><img src={PdfGif} style={{ marginRight: 5 }} alt="pdf" title="Accession" /></sub>
                Accessioner
              </label>
              <label htmlFor="one-record-filter">
                <input type="radio" name="filter" value="one_record" checked={filter === 'one_record'} onChange={handleFilterChange} id="one-record-filter" />
                <FontAwesomeIcon icon={faFileLines} style={{ marginRight: 5 }} alt="jpg" title="Uppteckning" />
                Uppteckningar
              </label>
              <span className="switcher-help-button" onClick={openSwitcherHelptext} title="Om accessioner och uppteckningar">?</span>
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
