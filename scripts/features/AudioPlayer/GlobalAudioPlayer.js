import classNames from "classnames";
import { useContext, useEffect } from "react";
import { AudioContext } from "../../contexts/AudioContext";
import PlayerButtons from "./PlayerButtons";
import Timeline from "./Timeline";
import msToTime from "./msToTime";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faClose } from "@fortawesome/free-solid-svg-icons";

import useViewportWidth from "./hooks/useViewportWidth";
import useMarquee from "./hooks/useMarquee";
import useSwipeSeek from "./hooks/useSwipeSeek";
import useKeyboardShortcuts from "./hooks/useKeyboardShortcuts";

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

  /* ——  viewport & marquee  —— */
  const vw = useViewportWidth(); //Triggers marquee recalculation
  const [labelRef, textRef] = useMarquee([playerLabelText, vw]);

  /* ——  audio <loaded|timeupdate>  —— */
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

  /* ——  swipe + keyboard shortcuts  —— */
  const swipeHandlers = useSwipeSeek(audioRef);
  const handleClose = () => {
    audioRef.current?.pause();
    setPlaying(false);
    setVisible(false);
    setCurrentTime(0);
    setCurrentAudio(null);
    window.eventBus.dispatch("audio.playerhidden");
  };
  useKeyboardShortcuts(audioRef, togglePlay, handleClose);

  /* ——  render  —— */
  return (
    <div
      {...swipeHandlers}
      className={classNames(
        "fixed inset-x-0 bottom-0 z-[2000] bg-white shadow-lg/10 border-t-2 border-isof rounded-t-2xl",
        "transition-transform duration-300 ease-in-out",
        "pb-[env(safe-area-inset-bottom,var(--tw-empty,0px))] px-3 sm:px-6",
        visible
          ? "translate-y-0 opacity-100"
          : "translate-y-full opacity-0 pointer-events-none"
      )}
    >
      {/* grab handle (mobile) */}
      <div className="mx-auto mt-1 mb-1 h-1.5 w-10 rounded-full bg-gray-300/80 sm:hidden" />

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

        {/* elapsed time (desktop only) */}
        <div className="hidden sm:block font-mono text-gray-500 text-right">
          {msToTime(currentTime)}
        </div>

        {/* label + timeline */}
        <div className="w-full flex flex-col gap-2 overflow-hidden">
          <div
            ref={labelRef}
            className="relative overflow-hidden text-sm leading-tight"
          >
            <span
              ref={textRef}
              className="whitespace-nowrap inline-block will-change-transform"
              title={playerLabelText}
            >
              {playerLabelText}
            </span>
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

        {/* close */}
        <button
          onClick={handleClose}
          aria-label="Stäng"
          className={classNames(
            "absolute top-1.5 right-3 sm:static sm:ml-auto",
            "flex h-10 w-10 sm:h-8 sm:w-8 items-center justify-center rounded-full",
            "bg-gray-100 text-gray-500 hover:bg-gray-200",
            "focus-visible:ring-2 focus-visible:ring-isof"
          )}
        >
          <FontAwesomeIcon icon={faClose} className="h-5 w-5 sm:h-4 sm:w-4" />
        </button>
      </div>
    </div>
  );
}
