import { useCallback, useEffect, useState } from "react";

export default function useSuggestionKeyboard({
  enabled,
  flatSuggestions,
  onPick,
  onClose,
}) {
  const [activeIdx, setActiveIdx] = useState(-1);

  useEffect(() => setActiveIdx(-1), [enabled, flatSuggestions.length]);

  const handleGlobalKey = useCallback(
    (e) => {
      if (!enabled) return;
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      if (flatSuggestions.length === 0) return;
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIdx((prev) =>
          e.key === "ArrowDown"
            ? (prev + 1) % flatSuggestions.length
            : (prev - 1 + flatSuggestions.length) % flatSuggestions.length
        );
      }
      if (e.key === "Enter" && activeIdx > -1) {
        e.preventDefault();
        const { group, ...item } = flatSuggestions[activeIdx];
        onPick(() => group.click(item));
      }
    },
    [enabled, flatSuggestions, activeIdx, onPick, onClose],
  );

  useEffect(() => {
    window.addEventListener("keydown", handleGlobalKey);
    return () => window.removeEventListener("keydown", handleGlobalKey);
  }, [handleGlobalKey]);

  return { activeIdx, setActiveIdx };
}
