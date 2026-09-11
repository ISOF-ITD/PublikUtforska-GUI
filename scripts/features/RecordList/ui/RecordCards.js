import PropTypes from 'prop-types';
import RecordCardItem from './RecordCardItem';

export default function RecordCards({
  records,
  params,
  mode,
  highlightRecordsWithMetadataField,
  selectedRecordId,
  onRecordActivate,
  layout = 'mobile-only', // 'mobile-only' | 'pane-compact' | 'desktop-grid'
  detailSearch = '',
  headingLevel = 'h3',
}) {
  let wrapperClass = 'grid grid-cols-1 gap-4 md:hidden';
  if (layout === 'pane-compact') {
    wrapperClass = 'grid grid-cols-1 gap-4';
  } else if (layout === 'desktop-grid') {
    wrapperClass = 'grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3';
  }

  return (
    <ul className={`${wrapperClass} !m-0 !list-none !p-0`}>
      {records.map((rec) => {
        const { _id: hitId, _source: source = {} } = rec || {};
        const recordId = source.id || hitId;

        return (
          <li key={String(recordId)} className="h-full min-w-0">
            <RecordCardItem
              item={rec}
              searchParams={params}
              mode={mode}
              highlightRecordsWithMetadataField={highlightRecordsWithMetadataField}
              isSelected={String(source.id) === String(selectedRecordId)}
              onRecordActivate={onRecordActivate}
              detailSearch={detailSearch}
              headingLevel={headingLevel}
            />
          </li>
        );
      })}
    </ul>
  );
}

RecordCards.propTypes = {
  records: PropTypes.array.isRequired,
  params: PropTypes.object.isRequired,
  mode: PropTypes.string,
  highlightRecordsWithMetadataField: PropTypes.string,
  selectedRecordId: PropTypes.string,
  onRecordActivate: PropTypes.func,
  layout: PropTypes.oneOf(['mobile-only', 'pane-compact', 'desktop-grid']),
  detailSearch: PropTypes.string,
  headingLevel: PropTypes.oneOf(['h2', 'h3', 'h4']),
};
