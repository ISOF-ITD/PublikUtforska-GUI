import PropTypes from 'prop-types';
import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronRight, faChevronLeft, faPen } from '@fortawesome/free-solid-svg-icons';
import SearchBox from './SearchBox';
import FilterSwitch from './FilterSwitch';
import ShortStatistics from './ShortStatistics';
import StatisticsList from './StatisticsList';
import config from '../config';
import Folkelogga from '../../img/folke-white.svg';
import TranscribeButton from './views/transcribe/TranscribeButton';
import RecordList from './views/RecordList';
import { l } from '../lang/Lang';

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
    fetch('varning.html')
      .then((response) => {
        if (response.ok) {
          return response.text();
        } else {
          throw new Error('Filen varning.html hittades inte.');
        }
      })
      .then((htmlContent) => {
        setWarningMessage(htmlContent);
      })
      .catch((error) => {
        console.error('Ett fel inträffade:', error);
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
  mode, params, recordsData, audioRecordsData, pictureRecordsData, loading,
}) {
  MapMenu.propTypes = {
    mode: PropTypes.string,
    params: PropTypes.object.isRequired,
    recordsData: PropTypes.object,
    audioRecordsData: PropTypes.object,
    pictureRecordsData: PropTypes.object,
    loading: PropTypes.bool.isRequired,
  };

  MapMenu.defaultProps = {
    mode: 'material',
    recordsData: { data: [], metadata: {} },
    audioRecordsData: { data: [], metadata: {} },
    pictureRecordsData: { data: [], metadata: {} },
  };

  const isMobile = window.innerWidth < 700;
  const [menuExpanded, setMenuExpanded] = useState(!isMobile);
  const [currentMonth, setCurrentMonth] = useState('');
  const visible = true;

  const paramsLatest = {
    size: 10,
    recordtype: 'one_record',
    transcriptionstatus: 'published',
    sort: 'changedate', // 'transcriptiondate', // 'approvedate',
    order: 'desc',
  };

  useEffect(() => {
    // fetch "current_month" from server.
    // the path is the api address plus "current_time", and the result is a json object with a
    // "data" property that contains the current date and time as milliseconds since 1970-01-01
    // the variable current_month's value is the month's name in Swedish for that timestamp
    // only fetch once, when the component is mounted
    fetch(`${config.apiUrl}current_time`)
      .then((response) => response.json())
      .then((data) => {
        setCurrentMonth(new Date(data.data).toLocaleString('sv-SE', { month: 'long' }));
      });
  }, []);

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
          className="dummy popup-open-button visible ignore-expand-menu"
          label={(
            <>
              <FontAwesomeIcon icon={faPen} />
              {' '}
              {l('Skriv av slumpmässig uppteckning')}
            </>
          )}
          random
        />
      </div>
      <div className="mapmenu-trigger-button">
        <a onClick={() => setMenuExpanded(!menuExpanded)}>
          <FontAwesomeIcon icon={menuExpanded ? faChevronLeft : faChevronRight} />
        </a>
      </div>
      <div className="puffar">
        <div className="statistics puff">
          {/* Show how many records that have been transcribed the last month */}
          {/* Antal avskrivna uppteckningar den här månaden */}
          <ShortStatistics
            params={{
              recordtype: 'one_record',
              transcriptionstatus: 'published',
              // +2h to account for the time difference between
              // the server and the timestamps in the database
              // "now/M" is the start of the current month
              range: 'transcriptiondate,now/M,now+2h',
            }}
            label={`avskrivna uppteckningar i ${currentMonth}`}
            visible={visible}
          />
          {/* Antal avskrivna uppteckningar totalt  */}
          <ShortStatistics
            params={{
              recordtype: 'one_record',
              transcriptionstatus: 'published',
            }}
            label="avskrivna uppteckningar totalt"
            visible={visible}
          />

          {/* Show how many pages that have been transcribed the last month */}
          {/* Antal avskrivna sidor den här månaden */}
          <ShortStatistics
            params={{
              recordtype: 'one_record',
              transcriptionstatus: 'published',
              // +2h to account for the time difference between
              // the server and the timestamps in the database
              // urlencode the range parameter. range = 'transcriptiondate,now-1M,now+2h'
              // "now/M" is the start of the current month
              range: 'transcriptiondate,now/M,now+2h',
              aggregation: 'sum,archive.total_pages',
            }}
            label={`avskrivna sidor i ${currentMonth}`}
            visible={visible}
          />

          {/* Antal avskrivna sidor totalt  */}
          <ShortStatistics
            params={{
              recordtype: 'one_record',
              transcriptionstatus: 'published',
              aggregation: 'sum,archive.total_pages',
            }}
            label="avskrivna sidor totalt"
            visible={visible}
          />

          {/* Show how many different users have transcribed in the last month */}
          {/* Antal personer som skrivit av dne här kalendermånaden */}
          <ShortStatistics
            params={{
              recordtype: 'one_record',
              transcriptionstatus: 'published',
              // +2h to account for the time difference between
              // the server and the timestamps in the database
              // "now/M" is the start of the current month
              range: 'transcriptiondate,now/M,now+2h',
              aggregation: 'cardinality,transcribedby.keyword',
            }}
            label={`användare som har skrivit av uppteckningar i ${currentMonth}`}
            visible={visible}
          />

          {/* Antal personer som skrivit av totalt */}
          <ShortStatistics
            params={{
              recordtype: 'one_record',
              transcriptionstatus: 'published',
              aggregation: 'cardinality,transcribedby.keyword',
            }}
            label="användare som har skrivit av uppteckningar totalt"
            visible={visible}
          />

          {/* Show the top ten transcribers for the current month */}
          <StatisticsList
            params={{
              recordtype: 'one_record',
              transcriptionstatus: 'published',
              range: 'transcriptiondate,now/M,now+2h',
            }}
            type="topTranscribersByPages"
            label={`Topplista transkriberare i ${currentMonth}`}
            visible={visible}
          />

          {/* Show the top ten transcribers */}
          <StatisticsList
            params={{
              recordtype: 'one_record',
              transcriptionstatus: 'published',
            }}
            type="topTranscribersByPages"
            label="Topplista transkriberare totalt"
            visible={visible}
          />

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
              sizeMore={50}
                // interval is 60 sec, if visible is true and the web browser is in focus
              interval={visible ? 60000 : null}
              hasFilter={false}
              smallTitle
            />
          </div>
        </div>

        {/* <div className="puff news">
          <h4>Nyheter och information</h4>
          <p>
            Hur används Isofs digitala arkivtjänst Folke?
            Ordmolnet visar det senaste årets vanligaste sökningar.
            På Folke finns delar av Isofs äldre folkminnessamlingar
            tillgängliga för att läsa, ladda ned eller hjälpa till
            att skriva av. Du hittar Folke här:&nbsp;
            <a href="https://sok.folke.isof.se/">
              https://sok.folke.isof.se/
            </a>
          </p>
          <img src="https://i.ibb.co/0Z0Nwxs/M44mm8W.jpg" border="0" alt="" style={{ width: 250 }} />
        </div> */}
      </div>
    </div>
  );
}
