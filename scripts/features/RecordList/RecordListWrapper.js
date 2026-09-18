/* eslint-disable react/require-default-props */
import PropTypes from 'prop-types';

import { useRef, useMemo } from 'react';
import { useLocation } from 'react-router-dom';

import RecordList from './RecordList';
import { parseResultSearch } from '../../utils/routeHelper';

import { l } from '../../lang/Lang';

export default function RecordListWrapper({
  disableListPagination = false,
  highlightRecordsWithMetadataField = null,
  layoutContext = 'viewport',
  resultTotal = null,
  loading = false,
}) {
  const location = useLocation();
  const containerRef = useRef();
  const searchParams = useMemo(
    () => parseResultSearch(location.search),
    [location.search],
  );
  const isBookmarkedRecordList = Boolean(searchParams.record_ids);
  const detailSearch = useMemo(() => location.search, [location.search]);
  const isEmbeddedResults = layoutContext === 'results-pane';
  const Heading = isEmbeddedResults ? 'h2' : 'h1';
  const resultCount = resultTotal?.value;
  const hasResultCount = Number.isFinite(resultCount);
  const resultHeading = hasResultCount
    ? `${resultCount.toLocaleString('sv-SE')}${resultTotal.relation === 'gte' ? '+' : ''} ${
      l(resultCount === 1 ? 'sökträff' : 'sökträffar')
    }`
    : l('Sökträffar');

  return (
    <div className="min-h-full bg-surface text-body">
      <header className={isEmbeddedResults
        ? 'border-b border-border bg-surface px-4 py-3 text-body min-[1440px]:px-8'
        : 'bg-primary px-4 pb-6 pt-8 text-[var(--color-text-inverted)] lg:px-8'}
      >
        <div className="mx-auto w-full max-w-screen-2xl">
          <Heading
            id="record-list-heading"
            className={isEmbeddedResults
              ? 'm-0 !text-xl text-body sm:!text-2xl'
              : 'm-0 !text-[var(--color-text-inverted)]'}
          >
            {isBookmarkedRecordList
              ? l('Sparat arkivmaterial')
              : resultHeading}
          </Heading>
        </div>
      </header>

      <div className="mx-auto box-border w-full max-w-screen-2xl px-4 pb-28 pt-2 min-[1440px]:px-8 min-[1440px]:pb-24">
        <div ref={containerRef}>
          <RecordList
            highlightRecordsWithMetadataField={highlightRecordsWithMetadataField}
            disableListPagination={disableListPagination}
            params={searchParams}
            hasTimeline={!isBookmarkedRecordList}
            containerRef={containerRef}
            layoutContext={layoutContext}
            detailSearch={detailSearch}
            loading={loading}
            showPaginationTotal={isBookmarkedRecordList || !hasResultCount}
          />
        </div>
      </div>
    </div>
  );
}

RecordListWrapper.propTypes = {
  disableListPagination: PropTypes.bool,
  highlightRecordsWithMetadataField: PropTypes.string,
  layoutContext: PropTypes.oneOf(['viewport', 'results-pane']),
  resultTotal: PropTypes.shape({
    relation: PropTypes.string,
    value: PropTypes.number,
  }),
  loading: PropTypes.bool,
};
