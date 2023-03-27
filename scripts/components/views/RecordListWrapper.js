import PropTypes from 'prop-types';

import { useEffect } from 'react';

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
}) {
  RecordListWrapper.propTypes = {
    disableListPagination: PropTypes.bool,
    disableRouterPagination: PropTypes.bool,
    highlightRecordsWithMetadataField: PropTypes.string,
    mode: PropTypes.string,
  };

  RecordListWrapper.defaultProps = {
    disableListPagination: false,
    disableRouterPagination: true,
    highlightRecordsWithMetadataField: null,
    mode: 'material',
  };

  const params = useParams();
  const location = useLocation();

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
          <RecordList
            key={`RecordListWrapper-RecordList-${location.pathname}`}
            // searchParams={routeHelper.createParamsFromPlacesRoute(this.props.location.pathname)}
            highlightRecordsWithMetadataField={highlightRecordsWithMetadataField}
            disableListPagination={disableListPagination}
            disableRouterPagination={disableRouterPagination}
            params={{
              ...createParamsFromSearchRoute(params['*']),
              recordtype: mode === 'transcribe' ? 'one_accession_row' : null,
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