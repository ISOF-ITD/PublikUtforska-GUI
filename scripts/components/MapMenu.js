import PropTypes from 'prop-types';
import SearchBox from './SearchBox';
import FilterSwitch from './FilterSwitch';

export default function MapMenu({ expanded }) {
  MapMenu.propTypes = {
    expanded: PropTypes.bool.isRequired,
  };

  return (
    <div className={`menu-wrapper${expanded ? ' menu-expanded' : ''}`}>
      <FilterSwitch />
      <SearchBox
        expanded={expanded}
      />
    </div>
  );
}
