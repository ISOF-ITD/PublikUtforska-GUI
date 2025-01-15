import PropTypes from 'prop-types';
import React, { useState } from 'react';

/* dropdown-lista med select och option för att ändra hastigheten */

function SpeedSelector({ audioRef }) {
  const [speed, setSpeed] = useState(1);

  const speedOptions = [
    0.5,
    0.8,
    1,
    1.2,
    1.4,
    1.6,
    1.8,
    2,
  ];

  const speedChangeHandler = (e) => {
    const audio = audioRef.current;
    const newSpeed = parseFloat(e.target.value); // Parse to number
    audio.playbackRate = newSpeed;
    setSpeed(newSpeed);
  };

  return (
    <div className="speed-selector">
      <select
        id="playback-speed"
        name="playback-speed"
        className="speed-buttons"
        value={speed}
        onChange={speedChangeHandler}
      >
        {speedOptions.map((option) => (
          <option key={option} value={option}>
            {option.toLocaleString('sv-SE')}
            x
          </option>
        ))}
      </select>
    </div>
  );
}

SpeedSelector.propTypes = {
  audioRef: PropTypes.object.isRequired,
};

export default SpeedSelector;
