import { useCallback } from "react";

/**
 * Scroll the element referenced by `targetRef` – or the window as a fallback.
 */
export default function ScrollTopButton({ targetRef = null }) {
  const handleClick = useCallback(() => {
    const el = targetRef?.current;
    if (el && typeof el.scrollTo === "function") {
      el.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [targetRef]);

  return (
    <button
      onClick={handleClick}
      className="fixed bottom-4 right-4 sm:hidden rounded-full p-3 bg-isof
                 text-white shadow-lg z-[9999]"
    >
      ↑
    </button>
  );
}
