/* eslint-disable react/require-default-props */
import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import { l } from "../../../lang/Lang";
import config from "../../../config";

function renderPersonItem(person, routeParams) {
  return (
    <tr key={person.id} className="border-b last:border-b-0 odd:bg-gray-100">
      <td
        data-title=""
        className="py-3 px-2 md:py-2 md:px-4 underline-offset-2"
      >
        {/* If no person link should be shown for an informant */}
        {!config.siteOptions.disablePersonLinks &&
          config.siteOptions.disableInformantLinks &&
          ["i", "informant"].includes(person.relation) &&
          person.name}

        {/* If link should be shown (normal case) */}
        {!config.siteOptions.disablePersonLinks &&
          !(
            config.siteOptions.disableInformantLinks &&
            ["i", "informant"].includes(person.relation)
          ) && (
            <Link
              to={`/persons/${person.id}${routeParams}`}
              className="text-isof"
            >
              {person.name || ""}
            </Link>
          )}

        {/* If person links are disabled entirely */}
        {config.siteOptions.disablePersonLinks && person.name}
      </td>

      <td data-title="Födelseår" className="py-3 px-2 md:py-2 md:px-4">
        {person.birth_year && person.birth_year > 0 ? person.birth_year : ""}
      </td>

      <td data-title="Födelseort" className="py-3 px-2 md:py-2 md:px-4">
        {person.home && person.home.length > 0 && (
          <Link
            to={`/places/${person.home[0].id}${routeParams}`}
            className="text-isof hover:underline"
          >
            {`${person.home[0].name}, ${person.home[0].harad}`}
          </Link>
        )}
        {person.birthplace ? ` ${person.birthplace}` : ""}
      </td>

      <td data-title="Roll" className="py-3 px-2 md:py-2 md:px-4">
        {["c", "collector"].includes(person.relation) && l("Insamlare")}
        {["i", "informant"].includes(person.relation) && l("Informant")}
        {person.relation === "excerpter" && l("Excerpist")}
        {person.relation === "author" && l("Författare")}
        {person.relation === "recorder" && l("Inspelad av")}
        {person.relation === "photographer" && l("Fotograf")}
        {person.relation === "interviewer" && l("Intervjuare")}
        {person.relation === "mentioned" && l("Omnämnd")}
        {person.relation === "artist" && l("Konstnär")}
        {person.relation === "illustrator" && l("Illustratör")}
        {person.relation === "sender" && l("Avsändare")}
        {person.relation === "receiver" && l("Mottagare")}
      </td>
    </tr>
  );
}

function PersonItems({ data, routeParams = "" }) {
  const { persons } = data;
  if (!persons || persons.length === 0) return null;

  return (
    <div className="w-full mb-4">
      <h3 className="text-xl font-bold">{l("Personer")}</h3>
      <div className="overflow-x-auto border rounded">
        <table className="w-full text-left border-collapse table-auto">
          <thead className="sr-only md:table-header-group">
            <tr>
              <th scope="col" className="py-2 px-4 font-semibold">{l('Namn')}</th>
              <th scope="col" className="py-2 px-4 font-semibold">{l('Födelseår')}</th>
              <th scope="col" className="py-2 px-4 font-semibold">{l('Födelseort')}</th>
              <th scope="col" className="py-2 px-4 font-semibold">{l('Roll')}</th>
            </tr>
          </thead>
          <tbody>
            {persons.map((person) => renderPersonItem(person, routeParams))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default PersonItems;

PersonItems.propTypes = {
  data: PropTypes.object.isRequired,
  routeParams: PropTypes.string,
};
