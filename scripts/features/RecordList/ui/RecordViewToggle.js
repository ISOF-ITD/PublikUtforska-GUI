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
      <span className="text-body">{l('Visa som')}:</span>
      <button
        type="button"
        aria-pressed={value === "table"}
        onClick={() => onChange("table")}
        className={[
          "flex items-center gap-2 px-3 py-1 rounded border",
          value === "table"
            ? 'bg-primary !text-white !hover:text-white border-primary'
            : 'bg-surface hover:bg-surface-hover border-border',
          'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus',
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
            ? 'bg-primary !text-white border-primary !hover:text-white'
            : 'bg-surface hover:bg-surface-hover border-border',
          'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus',
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
