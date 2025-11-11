/* eslint-disable react/require-default-props */
import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import RecordList from "../../../features/RecordList/RecordList";
import { l } from "../../../lang/Lang";

export default function SubrecordsElement({
  data,
  subrecordsCount,
  mode = "material",
}) {
  const {
    recordtype,
    id,
    archive: { archive_id_row: archiveIdRow },
    segments = [],
    media = [],
    update_status,
  } = data;

  const hasSegments =
    update_status === "segments" || (Array.isArray(segments) && segments.length);

  // in the new model, the count endpoint may still say 0 even though we have segments,
  // so we look at the actual array first
  if (!hasSegments && (subrecordsCount.value === 0 || recordtype === "one_record"))
    return null;

  // NEW MODEL: render segments that belong to this accession
  if (hasSegments) {
    const mediaById = new Map(media.map((m) => [m.id, m]));
    return (
      <div className="row">
        <div className="twelve columns">
          <h3>{l("Uppteckningar i den här accessionen")}</h3>
          <ul className="list-disc pl-5">
            {segments.map((seg, i) => {
              const m = mediaById.get(seg.start_media_id);
              const href = `/records/${id}?media=${seg.start_media_id}`;
              return (
                <li key={seg.id}>
                  <Link to={href} className="text-isof hover:underline">
                    {m?.title || `${l("Sida")} ${i + 1}`}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    );
  }
}

SubrecordsElement.propTypes = {
  data: PropTypes.object.isRequired,
  subrecordsCount: PropTypes.object.isRequired,
  mode: PropTypes.string,
};
