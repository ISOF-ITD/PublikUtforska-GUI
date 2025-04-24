import { Link } from "react-router-dom";
import PropTypes from "prop-types";
import config from "../../config";
import { l } from "../../lang/Lang";
import { createSearchRoute } from "../../utils/routeHelper";

export default function CollectorList({
  persons,
  mode,
  searchParams,
  pillClasses,
}) {
  if (!config.siteOptions.recordList?.visibleCollecorPersons) return null;

  const collectors = persons?.filter((p) =>
    ["c", "collector", "interviewer", "recorder"].includes(p.relation)
  );

  if (!collectors?.length) return null;

  return collectors.map((p) => (
    <Link
      key={`collector-${p.id}`}
      to={`${
        mode === "transcribe" ? "/transcribe" : ""
      }/persons/${p.id.toLowerCase()}${createSearchRoute({
        search: searchParams.search,
        search_field: searchParams.search_field,
      })}`}
      className={`${pillClasses} bg-white text-isof hover:underline`}
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
};
