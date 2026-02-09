import PropTypes from "prop-types";
import { l } from "../../../lang/Lang";
import { pageFromTo } from "../../../utils/helpers";

export default function AccessionIdCell({
  archive,
  recordtype,
  pillClasses,
  searchParams,
  archiveIdClick,
}) {
  const base = (
    <span className="whitespace-nowrap md:whitespace-normal">
      {archive.archive_id_display_search?.join(", ") || ""}
      {archive.page &&
        `:${
          recordtype === "one_record"
            ? pageFromTo({ _source: { archive } })
            : archive.page
        }`}
    </span>
  );

  // parent-level → just show
  if (recordtype === "one_accession_row" || recordtype === "one_audio_record") {
    return (
      <td
        data-title={`${l("Arkivnummer")}:`}
        className="py-2 whitespace-nowrap md:whitespace-normal"
      >
        <span className={pillClasses}>{base}</span>
      </td>
    );
  }

  // child-level → link UP to accession (kept so this data structure can be used)
  if (recordtype === "one_record")
    return (
      <td
        data-title={`${l("Arkivnummer")}:`}
        className="py-2 whitespace-nowrap md:whitespace-normal"
      >
        <button type="button"
          data-archiveidrow={archive.archive_id_row}
          onClick={archiveIdClick}
          className={`${pillClasses} bg-white text-isof underline hover:bg-gray-100 cursor-pointer`}
        >
          {base}
        </button>
      </td>
    );

  // everything else → just show, no more "go to one_record"
  return (
    <td data-title={`${l("Arkivnummer")}:`} className="py-2">
      <span className={pillClasses}>{base}</span>
    </td>
  );
}

AccessionIdCell.propTypes = {
  archive: PropTypes.object.isRequired,
  recordtype: PropTypes.string.isRequired,
  pillClasses: PropTypes.string.isRequired,
  searchParams: PropTypes.object.isRequired,
  archiveIdClick: PropTypes.func.isRequired,
};
