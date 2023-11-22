import { useState, useEffect, useCallback } from 'react';

import PropTypes from 'prop-types';

function ListPlayButton({
  recordId, media, recordTitle, disablePlayback,
}) {
  ListPlayButton.propTypes = {
    recordId: PropTypes.string.isRequired,
    media: PropTypes.object.isRequired,
    recordTitle: PropTypes.string.isRequired,
    disablePlayback: PropTypes.bool,
  };

  ListPlayButton.defaultProps = {
    disablePlayback: false,
  };
  const [isPlaying, setIsPlaying] = useState(false);

  const checkIsPlaying = useCallback(() => (
    window.isofAudioPlayer
    && window.isofAudioPlayer.currentAudio
    && window.isofAudioPlayer.currentAudio.record === recordId
    && window.isofAudioPlayer.currentAudio.media === media.source
    && window.isofAudioPlayer.currentAudio.playing
  ), [recordId, media]);

  const audioPlayerPlayHandler = useCallback(() => {
    setIsPlaying(checkIsPlaying());
  }, [checkIsPlaying]);

  const audioPlayerStopHandler = useCallback(() => {
    setIsPlaying(checkIsPlaying());
  }, [checkIsPlaying]);

  useEffect(() => {
    if (window.eventBus) {
      window.eventBus.addEventListener('audio.play', audioPlayerPlayHandler);
      window.eventBus.addEventListener('audio.stop', audioPlayerStopHandler);
    }

    if (checkIsPlaying()) {
      setIsPlaying(true);
    }

    return () => {
      if (window.eventBus) {
        window.eventBus.removeEventListener('audio.play', audioPlayerPlayHandler);
        window.eventBus.removeEventListener('audio.stop', audioPlayerStopHandler);
      }
    };
  }, [audioPlayerPlayHandler, audioPlayerStopHandler, checkIsPlaying]);

  const playButtonClickHandler = (event) => {
    if (disablePlayback) {
      event.preventDefault();
    } else {
      event.stopPropagation();
      event.preventDefault();

      if (window.eventBus) {
        // send audioplayer.visible event
        window.eventBus.dispatch('audio.playervisible');
        if (checkIsPlaying()) {
          window.eventBus.dispatch('audio.pauseaudio');
        } else {
          window.eventBus.dispatch('audio.playaudio', {
            record: {
              id: recordId,
              title: recordTitle,
            },
            audio: media,
          });
        }
      }
    }
  };

  return (
    <button
      alt="Spela"
      className={`play-button${isPlaying ? ' playing' : ''}`}
      onClick={playButtonClickHandler}
      type="button"
    />
  );
}

export default ListPlayButton;
