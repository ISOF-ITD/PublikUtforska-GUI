import PropTypes from 'prop-types';
import SearchBox from './SearchBox';
import FilterSwitch from './FilterSwitch';

export default function MapMenu({ mode, params, recordsData, loading }) {
  MapMenu.propTypes = {
    mode: PropTypes.string,
    params: PropTypes.object.isRequired,
    recordsData: PropTypes.object,
    loading: PropTypes.bool.isRequired,
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
        loading={loading}
      />
    </div>
  );
}
