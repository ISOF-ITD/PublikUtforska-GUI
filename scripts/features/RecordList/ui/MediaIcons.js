import PropTypes from 'prop-types';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faFileLines,
  faVolumeHigh,
  faFilePdf,
} from '@fortawesome/free-solid-svg-icons';
import { pickPrimaryMediaType } from '../../../utils/mediaTypes';

/**
 * Renders a single media icon with priority:
 * audio > image > pdf
 */
export default function MediaIcons({ media }) {
  const type = pickPrimaryMediaType(media);
  if (!type) return null;

  if (type === "audio") {
    return (
      <FontAwesomeIcon
        icon={faVolumeHigh}
        title="Inspelning"
        className="mx-1 text-isof align-middle"
        aria-hidden="true"
      />
    );
  }

  if (type === "image") {
    return (
      <FontAwesomeIcon
        icon={faFileLines}
        title="Uppteckning"
        className="mx-1 text-isof align-middle"
        aria-hidden="true"
      />
    );
  }

  if (type === "pdf") {
    return (
      <FontAwesomeIcon
        icon={faFilePdf}
        title="PDF"
        className="mx-1 text-red-500 align-middle"
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
