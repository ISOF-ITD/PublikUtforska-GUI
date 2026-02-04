import { useEffect, useMemo, useRef, useState } from "react";
import msToTime from "../msToTime";
import classNames from "classnames";

export default function Timeline({
  current,
  duration,
  onSeek,
  markers = [],
  activeId = null,
}) {
  /* % complete */
  const pct = useMemo(
    () => (duration ? Math.min(100, (current / duration) * 100) : 0),
    [current, duration]
  );

  /* ─── semantic tick-marks for utterances ─── */
  const ticks = useMemo(() => {
    if (!duration || !markers?.length) return null;
    return markers.map((m) => (
      <span
        role="button"
        tabIndex={0}
        aria-label={`Hoppa till ${msToTime(m.start * 1000)}`}
        onClick={() => onSeek(m.start * 1000)} // jump to marker
        onKeyDown={(e) =>
          (e.key === " " || e.key === "Enter") && onSeek(m.start * 1000)
        }
        key={m.id}
        className={classNames(
          //"absolute bottom-0 w-px h-1 sm:h-1.5",
          "absolute bottom-0 w-3 -translate-x-1.5 h-3",
          m.id === activeId ? "bg-isof" : "bg-gray-400/60"
        )}
        style={{ left: `${(m.start / duration) * 100}%` }}
      />
    ));
  }, [markers, duration, activeId]);

  /* when user grabs the thumb */
  const [isSeeking, setIsSeeking] = useState(false);
  const [scrub, setScrub] = useState(current);
  useEffect(() => {
    if (!isSeeking) setScrub(current);
  }, [current, isSeeking]);

  /* hover bubble */
  const rail = useRef(null),
    bubble = useRef(null);
  const [hoverMs, setHoverMs] = useState(null);
  const move = (e) => {
    if (!rail.current) return;
    const { left, width } = rail.current.getBoundingClientRect();
    const x = e.clientX - left;
    const p = Math.min(Math.max(x / width, 0), 1);
    const t = duration * p;
    setHoverMs(t);
    if (bubble.current) bubble.current.style.left = `${p * 100}%`;
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
        className="relative h-2.5 rounded-full bg-gray-100 dark:bg-gray-700"
      >
        {/* played bar */}
        <div
          style={{
            width: `${pct}%`,
            backgroundImage:
              "repeating-linear-gradient(135deg,rgba(255,255,255,.35) 0 4px,transparent 4px 8px)",
            backgroundBlendMode: "lighten",
          }}
          className="absolute inset-y-0 bg-lighter-isof rounded-full transition-all"
        />

        {/* segment boundaries */}
        {ticks}

        {/* bubble */}
        {hoverMs != null && (
          <span
            ref={bubble}
            className="absolute -top-5 px-1.5 -translate-x-1/2 rounded bg-gray-800 text-sm text-white font-mono"
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
          onChange={(e) => setScrub(+e.target.value)}
          className="absolute inset-0 w-full appearance-none cursor-pointer bg-transparent focus-visible:outline-none
                     focus-visible:ring-2 focus-visible:ring-isof
                     [&::-webkit-slider-thumb]:appearance-none
                     [&::-webkit-slider-thumb]:rounded-full
                     [&::-webkit-slider-thumb]:bg-isof
                     [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6
                     min-[430px]:[&::-webkit-slider-thumb]:w-4 min-[430px]:[&::-webkit-slider-thumb]:h-4"
          aria-label="Välj starttid"
        />
      </div>

      <div className="mt-1 pr-2 flex justify-end gap-1 font-mono text-sm text-gray-600">
        <span className="text-isof">
          {msToTime(isSeeking ? scrub : current)}
        </span>
        <span className="text-gray-400">/</span>
        <span className="text-gray-500">{msToTime(duration)}</span>
      </div>
    </div>
  );
}
