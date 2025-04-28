/* eslint-disable react/require-default-props */
import PropTypes from 'prop-types';
import RecordList from '../../../features/RecordList/RecordList';
import { l } from '../../../lang/Lang';

export default function SubrecordsElement({ data, subrecordsCount, mode = 'material' }) {
  const {
    recordtype,
    archive: {
      archive_id_row: archiveIdRow,
    },
  } = data;
  if (subrecordsCount.value === 0 || recordtype === 'one_record') return null;

  return (
    <div className="row">
      <div className="twelve columns">
        <h3>{l('Uppteckningar i den här accessionen')}</h3>
        <RecordList
          params={{
            search: archiveIdRow,
            recordtype: 'one_record',
          }}
          useRouteParams
          mode={mode}
          hasFilter={false}
        />
      </div>
    </div>
  );
}

SubrecordsElement.propTypes = {
  data: PropTypes.object.isRequired,
  subrecordsCount: PropTypes.object.isRequired,
  mode: PropTypes.string,
};
