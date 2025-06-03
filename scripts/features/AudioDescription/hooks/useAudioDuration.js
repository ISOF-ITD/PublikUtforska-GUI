import { useState, useEffect } from "react";

/**
 * Persistent in-memory cache so we never fetch the same
 * metadata twice during the user’s session.
 */
const cache = new Map();

export default function useAudioDuration(src) {
  // Instant answer if we’ve already seen this URL:
  const [duration, setDuration] = useState(() => cache.get(src) ?? null);

  useEffect(() => {
    if (!src || cache.has(src)) return; // nothing to do

    const audio = new Audio();
    audio.preload = "metadata";
    audio.src = src;

    const handleLoaded = () => {
      if (Number.isFinite(audio.duration)) {
        cache.set(src, audio.duration); // memoise
        setDuration(audio.duration);
      }
    };

    audio.addEventListener("loadedmetadata", handleLoaded);
    return () => {
      audio.removeEventListener("loadedmetadata", handleLoaded);
      audio.src = ""; // tidy up
    };
  }, [src]);

  return duration; // null ➜ still loading
}
