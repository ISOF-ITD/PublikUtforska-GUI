import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import config from '../../../config';
import { l } from '../../../lang/Lang';
import {
  createDetailLocation,
  createResultSearch,
} from '../../../utils/routeHelper';

export default function CollectorList({
  persons,
  searchParams,
  pillClasses,
  detailSearch,
}) {
  if (!config.siteOptions.recordList?.visibleCollecorPersons) return null;

  const collectors = persons?.filter((p) => (
    ['c', 'collector', 'interviewer', 'recorder'].includes(p.relation)
  ));

  if (!collectors?.length) return null;
  return collectors.map((p) => (
    <Link
      key={`collector-${p.id}-${p.relation}-${p.name}`}
      to={createDetailLocation({
        resource: 'persons',
        id: p.id.toLowerCase(),
        search: createResultSearch(searchParams, detailSearch),
      })}
      className={`${pillClasses} bg-surface text-link hover:underline`}
    >
      {l(p.name)}
    </Link>
  ));
}

CollectorList.propTypes = {
  persons: PropTypes.array,
  searchParams: PropTypes.object.isRequired,
  pillClasses: PropTypes.string.isRequired,
  detailSearch: PropTypes.string,
};
