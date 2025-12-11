import { useState, useMemo } from "react";
import { splitPages } from "../utils/splitPages";

export function useRecordHighlights({ highlightData, text, isPageByPage }) {
  const [highlight, setHighlight] = useState(true);

  const innerHits =
    highlightData?.data?.[0]?.inner_hits?.media?.hits?.hits ?? [];

  const highlightedMediaTexts = useMemo(() => {
    if (!isPageByPage) return {};
    return innerHits.reduce((acc, hit) => {
      const innerHitHighlightedText = hit?.highlight?.["media.text"]?.[0];
      const offset = `${hit?._nested?.offset}`;
      if (innerHitHighlightedText && offset) acc[offset] = innerHitHighlightedText;
      return acc;
    }, {});
  }, [isPageByPage, innerHits]);

  const pageByPageHitCount = useMemo(
    () =>
      innerHits.reduce((sum, h) => {
        const str = h?.highlight?.["media.text"]?.[0] || "";
        return sum + (str.match(/<em>/g) || []).length;
      }, 0),
    [innerHits]
  );

  const highlightedText = highlightData?.data?.[0]?.highlight?.text?.[0] || "";
  const highlightCount = useMemo(
    () => (highlightedText.match(/<em>/g) || []).length,
    [highlightedText]
  );

  const sourceText = useMemo(
    () => (highlight && highlightedText ? highlightedText : text),
    [highlight, highlightedText, text]
  );
  const textParts = useMemo(() => splitPages(sourceText), [sourceText]);

  const hasHighlights = isPageByPage
    ? innerHits.length > 0
    : Boolean(highlightedText);
  const totalHits = isPageByPage ? pageByPageHitCount : highlightCount;

  return {
    highlight,
    setHighlight,
    highlightedMediaTexts,
    hasHighlights,
    totalHits,
    textParts,
  };
}
