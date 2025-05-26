import { useRef } from "react";

/** Adds touch-swipe (±15 s) behaviour. Returns handlers for `onTouchStart`/`onTouchEnd`. */
export default function useSwipeSeek(audioRef) {
  const swipe = useRef({ x: null, t: 0 });

  const onTouchStart = (e) => {
    swipe.current = { x: e.touches[0].clientX, t: Date.now() };
  };

  const onTouchEnd = (e) => {
    const startX = swipe.current.x;
    if (startX == null) return;
    const dx = e.changedTouches[0].clientX - startX;
    const dt = Date.now() - swipe.current.t;

    if (dt < 400 && Math.abs(dx) > 60) {
      const audio = audioRef.current;
      if (!audio) return;
      const jump = dx > 0 ? 15 : -15;
      audio.currentTime = Math.min(
        Math.max(0, audio.currentTime + jump),
        audio.duration
      );
    }
  };

  return { onTouchStart, onTouchEnd };
}
