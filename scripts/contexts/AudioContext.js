import { createContext, useState, useRef } from 'react';
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

  const playAudio = ({ record, audio }) => {
    const audioSrc = config.audioUrl + audio.source;
    audioRef.current.src = audioSrc;
    audioRef.current.label = record.title;
    setPlayerLabelText(record.title);
    audioRef.current.load();
    setPlaying(true);
    setVisible(true);
    setCurrentAudio({ record, audio });
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

  return (
    <AudioContext.Provider value={{
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
    }}
    >
      {children}
    </AudioContext.Provider>
  );
}

AudioProvider.propTypes = {
  children: PropTypes.node.isRequired,
};
