import { useEffect, useMemo, useRef, useState } from "react";
import msToTime from "./msToTime";

export default function Timeline({ current, duration, onSeek }) {
  const pct = useMemo(
    () => (duration ? Math.min(100, (current / duration) * 100) : 0),
    [current, duration]
  );

  /* seeking state  */
  const [isSeeking, setIsSeeking] = useState(false);
  const [scrub, setScrub] = useState(current);
  useEffect(() => {
    if (!isSeeking) setScrub(current);
  }, [current, isSeeking]);

  /* hover bubble  */
  const rail = useRef(null);
  const bubble = useRef(null);
  const [hoverMs, setHoverMs] = useState(null);

  const move = (e) => {
    if (!rail.current) return;
    const { left, width } = rail.current.getBoundingClientRect();
    const x = e.clientX - left;
    const p = Math.min(Math.max(x / width, 0), 1);
    const t = duration * p;
    setHoverMs(t);

    /* bubble positioning */
    if (bubble.current) {
      bubble.current.style.left = `${p * 100}%`;
    }
  };

  const commit = (val) => {
    onSeek(val);
    setIsSeeking(false);
  };

  return (
    <div className="relative w-full select-none">
      {/* visible bar */}
      <div
        ref={rail}
        onMouseMove={move}
        onMouseLeave={() => setHoverMs(null)}
        className="relative h-3 rounded bg-gray-200 dark:bg-gray-700"
      >
        <div
          style={{
            width: `${pct}%`,
            backgroundImage: `
            repeating-linear-gradient(
                135deg,
                rgba(255,255,255,.35) 0 4px,
                transparent 4px 8px)`,
            backgroundBlendMode: "lighten",
          }}
          className="absolute inset-y-0 bg-lighter-isof rounded transition-all"
        />
        {/* bubble on hover */}
        {hoverMs != null && (
          <div
            ref={bubble}
            className="absolute -top-6 -translate-x-1/2 px-1.5 rounded bg-gray-900 font-mono text-white"
          >
            {msToTime(hoverMs)}
          </div>
        )}
        {/* invisible <input type=range> over the top */}
        <input
          type="range"
          min={0}
          max={duration}
          step={50} /* 50 ms = ~1 frame */
          value={isSeeking ? scrub : current}
          onPointerDown={() => setIsSeeking(true)}
          onChange={(e) => setScrub(+e.target.value)}
          onPointerUp={(e) => commit(+e.target.value)}
          onTouchEnd={(e) => commit(+e.target.value)}
          className="absolute inset-0 w-full cursor-pointer appearance-none bg-transparent
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-isof
            [&::-webkit-slider-thumb]:appearance-none
            [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-isof
            [&::-webkit-slider-thumb]:ring-2 [&::-webkit-slider-thumb]:ring-isof

            /* fatter thumb on touch devices */
            touch-none
            sm:[&::-webkit-slider-thumb]:h-4
            sm:[&::-webkit-slider-thumb]:w-4
            [&::-webkit-slider-thumb]:h-6
            [&::-webkit-slider-thumb]:w-6"
          aria-label="Sök i ljudet"
          role="slider"
          aria-valuemin="0"
          aria-valuemax={duration}
          aria-valuenow={current}
        />
      </div>

      {/* current / total read-out */}
      <div className="mt-0.5 flex justify-end gap-1 font-mono text-xs text-gray-500">
        <span>{msToTime(isSeeking ? scrub : current)}</span>/
        <span>{msToTime(duration)}</span>
      </div>
    </div>
  );
}
