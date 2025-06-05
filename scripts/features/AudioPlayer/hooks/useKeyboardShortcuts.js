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
export default function useKeyboardShortcuts(audioRef) {
  const handler = useCallback(
    (e) => {
      if (e.target.tagName === "INPUT") return;
      const audio = audioRef.current;
      if (!audio) return;

      switch (e.code) {
        case KEY.LEFT:
          audio.currentTime = Math.max(0, audio.currentTime - 5);
          break;
        case KEY.RIGHT:
          audio.currentTime = Math.min(audio.duration, audio.currentTime + 5);
          break;
        case KEY.MUTE:
          audio.muted = !audio.muted;
          break;
        default:
      }
    },
    [audioRef]
  );

  useEffect(() => {
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handler]);
}
