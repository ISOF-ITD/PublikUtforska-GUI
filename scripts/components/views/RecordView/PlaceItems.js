import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import SimpleMap from '../SimpleMap';
import { l } from '../../../lang/Lang';

function PlaceItems({ data, routeParams = '' }) {
  const { places = [] } = data;

  if (!places.length) return null;

  const placeItems = places.map((place) => {
    const {
      id, specification, name, fylke, harad, landskap,
    } = place;

    const placeName = `${specification ? `${specification} i ` : ''}${name}, ${fylke || harad}, ${
      landskap || ''
    }`;
    const linkUrl = `/places/${id}${routeParams}`;

    return (
      <tr key={id} className="border-b last:border-b-0 odd:bg-gray-100">
        <td
          className="py-3 px-2 md:py-2 md:px-4"
        >
          <Link to={linkUrl} className="text-isof hover:underline">
            {placeName}
          </Link>
        </td>
      </tr>
    );
  });

  const renderMap = () => {
    const { lat, lon } = places[0].location || {};
    return lat && lon ? <SimpleMap markers={places} /> : null;
  };

  return (
    <div className="w-full mb-6 md:flex md:gap-4">
      <div className="md:w-1/2">
        <h3 className="text-xl font-bold mb-4">{l('Platser')}</h3>
        <div className="overflow-x-auto border rounded">
          <table className="w-full text-left border-collapse">
            <thead className="md:table-header-group">
              <tr>
                <th className="hidden py-2 px-4 font-semibold">{l('Namn')}</th>
              </tr>
            </thead>
            <tbody>{placeItems}</tbody>
          </table>
        </div>
      </div>
      <div className="md:w-1/2 mt-4 md:mt-0">
        {renderMap()}
      </div>
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
