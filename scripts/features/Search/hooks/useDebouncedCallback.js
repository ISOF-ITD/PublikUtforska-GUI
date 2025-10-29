import { useCallback, useEffect, useRef } from "react";

export default function useDebouncedCallback(fn, delay = 300) {
  const timer = useRef();

  useEffect(() => () => clearTimeout(timer.current), []);

  return useCallback(
    (...args) => {
      clearTimeout(timer.current);
      timer.current = setTimeout(() => fn(...args), delay);
    },
    [delay, fn]
  );
}
