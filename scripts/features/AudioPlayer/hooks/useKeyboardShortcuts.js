import { useEffect, useCallback } from "react";

const KEY = {
  SPACE: "Space",
  LEFT: "ArrowLeft",
  RIGHT: "ArrowRight",
  DOWN: "BracketLeft",
  UP: "BracketRight",
  MUTE: "KeyM",
  ESC: "Escape",
};

/**
 * Global keyboard shortcuts for the audio player.
 * Accepts `audioRef`, `togglePlay` and an optional `onEscape` callback.
 */
export default function useKeyboardShortcuts(
  audioRef,
  togglePlay,
  onEscape = () => {}
) {
  const handler = useCallback(
    (e) => {
      if (e.target.tagName === "INPUT") return;
      const audio = audioRef.current;
      if (!audio) return;

      switch (e.code) {
        case KEY.SPACE:
          e.preventDefault();
          togglePlay();
          break;
        case KEY.LEFT:
          audio.currentTime = Math.max(0, audio.currentTime - 5);
          break;
        case KEY.RIGHT:
          audio.currentTime = Math.min(audio.duration, audio.currentTime + 5);
          break;
        case KEY.DOWN:
          audio.playbackRate = Math.max(0.5, audio.playbackRate - 0.1);
          break;
        case KEY.UP:
          audio.playbackRate = Math.min(2, audio.playbackRate + 0.1);
          break;
        case KEY.MUTE:
          audio.muted = !audio.muted;
          break;
        case KEY.ESC:
          onEscape();
          break;
        default:
      }
    },
    [audioRef, togglePlay, onEscape]
  );

  useEffect(() => {
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handler]);
}
