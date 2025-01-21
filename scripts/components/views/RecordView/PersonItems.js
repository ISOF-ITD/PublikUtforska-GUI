/* eslint-disable react/require-default-props */
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { l } from '../../../lang/Lang';
import config from '../../../config';

function renderPersonItem(person, routeParams) {
  return (
    <tr key={person.id}>
      <td data-title="">
        {!config.siteOptions.disablePersonLinks && config.siteOptions.disableInformantLinks && ['i', 'informant'].includes(person.relation) && person.name}
        {!config.siteOptions.disablePersonLinks && !(config.siteOptions.disableInformantLinks && ['i', 'informant'].includes(person.relation)) && <Link to={`/persons/${person.id}${routeParams}`}>{person.name || ''}</Link>}
        {config.siteOptions.disablePersonLinks && person.name}
      </td>
      <td data-title="Födelseår">{person.birth_year && person.birth_year > 0 ? person.birth_year : ''}</td>
      <td data-title="Födelseort">
        {
          person.home && person.home.length > 0
          && <Link to={`/places/${person.home[0].id}${routeParams}`}>{`${person.home[0].name}, ${person.home[0].harad}`}</Link>
        }
        {person.birthplace ? ` ${person.birthplace}` : ''}
      </td>
      <td data-title="Roll">
        {['c', 'collector'].includes(person.relation) && l('Insamlare')}
        {['i', 'informant'].includes(person.relation) && l('Informant')}
        {person.relation === 'excerpter' && l('Excerpist')}
        {person.relation === 'author' && l('Författare')}
        {person.relation === 'recorder' && l('Inspelad av')}
        {person.relation === 'photographer' && l('Fotograf')}
        {person.relation === 'interviewer' && l('Intervjuare')}
        {person.relation === 'mentioned' && l('Omnämnd')}
        {person.relation === 'artist' && l('Konstnär')}
        {person.relation === 'illustrator' && l('Illustratör')}
        {person.relation === 'sender' && l('Avsändare')}
        {person.relation === 'receiver' && l('Mottagare')}
      </td>
    </tr>
  );
}

function PersonItems({ data, routeParams = '' }) {
  const { persons } = data;
  if (!persons || persons.length === 0) return null;

  return (
    <div className="row">
      <div className="twelve columns">
        <h3>{l('Personer')}</h3>
        <div className="table-wrapper">
          <table width="100%" className="table-responsive">
            <thead>
              <tr>
                <th>{l('Namn')}</th>
                <th>{l('Födelseår')}</th>
                <th>{l('Födelseort')}</th>
                <th>{l('Roll')}</th>
              </tr>
            </thead>
            <tbody>
              {persons.map((person) => renderPersonItem(person, routeParams))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default PersonItems;

PersonItems.propTypes = {
  data: PropTypes.object.isRequired,
  routeParams: PropTypes.string,
};
