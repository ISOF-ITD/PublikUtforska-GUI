import PropTypes from 'prop-types';

import { useEffect, useState } from 'react';

import { useParams, useLocation } from 'react-router-dom';

import RecordList from './RecordList';
import routeHelper from '../../utils/routeHelper';


import L from '../../../ISOF-React-modules/lang/Lang';

const l = L.get;

export default function RecordListWrapper({
  manuallyOpenPopup,
  openButtonLabel,
  disableRouterPagination,
  highlightRecordsWithMetadataField,
}) {
  RecordListWrapper.propTypes = {
    manuallyOpenPopup: PropTypes.bool,
    openButtonLabel: PropTypes.string,
    disableRouterPagination: PropTypes.bool,
    highlightRecordsWithMetadataField: PropTypes.string,
  };

  RecordListWrapper.defaultProps = {
    manuallyOpenPopup: true,
    openButtonLabel: 'Visa',
    disableRouterPagination: true,
    highlightRecordsWithMetadataField: null,
  };

  const params = useParams();
  const location = useLocation();

  const [searchParams, setSearchParams] = useState(routeHelper.createParamsFromSearchRoute(params['*']));

  useEffect(() => {
    setSearchParams(routeHelper.createParamsFromPlacesRoute(params['*']));
  }, [params['*']]);

  return (
    <div className="container">
      <div className="container-header">
        <div className="row">
          <div className="twelve columns">
            <h2>
              {l('Sökträffar som lista')}
              {' '}
              –
              {' '}
              {searchParams.recordtype === 'one_accession_row' ? 'Accessioner' : 'Uppteckningar'}
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
          />
        </div>
      </div>
    </div>
  );
}