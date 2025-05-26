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

const BTN_BASE =
  "relative flex h-11 w-11 items-center justify-center rounded-full \
   bg-gray-50 text-gray-700 shadow-sm hover:bg-gray-100 \
   focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-isof \
   sm:h-12 sm:w-12";

export default function PlayerButtons({ audioRef, playing, togglePlay }) {
  const backwardBtn = useRef(null);
  const forwardBtn = useRef(null);

  const zoom = (btn) => {
    if (!btn) return;
    btn.classList.remove("animate-zoom");
    void btn.offsetWidth; // restart animation
    btn.classList.add("animate-zoom");
  };

  const seekRelative = useCallback(
    (sec) => {
      const audio = audioRef.current;
      if (!audio) return;
      audio.currentTime = Math.min(
        Math.max(0, audio.currentTime + sec),
        audio.duration
      );
      zoom(sec < 0 ? backwardBtn.current : forwardBtn.current);
    },
    [audioRef]
  );

  const baseBtn =
    "relative w-8 h-8 sm:w-10 sm:h-10 rounded hover:bg-gray-100 flex items-center justify-center";
  return (
    <div className="flex items-center gap-3">
      {/* ← 15 s */}
      <a
        ref={backwardBtn}
        aria-label={`Spola tillbaka ${JUMP_SEC} sekunder`}
        onClick={() => seekRelative(-JUMP_SEC)}
        className={BTN_BASE}
      >
        <FontAwesomeIcon icon={faRotateLeft} />
        <span className="absolute bottom-0.5 right-1 text-[0.6rem]">
          {JUMP_SEC}
        </span>
      </a>

      {/* play / pause (accent colour uses brand) */}
      <a
        aria-label={playing ? "Pausa" : "Spela"}
        onClick={togglePlay}
        className={`${BTN_BASE} bg-isof text-white hover:bg-isof/90`}
      >
        <FontAwesomeIcon icon={playing ? faPause : faPlay} />
      </a>

      {/* → 15 s */}
      <a
        ref={forwardBtn}
        aria-label={`Spola framåt ${JUMP_SEC} sekunder`}
        onClick={() => seekRelative(JUMP_SEC)}
        className={BTN_BASE}
      >
        <FontAwesomeIcon icon={faRotateRight} />
        <span className="absolute bottom-0.5 left-1 text-[0.6rem]">
          {JUMP_SEC}
        </span>
      </a>

      <SpeedSelector audioRef={audioRef} />
    </div>
  );
}

PlayerButtons.propTypes = {
  audioRef: PropTypes.object.isRequired,
  playing: PropTypes.bool.isRequired,
  togglePlay: PropTypes.func.isRequired,
};
