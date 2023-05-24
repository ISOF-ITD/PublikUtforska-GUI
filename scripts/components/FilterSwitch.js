import PropTypes from 'prop-types';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { createSearchRoute, createParamsFromSearchRoute } from '../utils/routeHelper';

import Folkelogga from '../../img/folke-white.svg';

export default function FilterSwitch({ mode }) {
  FilterSwitch.propTypes = {
    mode: PropTypes.string,
  };

  FilterSwitch.defaultProps = {
    mode: 'material',
  };

  const params = useParams();

  // const searchParams = routeHelper.createParamsFromSearchRoute(params['*']);

  const openSideMenu = () => {
    if (window.eventBus) {
      window.eventBus.dispatch('overlay.sideMenu', 'visible');
    }
  };

  // const menuButtonClick = (e) => {
  //   const { value } = e.currentTarget.dataset;
  //   const searchParams = {
  //     ...searchParams,
  //     recordtype: value,
  //   };
  //   if (value === 'one_accession_row') {
  //     searchParams.category = undefined;
  //     searchParams.transcriptionstatus = undefined;
  //     // default is digitized material
  //     searchParams.has_media = true;
  //     searchParams.has_transcribed_records = undefined;
  //   } else if (value === 'one_record') {
  //     searchParams.has_media = undefined;
  //     searchParams.has_transcribed_records = undefined;
  //     searchParams.transcriptionstatus = 'readytotranscribe';
  //   }
  //   navigate(
  //     `/places${routeHelper.createSearchRoute(searchParams)}`,
  //   );
  // };

  return (
    <div className="nordic-switch-wrapper map-floating-control">
      <span onClick={openSideMenu} className="open-sidemenu-button" title="Öppna statistik">
        <img src={Folkelogga} alt="Folkelogga" />
      </span>
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
