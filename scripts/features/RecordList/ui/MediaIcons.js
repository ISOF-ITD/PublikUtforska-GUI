import PropTypes from 'prop-types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faFilePdf,
} from '@fortawesome/free-solid-svg-icons';
import { pickPrimaryMediaType } from '../../../utils/mediaTypes';
import AudioWaveIcon from './AudioWaveIcon';

/**
 * Renders a single media icon with priority:
 * audio > image > pdf
 */
export default function MediaIcons({ media }) {
  const type = pickPrimaryMediaType(media);
  if (!type) return null;

  if (type === 'audio') {
    return (
      <AudioWaveIcon className="mx-1 inline-block h-4 w-6 text-link align-middle" />
    );
  }

  if (type === 'pdf') {
    return (
      <FontAwesomeIcon
        icon={faFilePdf}
        title="PDF"
        className="mx-1 text-danger align-middle"
        aria-hidden="true"
      />
    );
  }

  return null;
}

MediaIcons.propTypes = {
  media: PropTypes.arrayOf(
    PropTypes.shape({
      source: PropTypes.string,
      type: PropTypes.string,
    }),
  ),
};
