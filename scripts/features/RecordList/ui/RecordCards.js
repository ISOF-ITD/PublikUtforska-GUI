import PropTypes from "prop-types";
import { RecordCardItem } from "./RecordCardItem";

export default function RecordCards({
  records,
  params,
  mode,
  highlightRecordsWithMetadataField,
  layout = "mobile-only", // 'mobile-only' | 'desktop-grid'
}) {
  const wrapperClass =
    layout === "desktop-grid"
      ? "grid grid-cols-1 md:grid-cols-2 gap-4" // 2 columns on md+
      : "md:hidden space-y-4";

  return (
    <div className={wrapperClass}>
      {records.map((rec) => (
        <RecordCardItem
          key={rec._source.id}
          item={rec}
          searchParams={params}
          mode={mode}
          highlightRecordsWithMetadataField={highlightRecordsWithMetadataField}
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
  layout: PropTypes.oneOf(["mobile-only", "desktop-grid"]),
};
