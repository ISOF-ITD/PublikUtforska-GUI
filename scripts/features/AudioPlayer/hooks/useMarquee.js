import { useEffect, useRef } from "react";

/**
 * Adds/updates a marquee animation whenever the label text or viewport width changes.
 * Returns the two refs you need to attach to the container and text span.
 */
export default function useMarquee(deps = []) {
  const labelRef = useRef(null);
  const textRef = useRef(null);

  useEffect(() => {
    const label = labelRef.current;
    const txt = textRef.current;
    if (!label || !txt) return;

    const needsScroll = txt.scrollWidth > label.clientWidth;

    // Reset
    txt.style.animation = "none";
    label.classList.remove("marquee-mask", "line-clamp-2");
    // Force reflow
    void txt.offsetWidth;

    if (needsScroll) {
      const duration = (txt.scrollWidth + label.clientWidth) / 50; // 50 px/s
      txt.style.setProperty(
        "--marquee-container-width",
        `${label.clientWidth}px`
      );
      txt.style.animation = `marquee-run ${duration}s linear infinite`;
      label.classList.add("marquee-mask");
    } else {
      label.classList.add("line-clamp-2");
    }
  }, deps); // eslint-disable-line react-hooks/exhaustive-deps

  return [labelRef, textRef];
}
