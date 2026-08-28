import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import config from '../../../config';
import { l } from '../../../lang/Lang';
import { createSearchRoute, mergeRouteSearch } from '../../../utils/routeHelper';

export default function CollectorList({
  persons,
  mode,
  searchParams,
  pillClasses,
  detailSearch,
}) {
  if (!config.siteOptions.recordList?.visibleCollecorPersons) return null;

  const collectors = persons?.filter((p) => (
    ['c', 'collector', 'interviewer', 'recorder'].includes(p.relation)
  ));

  if (!collectors?.length) return null;
  const searchSuffix = createSearchRoute(searchParams);

  return collectors.map((p) => (
    <Link
      key={`collector-${p.id}-${p.relation}-${p.name}`}
      to={mergeRouteSearch(
        `${
          mode === 'transcribe' ? '/transcribe' : ''
        }/persons/${p.id.toLowerCase()}${
          searchSuffix === '/' ? '' : searchSuffix
        }`,
        detailSearch,
      )}
      className={`${pillClasses} bg-surface text-link hover:underline`}
    >
      {l(p.name)}
    </Link>
  ));
}

CollectorList.propTypes = {
  persons: PropTypes.array,
  mode: PropTypes.string.isRequired,
  searchParams: PropTypes.object.isRequired,
  pillClasses: PropTypes.string.isRequired,
  detailSearch: PropTypes.string,
};
