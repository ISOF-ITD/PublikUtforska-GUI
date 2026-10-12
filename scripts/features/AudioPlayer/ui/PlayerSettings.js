import { Popover, PopoverButton, PopoverPanel } from '@headlessui/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGear } from '@fortawesome/free-solid-svg-icons';
import {
  useCallback, useEffect, useId, useRef, useState,
} from 'react';
import PropTypes from 'prop-types';
import SpeedSelector from './SpeedSelector';

export default function PlayerSettings({
  playbackRate, setPlaybackRate, hasSeries, autoAdvance, setAutoAdvance,
}) {
  const id = useId();
  const buttonRef = useRef(null);
  const [panelHeight, setPanelHeight] = useState(null);
  const measureSpace = useCallback(() => {
    if (buttonRef.current) {
      // Cap the panel before Headless UI measures it, so it scrolls above the player.
      setPanelHeight(Math.max(44, Math.floor(buttonRef.current.getBoundingClientRect().top - 20)));
    }
  }, []);

  useEffect(() => {
    const observer = new ResizeObserver(measureSpace);
    observer.observe(buttonRef.current.closest('.audio-player'));
    return () => observer.disconnect();
  }, [measureSpace]);

  return (
    <Popover>
      <PopoverButton
        ref={buttonRef}
        aria-label="Inställningar för ljudspelaren"
        aria-haspopup="dialog"
        aria-describedby={hasSeries ? `${id}-auto-state` : undefined}
        title="Inställningar för ljudspelaren"
        onClick={measureSpace}
        onKeyDown={measureSpace}
        className="relative m-0 flex h-[44px] w-[44px] items-center justify-center rounded-full border-0 bg-transparent text-player-text hover:bg-player-control-hover cursor-pointer
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-player-focus focus-visible:ring-offset-2 focus-visible:ring-offset-player-bg"
      >
        <FontAwesomeIcon icon={faGear} className="h-[20px] w-[20px]" />
        {hasSeries && autoAdvance && (
          <span aria-hidden="true" className="absolute right-1 top-1 h-2 w-2 rounded-full bg-player-accent" />
        )}
      </PopoverButton>
      {hasSeries && (
        <span id={`${id}-auto-state`} className="sr-only">
          {`Spela nästa automatiskt är ${autoAdvance ? 'på' : 'av'}.`}
        </span>
      )}
      <PopoverPanel
        anchor={{ to: 'top end', gap: 8, padding: 12 }}
        focus
        role="dialog"
        aria-labelledby={`${id}-heading`}
        style={{ '--anchor-max-height': panelHeight ? `${panelHeight}px` : 'calc(100dvh - 24px)' }}
        className="audio-player box-border z-[2100] w-72 max-w-[calc(100vw-24px)] max-h-[var(--anchor-max-height)] overflow-y-auto break-words rounded-xl border border-solid border-player-muted bg-player-bg p-4 text-player-text shadow-lg print:hidden"
      >
        <h2 id={`${id}-heading`} className="!m-0 !mb-4 !text-base !font-semibold !text-player-text">
          Ljudinställningar
        </h2>
        <SpeedSelector id={`${id}-speed`} speed={playbackRate} onChange={setPlaybackRate} />
        {hasSeries && (
          <label htmlFor={`${id}-auto`} className="mt-3 flex min-h-11 cursor-pointer items-center gap-3 rounded px-1 text-sm text-player-text hover:bg-player-control-hover">
            <input
              id={`${id}-auto`}
              type="checkbox"
              checked={autoAdvance}
              onChange={(event) => setAutoAdvance(event.target.checked)}
              className="m-0 h-4 w-4 shrink-0 accent-player-accent [color-scheme:light] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-player-focus focus-visible:ring-offset-2 focus-visible:ring-offset-player-bg"
            />
            Spela nästa automatiskt
          </label>
        )}
      </PopoverPanel>
    </Popover>
  );
}

PlayerSettings.propTypes = {
  playbackRate: PropTypes.number.isRequired,
  setPlaybackRate: PropTypes.func.isRequired,
  hasSeries: PropTypes.bool.isRequired,
  autoAdvance: PropTypes.bool.isRequired,
  setAutoAdvance: PropTypes.func.isRequired,
};
