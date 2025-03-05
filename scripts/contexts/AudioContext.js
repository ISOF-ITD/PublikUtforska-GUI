import {
  createContext, useState, useRef, useMemo,
} from 'react';
import PropTypes from 'prop-types';
import config from '../config';

export const AudioContext = createContext();

export function AudioProvider({ children }) {
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [durationTime, setDurationTime] = useState(0);
  const [playerLabelText, setPlayerLabelText] = useState('');
  const [visible, setVisible] = useState(false);
  const [currentAudio, setCurrentAudio] = useState(null);
  const audioRef = useRef(new Audio());

  const playAudio = ({ record, audio, time = 0 }) => {
    const audioSrc = config.audioUrl + audio.source;
    audioRef.current.src = audioSrc; 
    audioRef.current.label = record.title;
    setPlayerLabelText(record.title);
  
    // Load the audio and jump to the requested start time
    audioRef.current.load();
    audioRef.current.currentTime = time;
    setCurrentTime(time);
    setPlaying(true);
    setVisible(true);
    
    // Include the 'time' value in currentAudio so we know which offset we’re playing
    setCurrentAudio({ record, audio, time });
  
    audioRef.current.play();
    window.eventBus.dispatch('audio.playervisible');
  };
  

  const togglePlay = () => {
    if (playing) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setPlaying(!playing);
  };

  // Vi använder useMemo för att skapa context-värdet endast när någon av dess beroenden ändras.
  // Detta förhindrar att ett nytt objekt skapas vid varje render, vilket minskar onödiga
  // omrenderingar i komponenter som konsumerar AudioContext och förbättrar prestandan.
  const contextValue = useMemo(() => ({
    audioRef,
    playing,
    setPlaying,
    togglePlay,
    currentTime,
    setCurrentTime,
    durationTime,
    setDurationTime,
    playAudio,
    playerLabelText,
    setPlayerLabelText,
    visible,
    setVisible,
    currentAudio,
    setCurrentAudio,
  }), [playing, currentTime, durationTime, playerLabelText, visible, currentAudio]);

  return (
    <AudioContext.Provider value={contextValue}>
      {children}
    </AudioContext.Provider>
  );
}

AudioProvider.propTypes = {
  children: PropTypes.node.isRequired,
};
