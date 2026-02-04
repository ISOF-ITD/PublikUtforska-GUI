import { useContext } from 'react';
import PropTypes from 'prop-types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCirclePlay,
  faCirclePause,
  faPlay,
  faPause,
} from '@fortawesome/free-solid-svg-icons';
import { AudioContext } from '../../contexts/AudioContext';

function ListPlayButton({
  recordId,
  media,
  recordTitle,
  startTime = 0,
  isSubList = false,
}) {
  const {
    playAudio,
    togglePlay,
    currentAudio,
    playing,
  } = useContext(AudioContext);

  // Check if this audio item is the one currently playing
  const isCurrentRecordActive = () =>
    currentAudio &&
    currentAudio.record.id === recordId &&
    currentAudio.audio.source === media.source &&
    currentAudio.time === startTime;

  const playButtonClickHandler = () => {
    if (isCurrentRecordActive()) {
      togglePlay();
    } else {
      playAudio({
        record: {
          id: recordId,
          title: recordTitle,
        },
        audio: media,
        time: startTime,
      });
    }
  };

  // Figure out which icons to show
  const isActiveAndPlaying = isCurrentRecordActive() && playing;
  const playIcon = isSubList ? faPlay : faCirclePlay;
  const pauseIcon = isSubList ? faPause : faCirclePause;
  
  // Decide which icon to show
  const iconToShow = isActiveAndPlaying ? pauseIcon : playIcon;

  // Smaller button for sub-list, default for main.
  const sizeClasses = isSubList ? 'w-3 h-3 text-darker-isof' : 'text-isof w-6 h-6';

  return (
    <button type="button" onClick={playButtonClickHandler}
      className="hover:cursor-pointer"
    >
      <FontAwesomeIcon icon={iconToShow} className={sizeClasses} />
    </button>
  );
}

ListPlayButton.propTypes = {
  recordId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  media: PropTypes.object.isRequired,
  recordTitle: PropTypes.string.isRequired,
  startTime: PropTypes.number,
  isSubList: PropTypes.bool,
};

export default ListPlayButton;
