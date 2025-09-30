import { createContext, useState, useRef, useMemo, useEffect } from "react";
import PropTypes from "prop-types";
import config from "../config";

export const AudioContext = createContext();

export function AudioProvider({ children }) {
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [durationTime, setDurationTime] = useState(0);
  const [playerLabelText, setPlayerLabelText] = useState("");
  const [visible, setVisible] = useState(false);
  const [currentAudio, setCurrentAudio] = useState(null);
  const [activeSegmentId, setActiveSegmentId] = useState(null);
  const audioRef = useRef(new Audio());

  const playAudio = ({ record, audio, time = 0 }) => {
    const player = audioRef.current;
    const audioSrc = config.audioUrl + audio.source;

    // already on this file? just seek & play
    if (player.src === audioSrc) {
      player.currentTime = time;
      player.play().catch(() => {
        /* swallow AbortError */
      });
      setPlaying(true);
      setVisible(true);
      setCurrentAudio({ record, audio, time });
      return;
    }

    // new file — reload normally
    player.pause();

    player.src = audioSrc;
    player.label = record.title;
    setPlayerLabelText(record.title);

    player.load();
    player.currentTime = time;

    setCurrentTime(time * 1000);
    setPlaying(true);
    setVisible(true);
    setCurrentAudio({ record, audio, time });

    player.play().catch(() => {
      /* swallow AbortError */
    });
    window.eventBus.dispatch("audio.playervisible");
  };

  const togglePlay = () => {
    if (playing) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setPlaying(!playing);
  };

  /* ─────────────────  <audio> ⇒ Context Sync  ───────────────── */
  useEffect(() => {
    const player = audioRef.current;
    if (!player) return;

    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onLoaded = () => setDurationTime(player.duration * 1000);
    const parseTimeString = (time = 0) => {
      if (typeof time === "number" && Number.isFinite(time)) return time;
      if (typeof time !== "string") return NaN;
      const parts = time.split(":").map(Number).reverse();
      if (parts.some((n) => Number.isNaN(n))) return NaN;
      let s = 0;
      if (parts[0]) s += parts[0]; // seconds
      if (parts[1]) s += parts[1] * 60; // minutes
      if (parts[2]) s += parts[2] * 3600; // hours
      return s;
    };

    const normalizeSegments = (raw) => {
      if (!raw) return [];
      let arr = Array.isArray(raw)
        ? raw
        : typeof raw === "object"
        ? Object.values(raw)
        : [];
      return arr
        .map((u) => ({
          ...u,
          start: parseTimeString(u.start),
          end: parseTimeString(u.end),
        }))
        .filter((u) => Number.isFinite(u.start) && Number.isFinite(u.end));
    };

    const onTime = () => {
      const pos = audioRef.current.currentTime; // seconds (float)
      setCurrentTime(pos * 1000);

      // Update active segment safely
      const segs = normalizeSegments(currentAudio?.audio?.utterances);
      const active = segs.find((u) => pos >= u.start && pos < u.end);
      setActiveSegmentId(active?.id ?? null);
    };

    player.addEventListener("play", onPlay);
    player.addEventListener("pause", onPause);
    player.addEventListener("loadedmetadata", onLoaded);
    player.addEventListener("timeupdate", onTime);
    return () => {
      player.removeEventListener("play", onPlay);
      player.removeEventListener("pause", onPause);
      player.removeEventListener("loadedmetadata", onLoaded);
      player.removeEventListener("timeupdate", onTime);
    };
  }, [audioRef, currentAudio]);

  // Vi använder useMemo för att skapa context-värdet endast när någon av dess beroenden ändras.
  // Detta förhindrar att ett nytt objekt skapas vid varje render, vilket minskar onödiga
  // omrenderingar i komponenter som konsumerar AudioContext och förbättrar prestandan.
  const contextValue = useMemo(
    () => ({
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
      activeSegmentId,
      setActiveSegmentId,
    }),
    [
      playing,
      currentTime,
      durationTime,
      playerLabelText,
      visible,
      currentAudio,
      activeSegmentId,
    ]
  );

  return (
    <AudioContext.Provider value={contextValue}>
      {children}
    </AudioContext.Provider>
  );
}

AudioProvider.propTypes = {
  children: PropTypes.node.isRequired,
};
