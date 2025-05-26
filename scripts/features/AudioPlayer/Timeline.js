import { useEffect, useMemo, useRef, useState } from "react";
import msToTime from "./msToTime";

export default function Timeline({ current, duration, onSeek }) {
  /* % complete */
  const pct = useMemo(
    () => (duration ? Math.min(100, (current / duration) * 100) : 0),
    [current, duration]
  );

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
        className="relative h-3 rounded bg-gray-200 dark:bg-gray-700"
      >
        {/* played bar */}
        <div
          style={{
            width: `${pct}%`,
            backgroundImage:
              "repeating-linear-gradient(135deg,rgba(255,255,255,.35) 0 4px,transparent 4px 8px)",
            backgroundBlendMode: "lighten",
          }}
          className="absolute inset-y-0 bg-lighter-isof rounded transition-all"
        />

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
          aria-label="Sök i ljudet"
        />
      </div>

      <div className="mt-0.5 pr-2 flex justify-end gap-1 font-mono text-sm text-gray-500">
        <span>{msToTime(isSeeking ? scrub : current)}</span>/
        <span>{msToTime(duration)}</span>
      </div>
    </div>
  );
}
