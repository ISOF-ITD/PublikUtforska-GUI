/* eslint-disable react/require-default-props */
import PropTypes from 'prop-types';

import { useRef } from 'react';
import { useParams, useLocation } from 'react-router-dom';

import RecordList from './RecordList';
import { createParamsFromSearchRoute } from '../../utils/routeHelper';

import { l } from '../../lang/Lang';

export default function RecordListWrapper({
  disableListPagination = false,
  disableRouterPagination = true,
  highlightRecordsWithMetadataField = null,
  mode = 'material',
  openSwitcherHelptext = () => {},
}) {
  const params = useParams();
  const location = useLocation();
  const containerRef = useRef();

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
        <div className="records-list-wrapper" ref={containerRef}>
          <RecordList
            key={`RecordListWrapper-RecordList-${location.pathname}`}
            // searchParams={routeHelper.createParamsFromPlacesRoute(this.props.location.pathname)}
            highlightRecordsWithMetadataField={highlightRecordsWithMetadataField}
            disableListPagination={disableListPagination}
            disableRouterPagination={disableRouterPagination}
            params={{
              ...createParamsFromSearchRoute(params['*']),
              has_untranscribed_records: mode === 'transcribe' ? 'true' : null,
              transcriptionstatus: mode === 'transcribe' ? null : 'published,accession',
            }}
            mode={mode}
            hasFilter={mode !== 'transcribe'}
            hasTimeline
            openSwitcherHelptext={openSwitcherHelptext}
            containerRef={containerRef}
          />
        </div>
      </div>
    </div>
  );
}

RecordListWrapper.propTypes = {
  disableListPagination: PropTypes.bool,
  disableRouterPagination: PropTypes.bool,
  highlightRecordsWithMetadataField: PropTypes.string,
  mode: PropTypes.string,
  openSwitcherHelptext: PropTypes.func,
};
