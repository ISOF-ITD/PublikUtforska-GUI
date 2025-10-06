/* eslint-disable react/prop-types */
import PropTypes from 'prop-types';

export default function HighlightSwitcher({ highlight, setHighlight, id = 'highlight' }) {
  return (
    <label htmlFor={id}>
      <input
        type="checkbox"
        id={id}
        checked={highlight}
        onChange={() => setHighlight(!highlight)}
      />
      <span style={{ marginLeft: 10, userSelect: 'none' }}>Markera sökord</span>
    </label>

  );
}

HighlightSwitcher.propTypes = {
  highlight: PropTypes.bool.isRequired,
  setHighlight: PropTypes.func.isRequired,
  id: PropTypes.string,
};