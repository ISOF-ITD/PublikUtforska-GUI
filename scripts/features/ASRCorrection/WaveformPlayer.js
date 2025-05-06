import React, {
  forwardRef,
  useContext,
  useEffect,
  useImperativeHandle,
  useRef,
} from "react";
import WaveSurfer from "wavesurfer.js";
import { AudioContext } from "../../contexts/AudioContext";
import config from "../../config";

/**
 * A thin wrapper around WaveSurfer that:
 *   • Re‑uses the shared <audio> element from AudioContext (so GlobalAudioPlayer still works)
 *   • Exposes playSegment(start, end) & seek(time) to parents via ref
 */
const WaveformPlayer = forwardRef(function WaveformPlayer(
  { src, peaks = null, height = 96 },
  ref
) {
  const containerRef = useRef(null);
  const ws = useRef(null);
  const { audioRef, setPlaying, setCurrentTime, setDurationTime } =
    useContext(AudioContext);

  // create / destroy WaveSurfer
  useEffect(() => {
    if (!containerRef.current) return;

    /* ---------- WaveSurfer ---------- */
    ws.current = WaveSurfer.create({
      container: containerRef.current,
      height,
      backend: "MediaElement",
      media: audioRef.current,
      waveColor: "#E5E7EB",
      progressColor: "#2563EB",
      barGap: 2,
      barWidth: 2,
      responsive: true,
      peaks,
    });

    /* ---------- keep AudioContext in sync ---------- */
    ws.current.on("play", () => setPlaying(true));
    ws.current.on("pause", () => setPlaying(false));
    ws.current.on("timeupdate", (t) => setCurrentTime(t * 1000));
    ws.current.on("ready", () =>
      setDurationTime(ws.current.getDuration() * 1000)
    );

    return () => ws.current && ws.current.destroy();
  }, [src]);

  // expose imperative helpers to parent
  useImperativeHandle(ref, () => ({
    playSegment: (start, end) => {
      if (!ws.current) return;
      ws.current.play(start, end); // WaveSurfer supports start‑end playback
    },
    seek: (time) => {
      if (!ws.current) return;
      ws.current.seekTo(time / ws.current.getDuration());
    },
  }));

  return <div ref={containerRef} className="w-full select-none" />;
});

export default WaveformPlayer;
