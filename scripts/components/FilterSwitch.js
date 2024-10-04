/* eslint-disable react/require-default-props */
import PropTypes from 'prop-types';
import { useParams, Link } from 'react-router-dom';
import { createSearchRoute, createParamsFromSearchRoute } from '../utils/routeHelper';
import { l } from '../lang/Lang';

export default function FilterSwitch({ mode = 'material' }) {
  const params = useParams();

  return (
    <div className="nordic-switch-wrapper map-floating-control">
      <Link
        to={
          `/${createSearchRoute(createParamsFromSearchRoute(params['*']))
          // remove leading slash if it exists
            .replace(/^\//, '')}`
        }
        className={mode === 'material' ? 'selected' : ''}
      >
        {l('Arkivmaterial')}
      </Link>
      <Link
        to={`/transcribe/${createSearchRoute(createParamsFromSearchRoute(params['*'])).replace(/^\//, '')}`}
        className={mode === 'transcribe' ? 'selected' : ''}
      >
        {l('Skriva av')}
      </Link>
    </div>
  );
}

FilterSwitch.propTypes = {
  mode: PropTypes.string,
};
