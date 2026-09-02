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
  layoutContext = 'viewport',
  resultTotal = null,
  loading = false,
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
  const detailSearch = useMemo(() => location.search, [location.search]);
  const isEmbeddedResults = layoutContext === 'results-pane';
  const Heading = isEmbeddedResults ? 'h2' : 'h1';
  const resultCount = resultTotal?.value;
  const resultHeading = Number.isFinite(resultCount)
    ? `${resultCount.toLocaleString('sv-SE')}${resultTotal.relation === 'gte' ? '+' : ''} ${
      l(resultCount === 1 ? 'sökträff' : 'sökträffar')
    }`
    : l('Sökträffar');

  // Memoize openSwitcherHelptext för att undvika omrenderingar
  const openSwitcherHelptext = useCallback(() => {
    if (window.eventBus) {
      window.eventBus.dispatch('overlay.HelpText', { kind: 'switcher' });
    }
  }, []); // Tom array för att se till att funktionen inte återskapas varje gång

  return (
    <div className="min-h-full bg-surface text-body">
      <header className={isEmbeddedResults
        ? 'border-b border-border bg-surface px-4 py-3 text-body min-[1440px]:px-8'
        : 'bg-primary px-4 pb-6 pt-8 text-[var(--color-text-inverted)] lg:px-8'}
      >
        <div className="mx-auto w-full max-w-screen-2xl">
          <Heading className={isEmbeddedResults
            ? 'm-0 !text-xl text-body sm:!text-2xl'
            : 'm-0 !text-[var(--color-text-inverted)]'}
          >
            {isStarredRecordList
              ? l('Stjärnmarkerat arkivmaterial')
              : resultHeading}
          </Heading>
        </div>
      </header>

      <div className="mx-auto box-border w-full max-w-screen-2xl px-4 pb-28 pt-2 min-[1440px]:px-8 min-[1440px]:pb-24">
        <div ref={containerRef}>
          <RecordList
            highlightRecordsWithMetadataField={highlightRecordsWithMetadataField}
            disableListPagination={disableListPagination}
            disableRouterPagination={disableRouterPagination}
            params={searchParams}
            mode={mode}
            hasFilter={mode !== 'transcribe'}
            hasTimeline={!isStarredRecordList}
            openSwitcherHelptext={openSwitcherHelptext}
            containerRef={containerRef}
            layoutContext={layoutContext}
            detailSearch={detailSearch}
            loading={loading}
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
  layoutContext: PropTypes.oneOf(['viewport', 'results-pane']),
  resultTotal: PropTypes.shape({
    relation: PropTypes.string,
    value: PropTypes.number,
  }),
  loading: PropTypes.bool,
};
