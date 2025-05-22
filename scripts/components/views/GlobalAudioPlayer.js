import classNames from "classnames";
import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { AudioContext } from "../../contexts/AudioContext";
import PlayerButtons from "./PlayerButtons";

/* helper ─────────────────────────────────────────── */
const msToTime = (ms = 0) => {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60)
    .toString()
    .padStart(2, "0");
  const seconds = (totalSeconds % 60).toString().padStart(2, "0");
  return hours > 0 ? `${hours}:${minutes}:${seconds}` : `${minutes}:${seconds}`;
}; // “MM:SS”

const KEY = {
  SPACE: "Space",
  LEFT: "ArrowLeft",
  RIGHT: "ArrowRight",
  RATE_DOWN: "BracketLeft",
  RATE_UP: "BracketRight",
};

function Timeline({ current, duration, onSeek }) {
  const pct = useMemo(
    () => (duration ? Math.min(100, (current / duration) * 100) : 0),
    [current, duration]
  );

  /* --- seeking state --------------------------------------------- */
  const [isSeeking, setIsSeeking] = useState(false);
  const [scrub, setScrub] = useState(current);
  useEffect(() => {
    if (!isSeeking) setScrub(current);
  }, [current, isSeeking]);

  /* --- hover bubble ---------------------------------------------- */
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
          style={{ width: `${pct}%` }}
          className="absolute inset-y-0 rounded bg-lighter-isof transition-[width]"
        />
        {/* bubble on hover */}
        {hoverMs != null && (
          <div
            ref={bubble}
            className="absolute -top-8 -translate-x-1/2 px-1.5 rounded bg-gray-900 text-[10px] font-mono text-white"
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

export default function GlobalAudioPlayer() {
  const {
    playing,
    audioRef,
    setPlaying,
    togglePlay,
    currentTime,
    setCurrentTime,
    durationTime,
    setDurationTime,
    playerLabelText,
    visible,
    setVisible,
    setCurrentAudio,
  } = useContext(AudioContext);

  const [viewportW, setViewportW] = useState(window.innerWidth);
  const [showKeys, setShowKeys] = useState(false);
  const labelRef = useRef(null);
  const labelTextRef = useRef(null);

  /* resize – recalc marquee width */
  useEffect(() => {
    const onResize = () => setViewportW(window.innerWidth);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  /* label marquee */
  useEffect(() => {
    const label = labelRef.current;
    const txt = labelTextRef.current;
    if (!label || !txt) return;

    const needsScroll = txt.offsetWidth > label.offsetWidth;
    txt.classList.toggle("animate-marquee", needsScroll);

    if (needsScroll) {
      const diff = txt.offsetWidth - label.offsetWidth;
      txt.style.animationDuration = `${diff / 20}s`; // slower = easier to read
    }
  }, [playerLabelText, viewportW]);

  /* audio events */
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onLoaded = () => {
      setDurationTime(audio.duration * 1000);
      setCurrentTime(audio.currentTime * 1000);
    };
    const onTime = () => {
      setCurrentTime(audio.currentTime * 1000);
      window.dispatchEvent(
        new CustomEvent("audio.time", { detail: { pos: audio.currentTime } })
      );
    };

    audio.addEventListener("loadedmetadata", onLoaded);
    audio.addEventListener("timeupdate", onTime);
    return () => {
      audio.removeEventListener("loadedmetadata", onLoaded);
      audio.removeEventListener("timeupdate", onTime);
    };
  }, [audioRef, setDurationTime, setCurrentTime]);

  /* seek from slider */
  const handleSeek = (val) => {
    setCurrentTime(val);
    audioRef.current.currentTime = val / 1000;
  };

  /* close */
  const handleClose = useCallback(() => {
    const audio = audioRef.current;
    if (audio) audio.pause();
    setPlaying(false);
    setVisible(false);
    setCurrentTime(0);
    setCurrentAudio(null);
    window.eventBus.dispatch("audio.playerhidden");
  }, [audioRef, setPlaying, setVisible, setCurrentTime, setCurrentAudio]);

  /* keyboard shortcuts */
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const handler = (e) => {
      if (e.target.tagName === "INPUT") return;
      switch (e.code) {
        case KEY.SPACE:
          e.preventDefault();
          togglePlay();
          break;
        case KEY.LEFT:
          audio.currentTime = Math.max(0, audio.currentTime - 5);
          break;
        case KEY.RIGHT:
          audio.currentTime = Math.min(audio.duration, audio.currentTime + 5);
          break;
        case KEY.RATE_DOWN:
          audio.playbackRate = Math.max(0.5, audio.playbackRate - 0.1);
          break;
        case KEY.RATE_UP:
          audio.playbackRate = Math.min(2, audio.playbackRate + 0.1);
          break;
        case "KeyM": // mute/unmute
          audio.muted = !audio.muted;
          break;
        case "Escape": // quick close
          handleClose();
          break;
        default:
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [audioRef, togglePlay, handleClose]);

  return (
    <div
      className={classNames(
        "fixed inset-x-0 bottom-0 z-[999] bg-white drop-shadow-lg",
        "transition-transform duration-300 ease-in-out",
        visible ? "translate-y-0 visible" : "translate-y-full hidden",
        "px-3 sm:px-6 !py-2.5"
      )}
    >
      <div
        className="mx-auto w-full max-w-[1200px] grid items-center gap-4"
        style={{
          gridTemplateColumns: "auto 84px 1fr auto",
        }}
      >
        {/* transport buttons */}
        <PlayerButtons
          audioRef={audioRef}
          playing={playing}
          togglePlay={togglePlay}
        />

        {/* time */}
        <div className="text-right text-sm font-mono">
          <span>{msToTime(currentTime)}</span>
          <div className="text-xs text-gray-500">{msToTime(durationTime)}</div>
        </div>

        {/* label + slider */}
        <div className="flex flex-col gap-1 overflow-hidden">
          <div
            ref={labelRef}
            className="relative h-5 overflow-hidden whitespace-nowrap"
            aria-live="polite"
          >
            <div
              ref={labelTextRef}
              className="inline-block relative pr-4"
              title={playerLabelText}
            >
              {playerLabelText}
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

        {/* close button */}
        <a
          onClick={handleClose}
          aria-label="Stäng"
          className="rounded-full p-2 hover:bg-gray-100 focus-visible:ring-2 focus-visible:ring-isof"
        >
          ✕
        </a>
      </div>
    </div>
  );
}
