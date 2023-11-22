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
    audio.playbackRate = e.target.value;
    setSpeed(e.target.value);
  };

  return (
    <select
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
  );
}

SpeedSelector.propTypes = {
  audioRef: PropTypes.object.isRequired,
};

export default SpeedSelector;
