import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars } from '@fortawesome/free-solid-svg-icons';

import { useNavigate, useParams, Link } from 'react-router-dom';
import routeHelper from '../utils/routeHelper';
import { useEffect } from 'react';

import PropTypes from 'prop-types';

function FilterSwitch({ mode }) {
  FilterSwitch.propTypes = {
    mode: PropTypes.string,
  };

  FilterSwitch.defaultProps = {
    mode: 'material',
  };

  const navigate = useNavigate();
  const params = useParams();

  // const searchParams = routeHelper.createParamsFromSearchRoute(params['*']);

  const openSwitcherHelptext = () => {
    if (window.eventBus) {
      window.eventBus.dispatch('overlay.switcherHelpText', {
      });
    }
  };

  const openSideMenu = () => {
    if (window.eventBus) {
      window.eventBus.dispatch('overlay.sideMenu', 'visible');
    }
  };

  const menuButtonClick = (e) => {
    const { value } = e.currentTarget.dataset;
    const searchParams = {
      ...searchParams,
      recordtype: value,
    };
    if (value === 'one_accession_row') {
      searchParams.category = undefined;
      searchParams.transcriptionstatus = undefined;
      // default is digitized material
      searchParams.has_media = true;
      searchParams.has_transcribed_records = undefined;
    } else if (value === 'one_record') {
      searchParams.has_media = undefined;
      searchParams.has_transcribed_records = undefined;
      searchParams.transcriptionstatus = 'readytotranscribe';
    }
    navigate(
      `/places${routeHelper.createSearchRoute(searchParams)}`,
    );
  };

  return (
    <div className="nordic-switch-wrapper map-floating-control">
      <span onClick={openSideMenu} className="open-sidemenu-button" title="Öppna sidomeny">
        <FontAwesomeIcon icon={faBars} />
      </span>
      <Link to="/" className={mode === 'material' ? 'selected' : ''}>{l('Arkivmaterial')}</Link>
      <Link to="/transcribe" className={mode === 'transcribe' ? 'selected' : ''}>{l('Skriva av')}</Link>
      <span className="switcher-help-button" onClick={openSwitcherHelptext} title="Om accessioner och uppteckningar">?</span>
    </div>
  );
}

export default FilterSwitch;
