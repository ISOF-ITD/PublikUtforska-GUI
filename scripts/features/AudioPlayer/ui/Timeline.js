import {
  useEffect, useMemo, useRef, useState,
} from 'react';
import classNames from 'classnames';
import PropTypes from 'prop-types';
import msToTime from '../msToTime';

export default function Timeline({
  current,
  duration,
  onSeek,
  markers = [],
  activeId = null,
}) {
  /* ─── semantic tick-marks for utterances ─── */
  const ticks = useMemo(() => {
    if (!duration || !markers?.length) return null;
    return markers.map((m) => (
      <button
        type="button"
        aria-label={`Hoppa till ${msToTime(m.start * 1000)}`}
        aria-current={m.id === activeId ? 'true' : undefined}
        onClick={() => onSeek(m.start * 1000)} // jump to marker
        key={m.id}
        className={classNames(
          'absolute bottom-0 z-10 m-0 w-3 [transform:translateX(-50%)] h-3 p-0 border border-solid border-player-bg',
          'hover:bg-player-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-player-focus',
          'focus-visible:ring-offset-2 focus-visible:ring-offset-player-bg',
          m.id === activeId ? 'bg-player-accent rounded-full' : 'bg-player-muted rounded-sm',
        )}
        style={{ left: `${((m.start * 1000) / duration) * 100}%` }}
      />
    ));
  }, [markers, duration, activeId, onSeek]);

  /* when user grabs the thumb */
  const [isSeeking, setIsSeeking] = useState(false);
  const [scrub, setScrub] = useState(current);
  useEffect(() => {
    if (!isSeeking) setScrub(current);
  }, [current, isSeeking]);

  /* hover bubble */
  const rail = useRef(null);
  const [hoverMs, setHoverMs] = useState(null);
  const move = (e) => {
    if (!rail.current) return;
    const { left, width } = rail.current.getBoundingClientRect();
    const x = e.clientX - left;
    const p = Math.min(Math.max(x / width, 0), 1);
    const t = duration * p;
    setHoverMs(t);
  };

  const commit = (val) => {
    onSeek(val);
    setIsSeeking(false);
  };

  return (
    <div className="relative w-full select-none touch-none">
      {/* rail */}
      <div
        ref={rail}
        onPointerMove={move}
        onPointerLeave={() => setHoverMs(null)}
        className="relative h-2.5 rounded-full bg-player-text"
      >
        {/* segment boundaries */}
        {ticks}

        {/* bubble */}
        {hoverMs != null && (
          <span
            aria-hidden="true"
            style={{ left: `${(hoverMs / duration) * 100}%` }}
            className="pointer-events-none absolute -top-5 px-1.5 [transform:translateX(-50%)] rounded bg-player-text text-sm text-player-bg font-mono"
          >
            {msToTime(hoverMs)}
          </span>
        )}

        {/* invisible input */}
        <input
          type="range"
          min={0}
          max={duration}
          step={100}
          value={isSeeking ? scrub : current}
          onPointerDown={() => setIsSeeking(true)}
          onPointerUp={(e) => commit(+e.target.value)}
          onChange={(e) => {
            const value = +e.target.value;
            setScrub(value);
            if (!isSeeking) commit(value);
          }}
          className="absolute inset-0 m-0 h-2.5 w-full appearance-none cursor-pointer bg-transparent focus-visible:outline-none
                     rounded-full focus-visible:ring-2 focus-visible:ring-player-focus
                     focus-visible:ring-offset-2 focus-visible:ring-offset-player-bg
                     [&::-webkit-slider-thumb]:appearance-none
                     [&::-webkit-slider-thumb]:rounded-full
                     [&::-webkit-slider-thumb]:bg-player-text
                     [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-solid [&::-webkit-slider-thumb]:border-player-bg
                     [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6
                     min-[430px]:[&::-webkit-slider-thumb]:w-4 min-[430px]:[&::-webkit-slider-thumb]:h-4
                     [&::-moz-range-track]:bg-transparent
                     [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-player-text
                     [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-solid [&::-moz-range-thumb]:border-player-bg
                     [&::-moz-range-thumb]:box-border [&::-moz-range-thumb]:w-6 [&::-moz-range-thumb]:h-6
                     min-[430px]:[&::-moz-range-thumb]:w-4 min-[430px]:[&::-moz-range-thumb]:h-4"
          aria-label="Välj starttid"
        />
      </div>

      <div className="mt-1 pr-2 flex justify-end gap-1 font-mono text-sm text-player-muted">
        <span className="text-player-text">
          {msToTime(isSeeking ? scrub : current)}
        </span>
        <span>/</span>
        <span>{msToTime(duration)}</span>
      </div>
    </div>
  );
}

Timeline.propTypes = {
  current: PropTypes.number.isRequired,
  duration: PropTypes.number.isRequired,
  onSeek: PropTypes.func.isRequired,
  markers: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    start: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  })),
  activeId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
};
