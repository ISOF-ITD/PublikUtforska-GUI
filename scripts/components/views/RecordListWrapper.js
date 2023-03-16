import PropTypes from 'prop-types';

import { useEffect, useState } from 'react';

import { useParams, useLocation } from 'react-router-dom';

import RecordList from './RecordList';
import routeHelper, { createParamsFromSearchRoute } from '../../utils/routeHelper';


import L from '../../../ISOF-React-modules/lang/Lang';

const l = L.get;

export default function RecordListWrapper({
  manuallyOpenPopup,
  openButtonLabel,
  disableListPagination,
  disableRouterPagination,
  highlightRecordsWithMetadataField,
  mode,
  // params,
}) {
  RecordListWrapper.propTypes = {
    manuallyOpenPopup: PropTypes.bool,
    openButtonLabel: PropTypes.string,
    disableListPagination: PropTypes.bool,
    disableRouterPagination: PropTypes.bool,
    highlightRecordsWithMetadataField: PropTypes.string,
    mode: PropTypes.string,
    // params: PropTypes.object.isRequired,
  };

  RecordListWrapper.defaultProps = {
    manuallyOpenPopup: true,
    openButtonLabel: 'Visa',
    disableListPagination: false,
    disableRouterPagination: true,
    highlightRecordsWithMetadataField: null,
    mode: 'material',
  };

  const params = useParams();
  const location = useLocation();

  useEffect(() => {
    // setSearchParams(routeHelper.createParamsFromPlacesRoute(params['*']));
  }, [params]);

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
            }}
            mode={mode}
          />
        </div>
      </div>
    </div>
  );
}