import PropTypes from 'prop-types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDownload } from '@fortawesome/free-solid-svg-icons';
import config from '../../../config';
import { getAudioTitle } from '../../../utils/helpers';
import ListPlayButton from '../ListPlayButton';

function AudioItems({ data }) {
  const {
    id,
    media,
    contents,
    archive: { arhive_org: archiveOrg, archive },
    year,
    persons,
  } = data;

  // Filter out only audio items
  const audioDataItems = media.filter((item) => item.type === 'audio');

  // Create table rows for each audio item
  const audioItems = audioDataItems.map((item) => {
    const audioTitle = getAudioTitle(
      item.title,
      contents,
      archiveOrg,
      archive,
      item.source,
      year,
      persons
    );

    return (
      <tr
        key={item.source}
        // Use alternating row colors + a bottom border on each row
        className="odd:bg-gray-50 even:bg-white border-b last:border-b-0 border-gray-200"
      >
        <td className="py-2 px-4">
          <span>
          <ListPlayButton
            media={item}
            recordId={id}
            recordTitle={audioTitle}
          />
          </span>
        </td>
        <td className="py-2 px-4">
          {audioTitle}
        </td>
        <td className="py-2 px-4">
          <a
            href={`${config.audioUrl}${item.source}`}
            download
            title="Ladda ner ljudfilen"
            className="text-isof hover:underline"
          >
            <FontAwesomeIcon icon={faDownload} />
          </a>
        </td>
      </tr>
    );
  });

  return (
    <div className="container mx-auto px-4 border-none">
      <div className="overflow-x-auto mb-10 rounded">
        <table className="w-full table-auto border-collapse text-sm">
          <tbody>
            {audioItems}
          </tbody>
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
        title: PropTypes.string,
      })
    ).isRequired,
    contents: PropTypes.string,
    archive: PropTypes.shape({
      arhive_org: PropTypes.string,
      archive: PropTypes.string,
    }),
    year: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    persons: PropTypes.arrayOf(PropTypes.object),
  }).isRequired,
};

export default AudioItems;
