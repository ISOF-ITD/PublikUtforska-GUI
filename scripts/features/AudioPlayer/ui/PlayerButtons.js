import {
  faRotateRight,
  faRotateLeft,
  faPlay,
  faPause,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import PropTypes from 'prop-types';
import { useCallback, useRef } from 'react';
import SpeedSelector from './SpeedSelector';

const JUMP_SEC = 15;

const BTN = `relative flex items-center justify-center rounded-full
   active:scale-95 transition-all duration-150 ease-out
   focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-player-focus
   focus-visible:ring-offset-2 focus-visible:ring-offset-player-bg
   h-14 w-14 sm:h-12 sm:w-12 hover:cursor-pointer
   [&>svg]:hover:scale-110 [&>svg]:transition-transform`;
const SECONDARY = `flex-col gap-1 border-0 bg-transparent text-player-text hover:bg-player-control-hover
   [&>svg]:h-5 [&>svg]:w-5`;

export default function PlayerButtons({ audioRef, playing, togglePlay }) {
  const backwardBtn = useRef(null);
  const forwardBtn = useRef(null);

  const bump = (btn) => {
    if (!btn) return;
    btn.classList.remove('animate-zoom');
    btn.getBoundingClientRect();
    btn.classList.add('animate-zoom');
    if (navigator.vibrate) navigator.vibrate(10);
  };

  const seekRelative = useCallback(
    (sec) => {
      const a = audioRef.current;
      if (!a) return;
      a.currentTime = Math.min(Math.max(0, a.currentTime + sec), a.duration);
      bump(sec < 0 ? backwardBtn.current : forwardBtn.current);
    },
    [audioRef],
  );

  return (
    <div className="flex items-center gap-3 sm:gap-4">
      <button
        type="button"
        ref={backwardBtn}
        aria-label={`Spola −${JUMP_SEC} sek`}
        onClick={() => seekRelative(-JUMP_SEC)}
        className={`${BTN} ${SECONDARY}`}
      >
        <FontAwesomeIcon icon={faRotateLeft} />
        <span aria-hidden="true" className="text-xs font-semibold leading-none tabular-nums">{JUMP_SEC}</span>
      </button>

      <button
        type="button"
        aria-label={playing ? 'Pausa' : 'Spela'}
        aria-pressed={playing}
        onClick={togglePlay}
        className={`${BTN} border border-solid shadow-sm hover:shadow-md bg-player-accent text-player-bg border-player-accent hover:bg-player-text hover:border-player-text`}
      >
        <FontAwesomeIcon icon={playing ? faPause : faPlay} />
      </button>

      <button
        type="button"
        ref={forwardBtn}
        aria-label={`Spola +${JUMP_SEC} sek`}
        onClick={() => seekRelative(JUMP_SEC)}
        className={`${BTN} ${SECONDARY}`}
      >
        <FontAwesomeIcon icon={faRotateRight} />
        <span aria-hidden="true" className="text-xs font-semibold leading-none tabular-nums">{JUMP_SEC}</span>
      </button>

      {/* hide speed picker where width < 430 px */}
      <div className="hidden pb-[15px] min-[430px]:block">
        <SpeedSelector audioRef={audioRef} />
      </div>
    </div>
  );
}

PlayerButtons.propTypes = {
  audioRef: PropTypes.object.isRequired,
  playing: PropTypes.bool.isRequired,
  togglePlay: PropTypes.func.isRequired,
};
