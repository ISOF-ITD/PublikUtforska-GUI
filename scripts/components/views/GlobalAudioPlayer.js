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
const msToTime = (ms = 0) => new Date(ms).toISOString().substring(14, 19); // “MM:SS”

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

  return (
    <div className="relative h-2 w-full rounded bg-gray-200">
      {/* progress fill */}
      <div
        className="absolute inset-y-0 left-0 bg-isof rounded"
        style={{ width: `${pct}%` }}
      />

      {/* native range slider overlay (gives keyboard & SR for free) */}
      <input
        type="range"
        min={0}
        max={duration}
        step={10}
        value={current}
        onInput={(e) => onSeek(+e.target.value)}
        aria-label="Sök i ljudet"
        className="absolute inset-0 h-full w-full cursor-pointer appearance-none bg-transparent"
      />
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
        default:
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [audioRef, togglePlay]);

  /* seek from slider */
  const handleSeek = (val) => {
    const audio = audioRef.current;
    audio.currentTime = val / 1000;
    setCurrentTime(val);
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

  return (
    <div
      className={classNames(
        "fixed inset-x-0 bottom-0 !z-[900] bg-white shadow-lg",
        "transition-transform duration-300 ease-in-out",
        visible ? "!translate-y-0 visible" : "!translate-y-full hidden",
        "px-2 sm:px-4 py-2"
      )}
    >
      <div
        className="mx-auto w-full max-w-[1200px] grid items-center gap-4"
        style={{
          gridTemplateColumns: "auto 72px 1fr auto",
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
            onSeek={handleSeek}
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
