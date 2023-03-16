import PropTypes from 'prop-types';
import SearchBox from './SearchBox';
import FilterSwitch from './FilterSwitch';

export default function MapMenu({ mode, params, recordsData }) {
  MapMenu.propTypes = {
    mode: PropTypes.string,
    params: PropTypes.object.isRequired,
    recordsData: PropTypes.object,
  };

  MapMenu.defaultProps = {
    mode: 'material',
    recordsData: { data: [], metadata: { } },
  };

  return (
    <div className="menu-wrapper menu-expanded">
      <FilterSwitch
        mode={mode}
      />
      <SearchBox
        params={params}
        mode={mode}
        recordsData={recordsData}
      />
    </div>
  );
}
