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
import Timeline from "./Timeline";
import msToTime from "./msToTime";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faWindowClose } from "@fortawesome/free-solid-svg-icons";

const KEY = {
  SPACE: "Space",
  LEFT: "ArrowLeft",
  RIGHT: "ArrowRight",
  RATE_DOWN: "BracketLeft",
  RATE_UP: "BracketRight",
};

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
        "bg-white fixed inset-x-0 bottom-0 z-[2000] transition-transform duration-300 ease-in-out",
        "px-3 sm:px-6 !border border-t-2 border-isof shadow-lg/10 rounded-2xl",
        visible
          ? "translate-y-0 opacity-100"
          : "translate-y-full opacity-0 pointer-events-none"
      )}
    >
      <div
        className="mx-auto w-full max-w-[1200px] grid items-center gap-4 !py-2.5"
        style={{
          gridTemplateColumns: "auto 84px 1fr auto",
        }}
      >
        {/* transport buttons */}
        <PlayerButtons
          className="group"
          iconClassName="transition-transform duration-200 group-aria-[pressed=true]:scale-[1.15]"
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
            audioRef={audioRef}
            playing={playing}
          />
        </div>

        {/* close button */}
        <a
          onClick={handleClose}
          aria-label="Stäng"
          role="button"
          className="ml-8 text-isof hover:text-darker-isof hover:cursor-pointer !p-2 focus-visible:ring-2 focus-visible:ring-isof"
        >
          <FontAwesomeIcon icon={faWindowClose} className=" w-8 h-8" />
        </a>
      </div>
    </div>
  );
}
