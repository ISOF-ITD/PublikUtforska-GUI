/* eslint-disable react/prop-types */
import PropTypes from "prop-types";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faHighlighter } from "@fortawesome/free-solid-svg-icons";

export default function HighlightSwitcher({ highlight, setHighlight, id = 'highlight' }) {
  return (
    <label htmlFor={id} className="flex items-center gap-1">
      <input
        type="checkbox"
        id={id}
        checked={highlight}
        onChange={() => setHighlight(!highlight)}
      />
      <span className="flex items-center gap-1">
        <FontAwesomeIcon icon={faHighlighter} aria-hidden="true" />
        <span className="select-none">Markera träffar</span>
      </span>
    </label>

  );
}

HighlightSwitcher.propTypes = {
  highlight: PropTypes.bool.isRequired,
  setHighlight: PropTypes.func.isRequired,
  id: PropTypes.string,
};