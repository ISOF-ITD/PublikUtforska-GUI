import { useEffect, useState } from 'react';

const DEFAULT_QUERY = '(min-width: 768px)';

const getMatches = (query) => {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return true;
  }
  return window.matchMedia(query).matches;
};

export default function useTranscriptionAvailability(query = DEFAULT_QUERY) {
  const [isAvailable, setIsAvailable] = useState(() => getMatches(query));

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return undefined;
    }

    const mediaQueryList = window.matchMedia(query);
    const handleChange = (event) => setIsAvailable(event.matches);

    setIsAvailable(mediaQueryList.matches);
    if (typeof mediaQueryList.addEventListener === 'function') {
      mediaQueryList.addEventListener('change', handleChange);
      return () => mediaQueryList.removeEventListener('change', handleChange);
    }

    mediaQueryList.addListener(handleChange);
    return () => mediaQueryList.removeListener(handleChange);
  }, [query]);

  return isAvailable;
}
