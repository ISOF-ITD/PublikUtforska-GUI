import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars } from '@fortawesome/free-solid-svg-icons';

import { useNavigate, useParams } from 'react-router-dom';
import routeHelper from '../utils/routeHelper';

function FilterSwitch() {
  const navigate = useNavigate();
  const params = useParams();

  const searchParams = routeHelper.createParamsFromSearchRoute(params['*']);


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
      <a onClick={menuButtonClick} data-value="one_accession_row" className={searchParams.recordtype == 'one_accession_row' ? 'selected' : ''}>{l('Arkivmaterial')}</a>
      <a onClick={menuButtonClick} data-value="one_record" className={searchParams.recordtype == 'one_record' ? 'selected' : ''}>{l('Skriva av')}</a>
      <span className="switcher-help-button" onClick={openSwitcherHelptext} title="Om accessioner och uppteckningar">?</span>
    </div>
  );
}

export default FilterSwitch;
