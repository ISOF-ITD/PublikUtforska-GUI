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
    <div className="flex items-center gap-2 sm:gap-3">
      {/* ← 15 s */}
      <a
        ref={backwardBtn}
        aria-label={`Spola tillbaka ${JUMP_SEC} sekunder`}
        onClick={() => seekRelative(-JUMP_SEC)}
        className={`${baseBtn} text-gray-700`}
      >
        <FontAwesomeIcon icon={faRotateLeft} />
        <span className="absolute text-[0.6rem] -bottom-1">{JUMP_SEC}</span>
      </a>

      {/* play / pause */}
      <a
        aria-label="Spela"
        onClick={togglePlay}
        className={`${baseBtn} bg-isof text-white`}
      >
        <FontAwesomeIcon icon={playing ? faPause : faPlay} />
      </a>

      {/* → 15 s */}
      <a
        ref={forwardBtn}
        aria-label={`Spola framåt ${JUMP_SEC} sekunder`}
        onClick={() => seekRelative(JUMP_SEC)}
        className={`${baseBtn} text-gray-700`}
      >
        <FontAwesomeIcon icon={faRotateRight} />
        <span className="absolute text-[0.6rem] -bottom-1">{JUMP_SEC}</span>
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
