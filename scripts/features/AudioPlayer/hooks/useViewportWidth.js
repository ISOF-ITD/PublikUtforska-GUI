import { useEffect, useState } from "react";

/** Returns the current viewport width and updates on resize. */
export default function useViewportWidth() {
  const [vw, setVw] = useState(() => window.innerWidth);

  useEffect(() => {
    const onResize = () => setVw(window.innerWidth);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return vw;
}
