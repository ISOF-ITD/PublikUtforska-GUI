import classNames from 'classnames';
import {
  useContext, useId, useRef, useState,
} from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faChevronUp, faClose, faPause, faPlay,
} from '@fortawesome/free-solid-svg-icons';
import { AudioContext } from '../../contexts/AudioContext';
import PlayerButtons from './ui/PlayerButtons';
import Timeline from './ui/Timeline';
import msToTime from './msToTime';

import useViewportWidth from './hooks/useViewportWidth';
import useMarquee from './hooks/useMarquee';
import useSwipeSeek from './hooks/useSwipeSeek';

export default function GlobalAudioPlayer() {
  const {
    playing,
    audioRef,
    setPlaying,
    togglePlay,
    currentTime,
    setCurrentTime,
    durationTime,
    setVisible,
    setCurrentAudio,
    currentAudio,
    activeSegmentId,
    playerLabelText,
    visible,
  } = useContext(AudioContext);

  /* ——  viewport & marquee  —— */
  const vw = useViewportWidth(); // Triggers marquee recalculation
  const [minimized, setMinimized] = useState(false);
  const isCompact = minimized && vw < 640;
  const controlsId = useId();
  const gesture = useRef(null);
  const suppressClick = useRef(false);
  const [labelRef, textRef] = useMarquee([playerLabelText, vw, isCompact]);

  const handlePointerDown = (event) => {
    if (event.button !== 0 || event.isPrimary === false) return;
    suppressClick.current = false;
    gesture.current = { x: event.clientX, y: event.clientY, id: event.pointerId };
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };

  const handlePointerUp = (event) => {
    const start = gesture.current;
    gesture.current = null;
    if (!start || start.id !== event.pointerId) return;
    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 32) return;
    // A drag must not also toggle the disclosure through the ensuing click.
    suppressClick.current = true;
    if (Math.abs(dy) > Math.abs(dx)) setMinimized(dy > 0);
  };

  const handleDisclosureClick = (event) => {
    if (event.detail === 0 || !suppressClick.current) setMinimized(!isCompact);
    suppressClick.current = false;
  };

  /* ——  swipe + keyboard shortcuts  —— */
  const swipeHandlers = useSwipeSeek(audioRef);
  const handleClose = () => {
    setMinimized(false);
    audioRef.current?.pause();
    setPlaying(false);
    setVisible(false);
    setCurrentTime(0);
    setCurrentAudio(null);
    window.eventBus.dispatch('audio.playerhidden');
  };
  /* ——  render  —— */
  return (
    <div
      onTouchStart={swipeHandlers.onTouchStart}
      onTouchEnd={swipeHandlers.onTouchEnd}
      onTouchCancel={swipeHandlers.onTouchCancel}
      // inert means that the element and its children are not interactive,
      // but still visible. We use this to prevent interaction with the player when it's hidden.
      inert={!visible || undefined}
      // aria-hidden is used to hide the player from screen readers when it's hidden.
      aria-hidden={!visible || undefined}
      className={classNames(
        'audio-player fixed inset-x-0 bottom-0 z-[2000] bg-player-bg text-player-text shadow-lg print:hidden',
        'border-0 border-t border-solid border-player-muted rounded-t-2xl',
        'transition-transform duration-300 ease-in-out',
        'pb-[env(safe-area-inset-bottom,var(--tw-empty,0px))] px-3 sm:px-6',
        visible
          ? 'translate-y-0 opacity-100'
          : 'translate-y-full opacity-0 pointer-events-none',
      )}
    >
      {vw < 640 && (
        <div className={isCompact ? 'flex items-center gap-3 py-2' : ''}>
          <button
            type="button"
            aria-label={isCompact ? `Visa hela ljudspelaren: ${playerLabelText}` : 'Minimera ljudspelaren'}
            aria-expanded={!isCompact}
            aria-controls={controlsId}
            title={isCompact ? playerLabelText : 'Minimera ljudspelaren'}
            onClick={handleDisclosureClick}
            onPointerDown={handlePointerDown}
            onPointerUp={handlePointerUp}
            onPointerCancel={() => { gesture.current = null; suppressClick.current = true; }}
            className={classNames(
              'm-0 flex items-center justify-center border-0 rounded-lg bg-transparent text-player-text touch-none cursor-pointer',
              'hover:bg-player-control-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-player-focus',
              'focus-visible:ring-offset-2 focus-visible:ring-offset-player-bg',
              isCompact ? 'min-w-0 flex-1 h-12 gap-3 px-2 text-sm leading-tight' : 'mx-auto h-8 w-20',
            )}
          >
            {isCompact ? (
              <>
                <FontAwesomeIcon icon={faChevronUp} className="shrink-0" />
                <span className="min-w-0 flex-1 truncate text-left">{playerLabelText}</span>
              </>
            ) : <span className="h-1.5 w-10 rounded-full bg-player-muted" />}
          </button>
          {isCompact && (
            <button
              type="button"
              aria-label={playing ? 'Pausa' : 'Spela'}
              aria-pressed={playing}
              onClick={togglePlay}
              className="m-0 flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-0 bg-player-accent text-player-bg hover:bg-player-text cursor-pointer
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-player-focus focus-visible:ring-offset-2 focus-visible:ring-offset-player-bg [&>svg]:h-5 [&>svg]:w-5"
            >
              <FontAwesomeIcon icon={playing ? faPause : faPlay} />
            </button>
          )}
        </div>
      )}

      <div
        id={controlsId}
        hidden={isCompact}
        inert={isCompact || undefined}
        aria-hidden={isCompact || undefined}
        className={classNames(
          'mx-auto w-full max-w-[1200px] py-3 gap-x-4 gap-y-2 sm:grid-cols-[auto_64px_1fr_auto] sm:grid-rows-1 items-center',
          isCompact ? 'hidden' : 'flex flex-col sm:grid',
        )}
      >
        {/* transport */}
        <PlayerButtons
          audioRef={audioRef}
          playing={playing}
          togglePlay={togglePlay}
        />

        {/* elapsed time (desktop only) */}
        <div className="hidden sm:flex flex-col items-end w-16 leading-tight">
          <time
            aria-label="Tid"
            dateTime={(currentTime / 1000).toFixed(0)}
            className="font-mono tabular-nums text-lg tracking-tight"
          >
            {msToTime(currentTime)}
          </time>

          <time
            aria-label="Total tid"
            dateTime={(durationTime / 1000).toFixed(0)}
            className="font-mono tabular-nums text-xs text-player-muted tracking-tight"
          >
            {durationTime ? msToTime(durationTime) : '--:--'}
          </time>
        </div>

        {/* label + timeline */}
        <div className="w-full min-w-0 flex flex-col gap-2">
          <div
            ref={labelRef}
            className="relative overflow-hidden text-sm leading-tight"
          >
            <span
              ref={textRef}
              className="whitespace-nowrap inline-block will-change-transform"
              title={playerLabelText}
            >
              {playerLabelText}
            </span>
          </div>

          <Timeline
            current={currentTime}
            duration={durationTime || 1}
            onSeek={(ms) => {
              setCurrentTime(ms);
              audioRef.current.currentTime = ms / 1000;
            }}
            markers={currentAudio?.audio?.utterances ?? []}
            activeId={activeSegmentId}
          />
        </div>

        {/* close */}
        <button
          type="button"
          onClick={handleClose}
          aria-label="Stäng"
          className={classNames(
            'absolute top-1.5 right-3 sm:static sm:ml-auto',
            'flex h-10 w-10 sm:h-8 sm:w-8 items-center justify-center rounded-full',
            'border border-solid border-player-muted bg-player-control text-player-text hover:bg-player-control-hover',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-player-focus',
            'focus-visible:ring-offset-2 focus-visible:ring-offset-player-bg',
          )}
        >
          <FontAwesomeIcon icon={faClose} className="h-5 w-5 sm:h-4 sm:w-4" />
        </button>
      </div>
    </div>
  );
}
