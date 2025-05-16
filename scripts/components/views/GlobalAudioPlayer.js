import React, { useEffect, useState } from 'react';
import Slider from '../Slider';
import PlayerButtons from './PlayerButtons';
import { AudioContext } from '../../contexts/AudioContext';

export default function GlobalAudioPlayer() {
  const [viewportWidth, setViewportWidth] = useState(window.innerWidth);
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
  } = React.useContext(AudioContext);

  const msToTimeStr = (ms) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${(minutes < 10 ? '0' : '') + minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  // once after first render
  useEffect(() => {
      const handleResize = () => setViewportWidth(window.innerWidth);
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
  }, []);

  // every time playerLabelText or viewportWidth changes
  useEffect(() => {
    // den här effekten körs när playerLabelText ändras eller viewportWidth ändras
    // kolla om .player-label är mindre än .player-label-text
    const playerLabelEl = document.querySelector('.player-label');
    const playerLabelTextEl = document.querySelector('.player-label-text');
    if (playerLabelEl && playerLabelTextEl) {
      if (playerLabelTextEl.offsetWidth > playerLabelEl.offsetWidth) {
        // lägg till class för att få texten att scrolla
        playerLabelTextEl.classList.add('animate');
        // playerLabelTextEl.classList.add(playerLabelTextEl.offsetWidth);
        // playerLabelTextEl.classList.add(playerLabelEl.offsetWidth);
        // anpassa animationshastigheten till textlängden i
        // förhållande till bredden på .player-label
        const difference = playerLabelTextEl.offsetWidth - playerLabelEl.offsetWidth;
        const animationDuration = difference / 10;
        playerLabelTextEl.style.animationDuration = `${animationDuration}s`;
      } else {
        // ta bort class för att få texten att scrolla
        playerLabelTextEl.classList.remove('animate');
      }
    }
  }, [playerLabelText, viewportWidth]);

  // once after first render
  useEffect(() => {
    const audio = audioRef.current;

    const setAudioData = () => {
      setDurationTime(audio.duration * 1000);
      setCurrentTime(audio.currentTime * 1000);
    };

    const setAudioTime = () => {
      setCurrentTime(audio.currentTime * 1000);
    };

    // these events are fired from the audio element
    // API: https://developer.mozilla.org/en-US/docs/Web/API/HTMLAudioElement
    // and https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement
    audio.addEventListener('loadedmetadata', setAudioData);
    audio.addEventListener("timeupdate", () => {
      setCurrentTime(audio.currentTime * 1000);
      // Broadcast current time in seconds
      window.dispatchEvent(
        new CustomEvent("audio.time", { detail: { pos: audio.currentTime } })
      );
    });

    return () => {
      audio.removeEventListener('loadedmetadata', setAudioData);
      audio.removeEventListener('timeupdate', setAudioTime);
    };
  }, []);

  const durationSliderChangeHandler = (_value) => {
    const audio = audioRef.current;
    const value = parseInt(_value, 10);
    audio.currentTime = value / 1000;
    setCurrentTime(value);
  };

  return (
    <div className={`global-audio-player-wrapper${visible ? ' visible' : ''}`}>
      <div className="global-audio-player">

        <PlayerButtons
          audioRef={audioRef}
          playing={playing}
          togglePlay={togglePlay}
        />
        <div className="player-time">
          {msToTimeStr(currentTime)}
          <div className="duration">{msToTimeStr(durationTime)}</div>
        </div>

        <div className="player-content">
          {/* Your player content here */}
          <div className="player-label">
            <div className="player-label-text">
              {audioRef.current && audioRef.current.label}
            </div>
          </div>
          <Slider
            behaviour="tap-drag"
            start={currentTime}
            playing={playing}
            rangeMin={0}
            // currentTime={currentTime}
            rangeMax={durationTime || 1}
            onChange={durationSliderChangeHandler}
          />
        </div>

      </div>
      {/* add a button close the player */}
      <button
        className="close-button"
        onClick={() => {
          const audio = audioRef.current;
          audio.pause();
          setPlaying(false);
          setVisible(false);
          setCurrentTime(0);
          setCurrentAudio(null);
          // send audioplayer.invisible event
          window.eventBus.dispatch('audio.playerhidden');
        }}
        aria-label="Stäng"
        type="button"
      />

    </div>
  );
}
