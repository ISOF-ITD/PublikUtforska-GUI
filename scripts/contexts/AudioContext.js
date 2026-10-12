import {
  createContext, useCallback, useEffect, useMemo, useRef, useState,
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
  const [queue, setQueue] = useState([]);
  const [autoAdvance, setAutoAdvanceState] = useState(false);
  const [playbackRate, setPlaybackRateState] = useState(1);
  const [playbackError, setPlaybackError] = useState('');
  const [playbackStatus, setPlaybackStatus] = useState('');
  const [player, setPlayer] = useState(() => new Audio());
  const audioRef = useRef(player);
  // Event handlers and pending play promises must see the latest user intent.
  const session = useRef({
    audio: null, queue: [], autoAdvance: false, wantsPlay: false, request: 0,
  });

  const setAutoAdvance = useCallback((value) => {
    session.current.autoAdvance = Boolean(value);
    setAutoAdvanceState(Boolean(value));
  }, []);

  const setPlaybackRate = useCallback((value) => {
    audioRef.current.defaultPlaybackRate = value;
    audioRef.current.playbackRate = value;
    setPlaybackRateState(value);
  }, []);

  const reportError = useCallback((failedPlayer, request) => {
    if (audioRef.current !== failedPlayer || session.current.request !== request) return;
    session.current.wantsPlay = false;
    session.current.request += 1;
    failedPlayer.pause();
    setPlaying(false);
    setPlaybackError('Inspelningen kunde inte spelas upp. Välj en annan inspelning eller försök igen.');
  }, []);

  const startPlayback = useCallback(() => {
    const activePlayer = audioRef.current;
    const { request } = session.current;
    setPlaybackError('');
    activePlayer.play().catch(() => reportError(activePlayer, request));
  }, [reportError]);

  const selectAudio = useCallback(({
    record, audio, time = 0, queue: suppliedQueue, shouldPlay = true,
  }) => {
    const previous = session.current.audio;
    const sameRecord = previous && String(previous.record.id) === String(record.id);
    const previousQueue = sameRecord ? session.current.queue : [];
    let nextQueue = suppliedQueue?.some((entry) => entry.audio.source === audio.source)
      ? suppliedQueue : previousQueue;
    if (!nextQueue.some((entry) => entry.audio.source === audio.source)) {
      nextQueue = [{ audio, title: record.title || audio.title || 'Inspelning' }];
    }
    const index = nextQueue.findIndex((entry) => entry.audio.source === audio.source);
    const entry = nextQueue[index];
    const nextAudio = { record: { ...record, title: entry.title }, audio: entry.audio, time };
    const fileChanged = !sameRecord || previous.audio.source !== audio.source;
    if (!sameRecord) setAutoAdvance(false);

    let activePlayer = audioRef.current;
    if (fileChanged && activePlayer.src) {
      const previousPlayer = activePlayer;
      activePlayer = new Audio();
      activePlayer.defaultPlaybackRate = previousPlayer.playbackRate;
      activePlayer.playbackRate = previousPlayer.playbackRate;
      // A separate media element prevents late events from the old file affecting the new one.
      audioRef.current = activePlayer;
      setPlayer(activePlayer);
      previousPlayer.pause();
    }
    session.current.request += 1;
    session.current.audio = nextAudio;
    session.current.queue = nextQueue;
    session.current.wantsPlay = shouldPlay;
    setQueue(nextQueue);
    setCurrentAudio(nextAudio);
    setPlayerLabelText(entry.title);
    setCurrentTime(time * 1000);
    setPlaybackError('');
    setPlaying(shouldPlay);
    setVisible(true);

    if (fileChanged) {
      setDurationTime(0);
      setPlaybackStatus(nextQueue.length > 1
        ? `Inspelning ${index + 1} av ${nextQueue.length}: ${entry.title}` : entry.title);
      activePlayer.src = config.audioUrl + audio.source;
      activePlayer.load();
      activePlayer.playbackRate = activePlayer.defaultPlaybackRate;
    }
    activePlayer.currentTime = time;
    if (shouldPlay) startPlayback();
    window.eventBus.dispatch('audio.playervisible');
  }, [setAutoAdvance, startPlayback]);

  const playAudio = useCallback((selection) => selectAudio(selection), [selectAudio]);

  const moveAudio = useCallback((direction) => {
    const state = session.current;
    const index = state.queue.findIndex((entry) => (
      entry.audio.source === state.audio?.audio.source
    ));
    const next = state.queue[index + direction];
    if (index < 0 || !next) return;
    selectAudio({
      record: state.audio.record,
      audio: next.audio,
      queue: state.queue,
      shouldPlay: state.wantsPlay,
    });
  }, [selectAudio]);

  const playPrevious = useCallback(() => moveAudio(-1), [moveAudio]);
  const playNext = useCallback(() => moveAudio(1), [moveAudio]);

  const togglePlay = useCallback(() => {
    if (!session.current.audio) return;
    session.current.request += 1;
    session.current.wantsPlay = !session.current.wantsPlay;
    setPlaying(session.current.wantsPlay);
    if (session.current.wantsPlay) startPlayback();
    else audioRef.current.pause();
  }, [startPlayback]);

  const closeAudio = useCallback(() => {
    session.current.request += 1;
    session.current.wantsPlay = false;
    session.current.audio = null;
    session.current.queue = [];
    audioRef.current.pause();
    setPlaying(false);
    setVisible(false);
    setCurrentTime(0);
    setDurationTime(0);
    setCurrentAudio(null);
    setQueue([]);
    setAutoAdvance(false);
    setPlaybackError('');
    setPlaybackStatus('');
    window.eventBus.dispatch('audio.playerhidden');
  }, [setAutoAdvance]);

  useEffect(() => {
    const isCurrent = () => audioRef.current === player && session.current.audio;
    const onPlay = () => {
      if (!isCurrent()) return;
      if (!session.current.wantsPlay) player.pause();
      else setPlaying(true);
    };
    const onPause = () => {
      if (!isCurrent()) return;
      setPlaying(false);
      // A natural ending fires pause before ended; retain intent until ended handles the queue.
      if (!player.ended) {
        session.current.wantsPlay = false;
        session.current.request += 1;
      }
    };
    const onLoaded = () => {
      if (isCurrent()) {
        setDurationTime(Number.isFinite(player.duration) ? player.duration * 1000 : 0);
      }
    };
    const onTime = () => {
      if (isCurrent()) setCurrentTime(player.currentTime * 1000);
    };
    const onEnded = () => {
      if (!isCurrent() || !player.ended || !session.current.wantsPlay) return;
      const state = session.current;
      const index = state.queue.findIndex((entry) => (
        entry.audio.source === state.audio.audio.source
      ));
      if (state.autoAdvance && state.queue[index + 1]) playNext();
      else {
        state.wantsPlay = false;
        state.request += 1;
        setPlaying(false);
      }
    };
    const onError = () => {
      if (isCurrent()) reportError(player, session.current.request);
    };
    const handlers = {
      play: onPlay,
      pause: onPause,
      loadedmetadata: onLoaded,
      timeupdate: onTime,
      ended: onEnded,
      error: onError,
    };
    Object.entries(handlers).forEach(([event, handler]) => player.addEventListener(event, handler));
    return () => {
      Object.entries(handlers).forEach(([event, handler]) => (
        player.removeEventListener(event, handler)
      ));
      if (audioRef.current === player) {
        session.current.wantsPlay = false;
        session.current.request += 1;
        player.pause();
      }
    };
  }, [player, playNext, reportError]);

  const currentIndex = queue.findIndex((entry) => (
    entry.audio.source === currentAudio?.audio.source
  ));
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
    queue,
    currentIndex,
    playPrevious,
    playNext,
    autoAdvance,
    setAutoAdvance,
    playbackRate,
    setPlaybackRate,
    closeAudio,
    playbackError,
    playbackStatus,
  }), [
    playing, togglePlay, currentTime, durationTime, playAudio, playerLabelText,
    visible, currentAudio, queue, currentIndex, playPrevious, playNext,
    autoAdvance, setAutoAdvance, playbackRate, setPlaybackRate,
    closeAudio, playbackError, playbackStatus,
  ]);

  return <AudioContext.Provider value={contextValue}>{children}</AudioContext.Provider>;
}

AudioProvider.propTypes = { children: PropTypes.node.isRequired };
