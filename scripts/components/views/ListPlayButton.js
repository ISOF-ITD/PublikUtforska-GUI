import { useContext } from 'react';
import PropTypes from 'prop-types';
import { AudioContext } from '../../contexts/AudioContext';

function ListPlayButton({
  recordId,
  media,
  recordTitle,
  startTime = 0, // default start time
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

  return (
    <button
      alt="Spela"
      className={`play-button${isCurrentRecordActive() && playing ? ' playing' : ''}`}
      onClick={playButtonClickHandler}
      type="button"
    />
  );
}

ListPlayButton.propTypes = {
  recordId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  media: PropTypes.object.isRequired,
  recordTitle: PropTypes.string.isRequired,
  startTime: PropTypes.number,
};

export default ListPlayButton;
