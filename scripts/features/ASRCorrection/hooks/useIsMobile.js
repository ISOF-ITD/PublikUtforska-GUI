import { useEffect, useState } from "react";

export default function useIsMobile(query = "(max-width:639px)") {
  const [mobile, setMobile] = useState(window.matchMedia(query).matches);

  useEffect(() => {
    const mq = window.matchMedia(query);
    const handler = (e) => setMobile(e.matches);
    (mq.addEventListener || mq.addListener).call(mq, "change", handler);
    return () =>
      (mq.removeEventListener || mq.removeListener).call(mq, "change", handler);
  }, [query]);

  return mobile;
}
