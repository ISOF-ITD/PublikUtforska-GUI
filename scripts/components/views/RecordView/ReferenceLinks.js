import PropTypes from 'prop-types';
import ShareButtons from './ShareButtons';
import config from '../../../config';
import { l } from '../../../lang/Lang';
import { makeArchiveIdHumanReadable, getPages, getArchiveName } from '../../../utils/helpers';

export default function ReferenceLinks({ data }) {
  const {
    id,
    archive: {
      archive_id: archiveId,
      archive_org: archiveOrg,
    },
  } = data;
  return (
    <div className="row">
      <div className="six columns">
        <ShareButtons path={`${config.siteUrl}#/records/${id}`} title={l('Kopiera länk')} />
      </div>

      <div className="six columns">
        {/* copies the citation to the clipboard */}
        <ShareButtons
          path={(
                `${makeArchiveIdHumanReadable(archiveId, archiveOrg)}, ${getPages(data) ? `s. ${getPages(data)}, ` : ''}${getArchiveName(archiveOrg)}`
              )}
          title={l('Källhänvisning')}
        />
      </div>
    </div>
  );
}

ReferenceLinks.propTypes = {
  data: PropTypes.shape({
    id: PropTypes.string.isRequired,
    archive: PropTypes.shape({
      archive_id: PropTypes.string.isRequired,
      archive_org: PropTypes.string.isRequired,
    }).isRequired,
  }).isRequired,
};
