import {
  faRotateRight,
  faRotateLeft,
  faPlay,
  faPause,
  faBackwardStep,
  faForwardStep,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import PropTypes from 'prop-types';
import { useCallback, useRef } from 'react';

const JUMP_SEC = 15;

const BTN = `relative m-0 flex shrink-0 items-center justify-center rounded-full
   active:scale-95 transition-all duration-150 ease-out
   focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-player-focus
   focus-visible:ring-offset-2 focus-visible:ring-offset-player-bg
   h-14 w-14 sm:h-12 sm:w-12 hover:cursor-pointer
   [&>svg]:hover:scale-110 [&>svg]:transition-transform`;
const SECONDARY = `flex-col gap-1 border-0 bg-transparent text-player-text hover:bg-player-control-hover
   [&>svg]:h-5 [&>svg]:w-5`;

export default function PlayerButtons({
  audioRef, playing, togglePlay, queue = [], currentIndex = -1, playPrevious, playNext,
}) {
  const backwardBtn = useRef(null);
  const forwardBtn = useRef(null);
  const previous = queue[currentIndex - 1];
  const next = queue[currentIndex + 1];
  const previousLabel = previous ? `Föregående inspelning: ${previous.title}` : 'Föregående inspelning';
  const nextLabel = next ? `Nästa inspelning: ${next.title}` : 'Nästa inspelning';
  const fileButton = `${BTN} ${SECONDARY} !h-11 !w-11 aria-disabled:opacity-50 aria-disabled:cursor-default aria-disabled:hover:bg-transparent`;

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
    <div className="flex max-w-full flex-wrap items-center justify-center gap-2 md:gap-3 md:col-start-1 md:row-start-1">
      {queue.length > 1 && (
        <button type="button" aria-label={previousLabel} title={previousLabel} aria-disabled={!previous} onClick={() => { if (previous) playPrevious(); }} className={fileButton}>
          <FontAwesomeIcon icon={faBackwardStep} />
        </button>
      )}
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

      {queue.length > 1 && (
        <button type="button" aria-label={nextLabel} title={nextLabel} aria-disabled={!next} onClick={() => { if (next) playNext(); }} className={fileButton}>
          <FontAwesomeIcon icon={faForwardStep} />
        </button>
      )}

    </div>
  );
}

PlayerButtons.propTypes = {
  audioRef: PropTypes.object.isRequired,
  playing: PropTypes.bool.isRequired,
  togglePlay: PropTypes.func.isRequired,
  queue: PropTypes.arrayOf(PropTypes.shape({ title: PropTypes.string.isRequired })),
  currentIndex: PropTypes.number,
  playPrevious: PropTypes.func,
  playNext: PropTypes.func,
};
