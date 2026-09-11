import PropTypes from 'prop-types';
import RecordCardItem from './RecordCardItem';
import { RESULT_CARD_GRID_CLASS } from './resultListStyles';

export default function RecordCards({
  records,
  params,
  mode,
  highlightRecordsWithMetadataField,
  selectedRecordId,
  onRecordActivate,
  parishPreview,
  layout = 'mobile-only', // 'mobile-only' | 'pane-compact' | 'desktop-grid'
  detailSearch = '',
}) {
  let wrapperClass = 'md:hidden space-y-4';
  if (layout === 'pane-compact') {
    wrapperClass = 'space-y-4';
  } else if (layout === 'desktop-grid') {
    wrapperClass = RESULT_CARD_GRID_CLASS;
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
          parishPreview={parishPreview}
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
  parishPreview: PropTypes.shape({
    onHover: PropTypes.func.isRequired,
    onFocus: PropTypes.func.isRequired,
  }),
  layout: PropTypes.oneOf(['mobile-only', 'pane-compact', 'desktop-grid']),
  detailSearch: PropTypes.string,
};
