import PropTypes from 'prop-types';
import { makeArchiveIdHumanReadable } from '../../../utils/helpers';
import archiveLogoIsof from '../../../../img/archive-logo-isof.png';
import archiveLogoIkos from '../../../../img/archive-logo-ikos.png';
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
      archive_id: archiveId,
    },
  } = data;

  return (
    <div className="row">
      <div className="four columns">
        <p>
        <img
          src={getArchiveLogo(archive)}
        //   style={{ width: '100%' }}
          alt={makeArchiveIdHumanReadable(archiveId)}
        />
        </p>
      </div>
    </div>
  );
}
RecordViewFooter.propTypes = {
  data: PropTypes.shape({
    archive: PropTypes.shape({
      archive: PropTypes.string, // Typ för `archive`, som är en sträng
      archive_id: PropTypes.string, // Typ för `archive_id`, som också är en sträng
    }).isRequired, // Kräver att `archive`-objektet finns
  }).isRequired, // Kräver att `data`-objektet finns
};
