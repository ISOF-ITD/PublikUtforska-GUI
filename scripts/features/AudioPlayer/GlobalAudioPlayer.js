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
import { faClose, faWindowClose } from "@fortawesome/free-solid-svg-icons";

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

  /* ==========  NEW: viewport helpers  ========== */
  const [vw, setVw] = useState(window.innerWidth);
  useEffect(() => {
    const onResize = () => setVw(window.innerWidth);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  /* ==========  marquee re-calc ========== */
  const labelRef = useRef(null);
  const labelTextRef = useRef(null);
  useEffect(() => {
    const label = labelRef.current;
    const txt = labelTextRef.current;
    if (!label || !txt) return;

    const needsScroll = txt.scrollWidth > label.clientWidth;

    // Reset animation and layout
    txt.style.animation = "none";
    label.classList.remove("line-clamp-2");

    // Force reflow
    void txt.offsetWidth;

    if (needsScroll) {
      const containerWidth = label.clientWidth;
      const textWidth = txt.scrollWidth;
      const duration = (textWidth + containerWidth) / 50; // Adjust speed (50px/s)

      txt.style.setProperty("--marquee-container-width", `${containerWidth}px`);
      txt.style.animation = `marquee-run ${duration}s linear infinite`;
      label.classList.add("marquee-mask");
    } else {
      label.classList.add("line-clamp-2");
    }
  }, [playerLabelText, vw]);

  /* ==========  audio events  ========== */
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

  /* ==========  NEW: swipe left / right to seek 15 s on mobile  ========== */
  const swipeRef = useRef({ x: null, t: 0 });
  const onTouchStart = (e) => {
    swipeRef.current = { x: e.touches[0].clientX, t: Date.now() };
  };
  const onTouchEnd = (e) => {
    const startX = swipeRef.current.x;
    if (startX == null) return;
    const dx = e.changedTouches[0].clientX - startX;
    const dt = Date.now() - swipeRef.current.t;
    if (dt < 400 && Math.abs(dx) > 60) {
      // quick, deliberate swipe
      const audio = audioRef.current;
      if (!audio) return;
      const jump = dx > 0 ? 15 : -15;
      audio.currentTime = Math.min(
        Math.max(0, audio.currentTime + jump),
        audio.duration
      );
    }
  };

  /* ==========  housekeeping / keyboard  ========== */
  const handleClose = useCallback(() => {
    audioRef.current?.pause();
    setPlaying(false);
    setVisible(false);
    setCurrentTime(0);
    setCurrentAudio(null);
    window.eventBus.dispatch("audio.playerhidden");
  }, [audioRef, setPlaying, setVisible, setCurrentTime, setCurrentAudio]);

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
        case "KeyM":
          audio.muted = !audio.muted;
          break;
        case "Escape":
          handleClose();
          break;
        default:
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [audioRef, togglePlay, handleClose]);

  /* ==========  RENDER  ========== */
  return (
    <div
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      className={classNames(
        "fixed inset-x-0 bottom-0 z-[2000] bg-white shadow-lg/10 border-t-2 border-isof rounded-t-2xl",
        "transition-transform duration-300 ease-in-out",
        "pb-[env(safe-area-inset-bottom,var(--tw-empty,0px))] px-3 sm:px-6",
        visible
          ? "translate-y-0 opacity-100"
          : "translate-y-full opacity-0 pointer-events-none"
      )}
    >
      {/* ── grab handle ───────────────────────────────────── */}
      <div className="mx-auto mt-1 mb-1 h-1.5 w-10 rounded-full bg-gray-300/80 sm:hidden" />

      {/* ──  content grid / flex fallback ─────────────────── */}
      <div
        className="mx-auto w-full max-w-[1200px] py-3 gap-x-4 gap-y-2
       flex flex-col sm:grid
       sm:grid-cols-[auto_64px_1fr_auto] sm:grid-rows-1 items-center"
      >
        {/* transport */}
        <PlayerButtons
          audioRef={audioRef}
          playing={playing}
          togglePlay={togglePlay}
        />

        {/* time (desktop only) */}
        <div className="hidden sm:block font-mono text-gray-500 text-right">
          <span>
            {msToTime(currentTime)}
            <br />
          </span>
        </div>

        {/* label & timeline */}
        <div className="w-full flex flex-col gap-2 overflow-hidden">
          {/* title strip */}
          <div
            ref={labelRef}
            className="relative overflow-hidden text-sm leading-tight "
          >
            <span
              ref={labelTextRef}
              className="whitespace-nowrap inline-block will-change-transform "
              title={playerLabelText}
            >
              {playerLabelText}
            </span>
          </div>

          {/* timeline  */}
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

        {/* close button – now absolute on mobile, inline on ≥ sm */}
        <a
          onClick={handleClose}
          aria-label="Stäng"
          role="button"
          className={classNames(
            // mobile: floating pill over the sheet header
            "absolute top-1.5 right-3 sm:static sm:ml-auto",
            "flex h-10 w-10 sm:h-8 sm:w-8 items-center justify-center rounded-full",
            "bg-gray-100 text-gray-500 hover:bg-gray-200",
            "focus-visible:ring-2 focus-visible:ring-isof hover:cursor-pointer"
          )}
        >
          <FontAwesomeIcon icon={faClose} className="h-5 w-5 sm:h-4 sm:w-4" />
        </a>
      </div>
    </div>
  );
}
