/* eslint-disable react/require-default-props */
import React, { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import noUiSlider from 'nouislider';

export default function Slider({
  behaviour, start, currentTime = null, playing, rangeMin, rangeMax, onChange,
}) {
  // create a ref to the slider DOM node
  const sliderRef = useRef(null);

  // every time the range, behaviour or start changes, we need to recreate the slider
  useEffect(() => {
    const slider = noUiSlider.create(sliderRef.current, {
      start,
      behaviour,
      range: {
        min: [0],
        max: [rangeMax],
      },
    });

    // listen to slider events
    slider.on('slide', (values, handle) => {
      if (handle === 0) {
        onChange(values[handle]);
      }
    });

    return () => slider.destroy(); // Clean up the slider on component unmount
  }, [rangeMin, rangeMax, behaviour, start]);

  useEffect(() => {
    if (sliderRef.current && sliderRef.current.noUiSlider) {
      sliderRef.current.noUiSlider.set(currentTime);
    }
  }, [playing]);

  return (
    <div className="audio-seek-slider">
      <div className="slider-container" ref={sliderRef} />
    </div>
  );
}

Slider.propTypes = {
  behaviour: PropTypes.string.isRequired,
  start: PropTypes.number.isRequired,
  currentTime: PropTypes.number,
  playing: PropTypes.bool.isRequired,
  rangeMin: PropTypes.number.isRequired,
  rangeMax: PropTypes.number.isRequired,
  onChange: PropTypes.func.isRequired,
};