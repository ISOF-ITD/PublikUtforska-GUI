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
      <span className='ml-3 select-none'>Markera träffar</span>
    </label>

  );
}

HighlightSwitcher.propTypes = {
  highlight: PropTypes.bool.isRequired,
  setHighlight: PropTypes.func.isRequired,
  id: PropTypes.string,
};