import PropTypes from "prop-types";
import { l } from "../../../lang/Lang";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTable, faGrip } from "@fortawesome/free-solid-svg-icons";

export default function RecordViewToggle({ value, onChange }) {
  // value: 'table' | 'cards'
  return (
    <div
      className="hidden md:flex items-center gap-2"
      aria-label={l("Vyväljare")}
    >
      <span className="text-gray-700">{l("Visa som")}:</span>
      <button
        type="button"
        aria-pressed={value === "table"}
        onClick={() => onChange("table")}
        className={[
          "flex items-center gap-2 px-3 py-1 rounded border",
          value === "table"
            ? "bg-isof !text-white !hover:text-white border-isof"
            : "bg-white hover:bg-gray-100 border-gray-300",
          "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-isof",
        ].join(" ")}
        title={l("Tabell")}
      >
        <FontAwesomeIcon icon={faTable} aria-hidden="true" /> {l("Tabell")}
      </button>

      <button
        type="button"
        aria-pressed={value === "cards"}
        onClick={() => onChange("cards")}
        className={[
          "flex items-center gap-2 px-3 py-1 rounded border",
          value === "cards"
            ? "bg-isof !text-white border-isof !hover:text-white"
            : "bg-white hover:bg-gray-100 border-gray-300",
          "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-isof",
        ].join(" ")}
        title={l("Kort")}
      >
        <FontAwesomeIcon icon={faGrip} aria-hidden="true" /> {l("Kort")}
      </button>
    </div>
  );
}

RecordViewToggle.propTypes = {
  value: PropTypes.oneOf(["table", "cards"]).isRequired,
  onChange: PropTypes.func.isRequired,
};
