import PropTypes from 'prop-types';
import CheckboxIcon from '../CheckboxIcon';
import { l } from '../../lang/Lang';

export default function SearchFilterButton({
  handleFilterChange, label, categoryId, total, checked,
}) {
  return (
    <>
      {/* add no breaking space */}
      <span>&nbsp;</span>
      <div
        className={`search-filter${checked ? ' checked' : ''}`}
      >
        <div className="input-wrapper">
          <input
            type="checkbox"
            id={categoryId}
            checked={checked}
            onChange={handleFilterChange}
            data-filter={categoryId}
            aria-checked={checked}
          />
          <CheckboxIcon />
        </div>
        <label
          className="search-filter-label"
          htmlFor={categoryId}
        >
          {l(label)}
          {' '}
          {`(${total?.value || 0})`}
        </label>
      </div>
    </>
  );
}

SearchFilterButton.propTypes = {
  handleFilterChange: PropTypes.func.isRequired,
  label: PropTypes.string.isRequired,
  categoryId: PropTypes.string.isRequired,
  total: PropTypes.object,
  checked: PropTypes.bool.isRequired,
};

SearchFilterButton.defaultProps = {
  total: null,
};
