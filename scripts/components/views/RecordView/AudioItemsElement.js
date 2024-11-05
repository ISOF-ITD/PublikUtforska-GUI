import PropTypes from 'prop-types';
import { getAudioTitle } from '../../../utils/helpers';
import ListPlayButton from '../ListPlayButton';

export default function AudioItems({ data }) {
  const {
    id,
    media,
    title,
    contents,
    archive: {
      arhive_org: archiveOrg,
      archive,
    },
    year,
    persons,
  } = data;
  const audioDataItems = media.filter((dataItem) => dataItem.type === 'audio');
  const audioItems = audioDataItems.map((mediaItem) => (
    <tr key={mediaItem.source}>
      <td data-title="Lyssna:" width="50px">
        <ListPlayButton
          media={mediaItem}
          recordId={id}
          recordTitle={getAudioTitle(
            title,
            contents,
            archiveOrg,
            archive,
            mediaItem.source,
            year,
            persons,
          )}
        />
      </td>
      <td>
        {getAudioTitle(
          title,
          contents,
          archiveOrg,
          archive,
          mediaItem.source,
          year,
          persons,
        )}
      </td>
    </tr>
  ));
  return (
    <div className="row">
      <div className="twelve columns">
        <div className="table-wrapper">
          <table width="100%">
            <tbody>
              {audioItems}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

AudioItems.propTypes = {
  data: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    media: PropTypes.arrayOf(
      PropTypes.shape({
        type: PropTypes.string.isRequired,
        source: PropTypes.string.isRequired,
      }),
    ).isRequired,
    title: PropTypes.string,
    contents: PropTypes.string,
    archive: PropTypes.shape({
      arhive_org: PropTypes.string,
      archive: PropTypes.string,
    }),
    year: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    persons: PropTypes.arrayOf(PropTypes.object),
  }).isRequired,
};
