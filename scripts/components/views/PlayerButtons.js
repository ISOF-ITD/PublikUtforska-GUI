import {
  faRotateRight, faRotateLeft, faPlay, faPause,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import PropTypes from 'prop-types';
import SpeedSelector from './SpeedSelector';

function PlayerButtons({ audioRef, playing, togglePlay }) {
  // add the class zooming to the button and remove it after 1 second
  const zoomIcon = (selector) => {
    const icon = document.querySelector(selector);
    icon.classList.remove('zooming');
    icon.classList.add('zooming');
    setTimeout(() => {
      icon.classList.remove('zooming');
    }, 1000);
  };

  return (
    <div className="buttons-container">
      {/* Knapp för att spola tillbaka 15 sek */}
      <button
        className="backward-button"
        onClick={() => {
          const audio = audioRef.current;
          audio.currentTime -= 15;
          zoomIcon('.backward-button');
        }}
        aria-label="Spola tillbaka 15 sekunder"
        type="button"
      >
        <FontAwesomeIcon icon={faRotateLeft} />
        <span>
          15
        </span>
      </button>

      <button
        className={`play-button${playing ? ' playing' : ''}`}
        onClick={togglePlay}
        aria-label="Spela"
        type="button"
      >
        <FontAwesomeIcon icon={playing ? faPause : faPlay} />
      </button>

      {/* Knapp för att spola framåt 15 sek */}
      <button
        className="forward-button"
        onClick={() => {
          const audio = audioRef.current;
          audio.currentTime += 15;
          zoomIcon('.forward-button');
        }}
        aria-label="Spola framåt 15 sekunder"
        type="button"
      >
        <FontAwesomeIcon icon={faRotateRight} />
        <span>
          15
        </span>
      </button>

      <SpeedSelector audioRef={audioRef} />

    </div>
  );
}

PlayerButtons.propTypes = {
  audioRef: PropTypes.object.isRequired,
  playing: PropTypes.bool.isRequired,
  togglePlay: PropTypes.func.isRequired,
};

export default PlayerButtons;
