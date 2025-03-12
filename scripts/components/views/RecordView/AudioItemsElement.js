import PropTypes from 'prop-types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDownload } from '@fortawesome/free-solid-svg-icons';
import config from '../../../config';
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

  // Filter only the audio items
  const audioDataItems = media.filter((item) => item.type === 'audio');

  // Map over audio items and build table rows
  const audioItems = audioDataItems.map((mediaItem) => {
    const recordTitle = getAudioTitle(
      mediaItem.title,
      contents,
      archiveOrg,
      archive,
      mediaItem.source,
      year,
      persons,
    );

    return (
      <tr
        key={mediaItem.source}
        className="odd:bg-gray-50 even:bg-white border-b last:border-b-0 border-gray-200"
      >
        <td className="py-2 px-4 w-[50px]" data-title="Lyssna:">
          <ListPlayButton
            media={mediaItem}
            recordId={id}
            recordTitle={recordTitle}
          />
        </td>
        <td className="py-2 px-4">
          {recordTitle}
        </td>
        <td className="py-2 px-4">
          <a
            href={`${config.audioUrl}${mediaItem.source}`}
            download
            title="Ladda ner ljudfilen"
            className="text-isof hover:text-darker-isof"
          >
            <FontAwesomeIcon icon={faDownload} />
          </a>
        </td>
      </tr>
    );
  });

  return (
    <div className="mx-auto border-none">
      <div className="overflow-x-auto mb-4 rounded">
        <table className="w-full table-auto border-collapse lg:text-base text-sm">
          <tbody>{audioItems}</tbody>
        </table>
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
