/* eslint-disable react/require-default-props */
import PropTypes from 'prop-types';

import { useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';

import RecordList from '../../features/RecordList/RecordList';
import { createParamsFromSearchRoute } from '../../utils/routeHelper';

import { l } from '../../lang/Lang';

export default function RecordListWrapper({
  disableListPagination = false,
  disableRouterPagination = true,
  highlightRecordsWithMetadataField = null,
  mode = 'material',
}) {
  const params = useParams();
  const containerRef = useRef();

    // Memoize openSwitcherHelptext för att undvika omrenderingar
    const openSwitcherHelptext = useCallback(() => {
      if (window.eventBus) {
        window.eventBus.dispatch('overlay.HelpText', { kind: 'switcher' });
      }
    }, []); // Tom array för att se till att funktionen inte återskapas varje gång

  return (
    <div className="container this-class-is-always-visible">
      <div className="container-header">
        <div className="row">
          <div className="twelve columns">
            <h1>
              {l('Sökträffar som lista')}
            </h1>
          </div>
        </div>
      </div>

      <div className="row">
        <div ref={containerRef}>
          <RecordList
            highlightRecordsWithMetadataField={highlightRecordsWithMetadataField}
            disableListPagination={disableListPagination}
            disableRouterPagination={disableRouterPagination}
            params={{
              ...createParamsFromSearchRoute(params['*']),
              has_untranscribed_records: mode === 'transcribe' ? 'true' : null,
              transcriptionstatus: mode === 'transcribe' ? null : 'published,accession,readytocontribute,readytotranscribe',
              // Ignore other (older) record types:
              // In requiredParams in config.js:
              // recordtype: 'one_accession_row',
            }}
            mode={mode}
            hasFilter={mode !== 'transcribe'}
            hasTimeline
            showViewToggle={true}
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
};
