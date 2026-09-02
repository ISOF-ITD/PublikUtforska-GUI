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
}) {
  let wrapperClass = 'md:hidden space-y-4';
  if (layout === 'pane-compact') {
    wrapperClass = 'space-y-4';
  } else if (layout === 'desktop-grid') {
    wrapperClass = 'grid grid-cols-[repeat(auto-fit,minmax(min(100%,22rem),1fr))] gap-4';
  }

  return (
    <div className={wrapperClass}>
      {records.map((rec, index) => (
        <RecordCardItem
          key={`${rec?._id || rec?._source?.id || 'record'}-${index}`}
          item={rec}
          searchParams={params}
          mode={mode}
          highlightRecordsWithMetadataField={highlightRecordsWithMetadataField}
          isSelected={String(rec._source.id) === String(selectedRecordId)}
          onRecordActivate={onRecordActivate}
          detailSearch={detailSearch}
        />
      ))}
    </div>
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
};
