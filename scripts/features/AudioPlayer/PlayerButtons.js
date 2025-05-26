import {
  faRotateRight,
  faRotateLeft,
  faPlay,
  faPause,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import PropTypes from "prop-types";
import { useCallback, useRef } from "react";
import SpeedSelector from "./SpeedSelector";

const JUMP_SEC = 15;

/* 48 dp = WCAG-AA target for mobile */
const BTN =
  "relative flex items-center justify-center rounded-full \
   bg-gray-50 text-gray-700 shadow-sm hover:bg-gray-100 active:scale-95 \
   focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-isof \
   h-14 w-14 sm:h-12 sm:w-12 hover:cursor-pointer";

export default function PlayerButtons({ audioRef, playing, togglePlay }) {
  const backwardBtn = useRef(null),
    forwardBtn = useRef(null);

  const bump = (btn) => {
    if (!btn) return;
    btn.classList.remove("animate-zoom");
    void btn.offsetWidth;
    btn.classList.add("animate-zoom");
    if (navigator.vibrate) navigator.vibrate(10);
  };

  const seekRelative = useCallback(
    (sec) => {
      const a = audioRef.current;
      if (!a) return;
      a.currentTime = Math.min(Math.max(0, a.currentTime + sec), a.duration);
      bump(sec < 0 ? backwardBtn.current : forwardBtn.current);
    },
    [audioRef]
  );

  return (
    <div className="flex items-center gap-3 sm:gap-4">
      <a
        ref={backwardBtn}
        role="button"
        aria-label={`Spola −${JUMP_SEC} sek`}
        onClick={() => seekRelative(-JUMP_SEC)}
        className={BTN}
      >
        <FontAwesomeIcon icon={faRotateLeft} />
        <span className="absolute bottom-0.5 right-1 text-sm">
          {JUMP_SEC}
        </span>
      </a>

      <a
        aria-label={playing ? "Pausa" : "Spela"}
        onClick={togglePlay}
        role="button"
        className={`${BTN} bg-isof text-white hover:bg-isof/90`}
      >
        <FontAwesomeIcon icon={playing ? faPause : faPlay} />
      </a>

      <a
        ref={forwardBtn}
        role="button"
        aria-label={`Spola +${JUMP_SEC} sek`}
        onClick={() => seekRelative(JUMP_SEC)}
        className={BTN}
      >
        <FontAwesomeIcon icon={faRotateRight} />
        <span className="absolute bottom-0.5 left-1 text-sm">
          {JUMP_SEC}
        </span>
      </a>

      {/* hide speed picker where width < 430 px */}
      <div className="hidden min-[430px]:block">
        <SpeedSelector audioRef={audioRef} />
      </div>
    </div>
  );
}

PlayerButtons.propTypes = {
  audioRef: PropTypes.object.isRequired,
  playing: PropTypes.bool.isRequired,
  togglePlay: PropTypes.func.isRequired,
};
