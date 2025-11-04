import PropTypes from "prop-types";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFileLines, faFilePdf } from "@fortawesome/free-solid-svg-icons";

export default function Filter({ uniqueId, filter, onChange, openHelp }) {
  return (
    <div className="flex items-center gap-2 p-2">
      <label htmlFor={`all-filter-${uniqueId}`}>
        <input
          type="radio"
          name={`filter-${uniqueId}`}
          value=""
          checked={filter === ""}
          onChange={onChange}
          id={`all-filter-${uniqueId}`}
        />
        Allt
      </label>

      <label htmlFor={`one-accession-row-filter-${uniqueId}`}>
        <input
          type="radio"
          name={`filter-${uniqueId}`}
          value="one_accession_row,one_audio_record"
          checked={filter === "one_accession_row,one_audio_record"}
          onChange={onChange}
          id={`one-accession-row-filter-${uniqueId}`}
        />
        <FontAwesomeIcon
          icon={faFilePdf}
          title="Accession"
          className="mx-1 align-middle text-red-500"
          aria-hidden="true"
        />
        Accessioner
      </label>
      <div className="flex items-center">
        <label htmlFor={`one-record-filter-${uniqueId}`}>
          <input
            type="radio"
            name={`filter-${uniqueId}`}
            value="one_record"
            checked={filter === "one_record"}
            onChange={onChange}
            id={`one-record-filter-${uniqueId}`}
          />
          <FontAwesomeIcon
            icon={faFileLines}
            title="Uppteckning"
            className="mx-1 align-middle text-isof"
            aria-hidden="true"
          />
          Uppteckningar
        </label>

        <span
          className="switcher-help-button !mb-2"
          onClick={openHelp}
          title="Om accessioner och uppteckningar"
          role="button"
          tabIndex={0}
          onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && openHelp()}
        >
          ?
        </span>
      </div>
    </div>
  );
}

Filter.propTypes = {
  uniqueId: PropTypes.string,
  filter: PropTypes.string,
  onChange: PropTypes.func,
  openHelp: PropTypes.func,
};
