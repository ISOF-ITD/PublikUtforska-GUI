import { useEffect } from "react";

/**
 * Re-usable keyboard navigation for the editor
 */
export default function useEditorShortcuts({
  enabled,
  onSaveCurrent,
  onDiscard,
  onPrev,
  onNext,
}) {
  useEffect(() => {
    if (!enabled) return;
    const handler = (e) => {
      if (e.key === "Escape") onDiscard?.();
      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onSaveCurrent?.();
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        onPrev?.();
      }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        onNext?.();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [enabled, onSaveCurrent, onDiscard, onPrev, onNext]);
}
