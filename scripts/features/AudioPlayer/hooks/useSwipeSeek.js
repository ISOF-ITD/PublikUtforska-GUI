import { useRef } from 'react';

/** Adds touch-swipe (±15 s) behaviour. Returns handlers for `onTouchStart`/`onTouchEnd`. */
export default function useSwipeSeek(audioRef) {
  const swipe = useRef(null);

  const onTouchStart = (e) => {
    swipe.current = null;
    if (e.touches.length !== 1 || e.target.closest('button, input, select, a')) return;
    swipe.current = { x: e.touches[0].clientX, y: e.touches[0].clientY, t: Date.now() };
  };

  const onTouchEnd = (e) => {
    const start = swipe.current;
    swipe.current = null;
    if (!start || !e.changedTouches.length) return;
    const dx = e.changedTouches[0].clientX - start.x;
    const dy = e.changedTouches[0].clientY - start.y;
    const dt = Date.now() - start.t;

    if (dt < 400 && Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy)) {
      const audio = audioRef.current;
      if (!audio) return;
      const jump = dx > 0 ? 15 : -15;
      audio.currentTime = Math.min(
        Math.max(0, audio.currentTime + jump),
        audio.duration,
      );
    }
  };

  const onTouchCancel = () => { swipe.current = null; };
  return { onTouchStart, onTouchEnd, onTouchCancel };
}
