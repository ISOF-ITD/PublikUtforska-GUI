/* eslint-disable react/require-default-props */
import PropTypes from 'prop-types';
import { useId } from 'react';
import { Link } from 'react-router-dom';
import { l } from '../../../lang/Lang';
import config from '../../../config';
import { createDetailLocation } from '../../../utils/routeHelper';
import groupPersons from './groupPersons';

function renderPersonItem(person, location) {
  return (
    <tr
      key={person.groupKey}
      className="border-b border-border last:border-b-0 odd:bg-surface-muted even:bg-surface text-body"
    >
      <td
        data-title=""
        className="py-3 px-2 md:py-2 md:px-4 underline-offset-2"
      >
        {/* If no person link should be shown for an informant */}
        {!config.siteOptions.disablePersonLinks
          && config.siteOptions.disableInformantLinks
          && person.isInformant
          && person.name}

        {/* If link should be shown (normal case) */}
        {!config.siteOptions.disablePersonLinks
          && !(
            config.siteOptions.disableInformantLinks
            && person.isInformant
          ) && (
            <Link
              to={createDetailLocation({
                resource: 'persons',
                id: person.id,
                search: location.search,
              })}
              className="text-link"
            >
              {person.name || ''}
            </Link>
        )}

        {/* If person links are disabled entirely */}
        {config.siteOptions.disablePersonLinks && person.name}
      </td>

      <td data-title="Födelseår" className="py-3 px-2 md:py-2 md:px-4">
        {person.birth_year && person.birth_year > 0 ? person.birth_year : ''}
      </td>

      <td data-title="Födelseort" className="py-3 px-2 md:py-2 md:px-4">
        {person.home && person.home.length > 0 && (
          <Link
            to={createDetailLocation({
              resource: 'places',
              id: person.home[0].id,
              search: location.search,
            })}
            className="text-link hover:underline"
          >
            {`${person.home[0].name}, ${person.home[0].harad}`}
          </Link>
        )}
        {person.birthplace ? ` ${person.birthplace}` : ''}
      </td>

      <td data-title="Roll" className="py-3 px-2 md:py-2 md:px-4">
        {person.roles.join(', ')}
      </td>
    </tr>
  );
}

function PersonItems({ data, location, headingId }) {
  const generatedHeadingId = useId();
  const titleId = headingId || generatedHeadingId;
  const { persons } = data;
  if (!persons || persons.length === 0) return null;

  return (
    <section aria-labelledby={titleId} className="w-full mb-4">
      <h2 id={titleId} tabIndex={-1} className="text-xl font-bold focus-visible:outline focus-visible:outline-2 focus-visible:outline-focus">{l('Personer')}</h2>
      <div className="overflow-x-auto rounded border border-border bg-surface text-body">
        <table aria-labelledby={titleId} className="w-full text-left border-collapse table-auto">
          <thead className="sr-only md:table-header-group">
            <tr>
              <th scope="col" className="py-2 px-4 font-semibold">{l('Namn')}</th>
              <th scope="col" className="py-2 px-4 font-semibold">{l('Födelseår')}</th>
              <th scope="col" className="py-2 px-4 font-semibold">{l('Födelseort')}</th>
              <th scope="col" className="py-2 px-4 font-semibold">{l('Roll')}</th>
            </tr>
          </thead>
          <tbody>
            {groupPersons(persons).map((person) => renderPersonItem(person, location))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default PersonItems;

PersonItems.propTypes = {
  headingId: PropTypes.string,
  data: PropTypes.object.isRequired,
  location: PropTypes.shape({
    search: PropTypes.string.isRequired,
  }).isRequired,
};
