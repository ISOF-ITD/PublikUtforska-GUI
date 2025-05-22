import PropTypes from "prop-types";
import React, { useState } from "react";

const SPEEDS = [0.5, 0.8, 1, 1.2, 1.4, 1.6, 1.8, 2];

export default function SpeedSelector({ audioRef }) {
  const [speed, setSpeed] = useState(1);
  const change = (e) => {
    const s = +e.target.value;
    audioRef.current.playbackRate = s;
    setSpeed(s);
  };

  return (
    <select
      value={speed}
      onChange={change}
      aria-label="Uppspelningshastighet"
      className="h-8 w-16 rounded border-gray-300 text-xs font-medium
                 focus-visible:ring-2 focus-visible:ring-isof"
    >
      {SPEEDS.map((s) => (
        <option key={s} value={s}>
          {s.toLocaleString("sv-SE")}x
        </option>
      ))}
    </select>
  );
}

SpeedSelector.propTypes = {
  audioRef: PropTypes.object.isRequired,
};
