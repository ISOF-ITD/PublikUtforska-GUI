import PropTypes from 'prop-types';
import SimpleMap from '../SimpleMap';
import { l } from '../../../lang/Lang';

function PlaceItems({ data, routeParams = '' }) {
  const { places = [] } = data;

  // Hanterar fall där `places` saknas eller är tom
  if (!places.length) return null;

  const placeItems = places.map((place) => {
    const {
      id, specification, name, fylke, harad,
    } = place;
    const placeName = `${specification ? `${specification} i ` : ''}${name}, ${fylke || harad}`;
    const linkUrl = `#/places/${id}${routeParams}`;

    return (
      <tr key={id}>
        <td>
          <a href={linkUrl}>{placeName}</a>
        </td>
      </tr>
    );
  });

  const renderMap = () => {
    const { lat, lon } = places[0].location || {};
    return lat && lon ? <SimpleMap markers={places} /> : null;
  };

  return (
    <div className="row">
      <div className="six columns">
        <h3>{l('Platser')}</h3>
        <div className="table-wrapper">
          <table width="100%">
            <thead>
              <tr>
                <th>{l('Namn')}</th>
              </tr>
            </thead>
            <tbody>{placeItems}</tbody>
          </table>
        </div>
      </div>
      <div className="six columns">{renderMap()}</div>
    </div>
  );
}

PlaceItems.propTypes = {
  data: PropTypes.shape({
    places: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.string.isRequired,
        specification: PropTypes.string,
        name: PropTypes.string.isRequired,
        fylke: PropTypes.string,
        harad: PropTypes.string,
        location: PropTypes.shape({
          lat: PropTypes.number,
          lon: PropTypes.number,
        }),
      }),
    ),
  }),
  routeParams: PropTypes.string,
};

export default PlaceItems;
