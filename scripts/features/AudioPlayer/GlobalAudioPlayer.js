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
import PlayerSettings from './ui/PlayerSettings';
import Timeline from './ui/Timeline';
import msToTime from './msToTime';

import useViewportWidth from './hooks/useViewportWidth';
import useMarquee from './hooks/useMarquee';
import useSwipeSeek from './hooks/useSwipeSeek';

export default function GlobalAudioPlayer() {
  const {
    playing,
    audioRef,
    togglePlay,
    currentTime,
    setCurrentTime,
    durationTime,
    playerLabelText,
    visible,
    closeAudio,
    currentAudio,
    queue = [],
    currentIndex = -1,
    playPrevious,
    playNext,
    autoAdvance = false,
    setAutoAdvance,
    playbackRate = 1,
    setPlaybackRate,
    playbackError = '',
    playbackStatus = '',
  } = useContext(AudioContext);

  /* ——  viewport & marquee  —— */
  const vw = useViewportWidth(); // Triggers marquee recalculation
  const [minimized, setMinimized] = useState(false);
  const isCompact = minimized && vw < 640;
  const controlsId = useId();
  const gesture = useRef(null);
  const suppressClick = useRef(false);
  const [labelRef, textRef] = useMarquee([playerLabelText, vw, isCompact]);
  const seriesLabel = queue.length > 1 ? `Inspelning ${currentIndex + 1} av ${queue.length}` : '';
  const counter = seriesLabel && (
    <span className="shrink-0 text-sm tabular-nums text-player-muted">
      <span aria-hidden="true">{`${currentIndex + 1}/${queue.length}`}</span>
      <span className="sr-only">{seriesLabel}</span>
    </span>
  );

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
    closeAudio();
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
            aria-label={isCompact ? `Visa hela ljudspelaren: ${seriesLabel ? `${seriesLabel}: ` : ''}${playerLabelText}` : 'Minimera ljudspelaren'}
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
              isCompact ? 'min-w-0 flex-1 h-12 gap-3 px-2 text-sm leading-tight' : 'mx-auto h-[48px] w-[80px]',
            )}
          >
            {isCompact ? (
              <>
                <FontAwesomeIcon icon={faChevronUp} className="shrink-0" />
                {counter}
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
          'mx-auto w-full max-w-[1200px] pb-3 pt-3 sm:pt-14 md:pt-3 gap-x-4 gap-y-2 md:grid-cols-[auto_64px_1fr_auto] items-center',
          isCompact ? 'hidden' : 'flex flex-col md:grid',
        )}
      >
        {/* transport */}
        <PlayerButtons
          audioRef={audioRef}
          playing={playing}
          togglePlay={togglePlay}
          queue={queue}
          currentIndex={currentIndex}
          playPrevious={playPrevious}
          playNext={playNext}
        />

        {/* elapsed time (desktop only) */}
        <div className="hidden md:flex flex-col items-end w-16 leading-tight md:col-start-2 md:row-start-1">
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
        <div className="w-full min-w-0 flex flex-col gap-2 md:col-start-3 md:row-start-1">
          <div className="flex min-w-0 items-center gap-2 text-sm leading-tight">
            {counter}
            <div
              ref={labelRef}
              className="relative min-w-0 flex-1 overflow-hidden"
            >
              <span
                ref={textRef}
                className="whitespace-nowrap inline-block will-change-transform"
                title={playerLabelText}
              >
                {playerLabelText}
              </span>
            </div>
          </div>

          <Timeline
            current={currentTime}
            duration={durationTime || 1}
            onSeek={(ms) => {
              setCurrentTime(ms);
              audioRef.current.currentTime = ms / 1000;
            }}
          />
        </div>

        <div className="absolute top-1 right-3 flex items-center gap-1 md:static md:ml-auto md:col-start-4 md:row-start-1">
          {visible && !isCompact && (
            <PlayerSettings
              key={currentAudio?.record?.id || 'no-record'}
              playbackRate={playbackRate}
              setPlaybackRate={setPlaybackRate}
              hasSeries={queue.length > 1}
              autoAdvance={autoAdvance}
              setAutoAdvance={setAutoAdvance}
            />
          )}
          <button
            type="button"
            onClick={handleClose}
            aria-label="Stäng"
            className="m-0 flex h-[44px] w-[44px] items-center justify-center rounded-full border border-solid border-player-muted bg-player-control text-player-text hover:bg-player-control-hover cursor-pointer
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-player-focus focus-visible:ring-offset-2 focus-visible:ring-offset-player-bg"
          >
            <FontAwesomeIcon icon={faClose} className="h-[20px] w-[20px]" />
          </button>
        </div>
      </div>
      <p role="status" aria-live="polite" aria-atomic="true" className={playbackError ? 'mx-auto mb-3 max-w-[1200px] text-sm text-player-text' : 'sr-only'}>
        {playbackError || playbackStatus}
      </p>
    </div>
  );
}
