import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import archiveLogoIsof from '../../../../img/archive-logo-isof.png';
import archiveLogoIkos from '../../../../img/archive-logo-ikos.png';
import logotypNationellaSprakbanken from '../../../../img/logotyp_nationella_sprakbanken.svg';
import config from '../../../config';

const getArchiveLogo = (archive) => {
  const archiveLogos = {};

  archiveLogos['Dialekt-, namn- och folkminnesarkivet i Göteborg'] = archiveLogoIsof;
  archiveLogos['Dialekt- och folkminnesarkivet i Uppsala'] = archiveLogoIsof;
  archiveLogos['Dialekt och folkminnesarkivet i Uppsala'] = archiveLogoIsof;
  archiveLogos.DAG = 'img/archive-logo-isof.png';
  // Needs to be shrinked. By css?
  // archiveLogos['Norsk folkeminnesamling'] = 'img/UiO_Segl_A.png';
  archiveLogos['Norsk folkeminnesamling'] = archiveLogoIkos;
  archiveLogos.NFS = archiveLogoIkos;
  archiveLogos.DFU = archiveLogoIkos;
  // archiveLogos['SLS'] = SlsLogga;
  // archiveLogos['Svenska litteratursällskapet i Finland (SLS)'] = SlsLogga;

  return (
    archiveLogos[archive]
      ? config.appUrl + archiveLogos[archive]
      : config.appUrl + archiveLogos.DAG
  );
};

export default function RecordViewFooter({ data }) {
  const {
    archive: {
      archive = '',
    },
  } = data;

  return (
    <div className="row">
      <div
        className="twelve columns"
        style={{
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <Link to="https://isof.se" target="_blank" rel="noopener noreferrer">
          <img
            src={getArchiveLogo(archive)}
            width="150"
            height="auto"
            alt="Logga för arkiv"
          />
        </Link>
        <Link to="https://sprakbanken.se/" target="_blank" rel="noopener noreferrer">
          <img
            src={logotypNationellaSprakbanken}
            height="auto"
            width="150"
            alt="Logga för Nationella språkbanken"
          />
        </Link>
      </div>
    </div>
  );
}
RecordViewFooter.propTypes = {
  data: PropTypes.shape({
    archive: PropTypes.shape({
      archive: PropTypes.string, // Typ för `archive`, som är en sträng
    }).isRequired, // Kräver att `archive`-objektet finns
  }).isRequired, // Kräver att `data`-objektet finns
};
