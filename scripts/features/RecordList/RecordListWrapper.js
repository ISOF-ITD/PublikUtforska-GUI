/* eslint-disable react/require-default-props */
import PropTypes from 'prop-types';

import { useRef, useCallback, useMemo } from 'react';
import { useLocation, useParams } from 'react-router-dom';

import RecordList from './RecordList';
import { createParamsFromSearchRoute } from '../../utils/routeHelper';

import { l } from '../../lang/Lang';

export default function RecordListWrapper({
  disableListPagination = false,
  disableRouterPagination = true,
  highlightRecordsWithMetadataField = null,
  mode = 'material',
}) {
  const params = useParams();
  const location = useLocation();
  const searchRoutePath = params['*'];
  const containerRef = useRef();
  const searchParams = useMemo(
    () => {
      const routeParams = createParamsFromSearchRoute(searchRoutePath);
      const queryParams = new URLSearchParams(location.search);
      const queryRecordIds = queryParams.get('record_ids');

      if (!queryRecordIds || routeParams.record_ids) return routeParams;
      return {
        ...routeParams,
        record_ids: queryRecordIds,
      };
    },
    [location.search, searchRoutePath],
  );
  const isStarredRecordList = Boolean(searchParams.record_ids);

  // Memoize openSwitcherHelptext för att undvika omrenderingar
  const openSwitcherHelptext = useCallback(() => {
    if (window.eventBus) {
      window.eventBus.dispatch('overlay.HelpText', { kind: 'switcher' });
    }
  }, []); // Tom array för att se till att funktionen inte återskapas varje gång

  return (
    <div className="container this-class-is-always-visible">
      <div className="container-header max-lg:!pt-[74px]">
        <div className="row">
          <div className="twelve columns">
            <h1>
              {isStarredRecordList
                ? l('Stjärnmarkerat arkivmaterial')
                : l('Sökträffar som lista')}
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
              ...searchParams,
              // Ignore other (older) record types:
              // In requiredParams in config.js:
              // recordtype: 'one_accession_row',
            }}
            mode={mode}
            hasFilter={mode !== 'transcribe'}
            hasTimeline={!isStarredRecordList}
            showViewToggle
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
