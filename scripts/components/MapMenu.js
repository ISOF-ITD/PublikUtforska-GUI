/* eslint-disable react/require-default-props */
import PropTypes from 'prop-types';
import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronRight, faChevronLeft, faPen } from '@fortawesome/free-solid-svg-icons';
import SearchBox from './SearchBox';
import FilterSwitch from './FilterSwitch';
import StatisticsContainer from './StatisticsContainer';
import Folkelogga from '../../img/folke-white.svg';
import TranscribeButton from './views/transcribe/TranscribeButton';
import RecordList from './views/RecordList';
import { l } from '../lang/Lang';
import config from '../config';

// bara tillfälligt, för att visa en länk till enkäten
function SurveyLink() {
  const handleAction = () => {
    window.open('https://www.isof.se/enkat-folke', '_blank');
  };

  const handleKeyDown = (event) => {
    // Aktivera länken när användaren trycker på Enter eller mellanslag
    if (event.key === 'Enter' || event.key === ' ') {
      handleAction();
    }
  };

  return (
    <div
      style={{
        backgroundColor: '#3ed494',
        padding: '1.2rem 1rem 1.1rem',
        textAlign: 'center',
        borderRadius: '13px',
        marginBottom: '10px',
        cursor: 'pointer',
        textDecoration: 'underline',
      }}
      onClick={handleAction}
      onKeyDown={handleKeyDown}
      role="button" // Lägger till rollen "button"
      tabIndex="0" // Gör elementet fokuserbart
      aria-label="Användarenkät Folke 2023" // Lägger till en tillgänglig etikett
    >
      Användarenkät Folke 2023
    </div>
  );
}

function Warning() {
  const [warningMessage, setWarningMessage] = useState('');

  useEffect(() => {
    // Hämta innehållet från varning.html och sätt det som varningMessage
    fetch('/varning.html')
      .then((response) => {
        if (response.ok) {
          return response.text();
        }
        return null;
      })
      .then((htmlContent) => {
        setWarningMessage(htmlContent);
      });
  }, []);

  if (!warningMessage) {
    // Om det inte finns något varningsmeddelande, rendera ingenting
    return null;
  }

  return (
    <div
      aria-label="Varning"
      style={{
        backgroundColor: '#ffc107',
        padding: '1.2rem 1rem 1.1rem',
        textAlign: 'center',
        borderRadius: '13px',
        marginBottom: '10px',
      }}
      dangerouslySetInnerHTML={{ __html: warningMessage }} // Sätter HTML-innehållet
    />
  );
}

export default function MapMenu({
  mode = 'material',
  params,
  recordsData = { data: [], metadata: {} },
  audioRecordsData = { data: [], metadata: {} },
  pictureRecordsData = { data: [], metadata: {} },
  loading,
}) {
  const isMobile = window.innerWidth < 700;
  const [menuExpanded, setMenuExpanded] = useState(!isMobile);

  const paramsLatest = {
    size: 20,
    recordtype: 'one_record',
    transcriptionstatus: 'published',
    sort: 'changedate', // 'transcriptiondate', // 'approvedate',
    order: 'desc',
  };

  return (
    <div className={`menu-wrapper ${menuExpanded ? 'menu-expanded' : 'menu-collapsed'}`}>
      {/* <SurveyLink /> */}
      <Warning />
      <img src={Folkelogga} alt="Folkelogga" style={{ height: 80, width: '100%' }} />
      <FilterSwitch
        mode={mode}
      />
      <SearchBox
        params={params}
        mode={mode}
        recordsData={recordsData}
        audioRecordsData={audioRecordsData}
        pictureRecordsData={pictureRecordsData}
        loading={loading}
      />

      <div className="popup-wrapper">

        <TranscribeButton
          className="popup-open-button visible ignore-expand-menu"
          label={(
            <>
              <FontAwesomeIcon icon={faPen} />
              {' '}
              {l('Skriv av slumpmässig uppteckning')}
              {config.specialEventTranscriptionCategoryLabel && <br />}
              {config.specialEventTranscriptionCategoryLabel || ''}
            </>
          )}
          random
        />
      </div>
      <div className="mapmenu-trigger-button">
        <button onClick={() => setMenuExpanded(!menuExpanded)} type="button">
          <FontAwesomeIcon icon={menuExpanded ? faChevronLeft : faChevronRight} />
        </button>
      </div>
      <div className="puffar">
        <div className="statistics puff">
          <StatisticsContainer />

          <h3>Senast avskrivna uppteckningar</h3>
          <div className="statistics-table">
            <RecordList
              key="latest-RecordList"
              disableRouterPagination
              params={paramsLatest}
              disableListPagination
              columns={['title', 'year', 'place', 'transcribedby']}
              tableClass="table-compressed"
                // möjliggör att visa 50 poster efter en klick på "visa fler"
              // sizeMore={50}
                // interval is 60 sec, if visible is true and the web browser is in focus
              interval={60000}
              hasFilter={false}
              smallTitle
            />
          </div>
        </div>
      </div>
    </div>
  );

}

MapMenu.propTypes = {
  mode: PropTypes.string,
  params: PropTypes.object.isRequired,
  recordsData: PropTypes.object,
  audioRecordsData: PropTypes.object,
  pictureRecordsData: PropTypes.object,
  loading: PropTypes.bool.isRequired,
};
