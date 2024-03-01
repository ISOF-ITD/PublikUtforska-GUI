import { useContext } from 'react';
import PropTypes from 'prop-types';
import { AudioContext } from '../../contexts/AudioContext';

function ListPlayButton({
  recordId, media, recordTitle,
}) {
  ListPlayButton.propTypes = {
    recordId: PropTypes.string.isRequired,
    media: PropTypes.object.isRequired,
    recordTitle: PropTypes.string.isRequired,
  };

  const {
    playAudio,
    togglePlay,
    currentAudio,
    playing,
  } = useContext(AudioContext);

  const isCurrentRecordActive = () => (
    currentAudio
    && currentAudio.record.id === recordId
    && currentAudio.audio.source === media.source
  );
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

export default ListPlayButton;
