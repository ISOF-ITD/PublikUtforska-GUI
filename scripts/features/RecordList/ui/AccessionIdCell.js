import PropTypes from "prop-types";
import { l } from "../../../lang/Lang";
import { makeArchiveIdHumanReadable, pageFromTo } from "../../../utils/helpers";

export default function AccessionIdCell({
  archive,
  recordtype,
  pillClasses,
  searchParams,
  archiveIdClick,
}) {
  const base = (
    <span className="whitespace-nowrap md:whitespace-normal">
      {makeArchiveIdHumanReadable(archive.archive_id, archive.archive_org)}
      {archive.page &&
        `:${
          recordtype === "one_record"
            ? pageFromTo({ _source: { archive } })
            : archive.page
        }`}
    </span>
  );

  /* one_accession_row and one_audio_record are both at parent level*/
  if (recordtype === "one_accession_row" || recordtype === "one_audio_record")
    return (
      <td
        data-title={`${l("Arkivnummer")}:`}
        className="py-2 whitespace-nowrap md:whitespace-normal"
      >
        <span className={pillClasses}>{base}</span>
      </td>
    );

  /* one_record → link up to accession */
  if (recordtype === "one_record")
    return (
      <td
        data-title={`${l("Arkivnummer")}:`}
        className="py-2 whitespace-nowrap md:whitespace-normal"
      >
        <a
          data-archiveidrow={archive.archive_id_row}
          data-search={searchParams.search ?? ""}
          data-recordtype={searchParams.recordtype}
          onClick={archiveIdClick}
          className={`${pillClasses} bg-white text-isof underline hover:bg-gray-100 cursor-pointer`}
        >
          {base}
        </a>
      </td>
    );

  /* accession → link down to records */
  return (
    <td data-title={`${l("Arkivnummer")}:`} className="py-2">
      <a
        data-archiveid={archive.archive_id}
        data-recordtype={
          searchParams.recordtype === "one_accession_row"
            ? "one_record"
            : "one_accession_row"
        }
        onClick={archiveIdClick}
        className={`${pillClasses} underline text-isof bg-white hover:bg-gray-100 cursor-pointer`}
      >
        {base}
      </a>
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
