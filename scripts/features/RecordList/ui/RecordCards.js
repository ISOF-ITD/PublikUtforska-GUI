import PropTypes from "prop-types";
import { RecordCardItem } from "./RecordCardItem";

/* Mobile-only list */
export default function RecordCards({
  records,
  params,
  mode,
  highlightRecordsWithMetadataField,
}) {
  return (
    <div className="md:hidden space-y-4">
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
};
