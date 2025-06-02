import { forwardRef, useCallback, useEffect, useMemo, useRef } from "react";
import { VariableSizeList as List } from "react-window";
import { ReadOnlyUtteranceRow, default as UtteranceRow } from "./UtteranceRow";
import useIsMobile from "../hooks/useIsMobile";

const BASE_ROW = 52;
const EXTRA_LINE = 22;
const AVG_CHARS_PER_LINE = 95;

/* --- custom outer element that adds mobile spacing --- */
const MobileOuter = forwardRef(function MobileOuter(props, ref) {
  return <div ref={ref} className="space-y-3 px-2" {...props} />;
});

export default function UtterancesList({
  rows,
  editingId,
  editedText,
  listData: baseData,
  getActiveIndex,
  followActive,
  readOnly,
  activeId,
}) {
  const listRef = useRef(null);
  const isMobile = useIsMobile();
  const scrollingByUser = useRef(false);

  /* --- height calculator for react-window --- */
  // 1. keep an up-to-date map with the real heights
  const sizeMap = useRef({}); // { [index]: px }

  const setSize = useCallback((index, size) => {
    if (sizeMap.current[index] !== size) {
      sizeMap.current[index] = size;
      listRef.current?.resetAfterIndex(index); // tells react-window to re-layout
    }
  }, []);

  // 2. let VariableSizeList ask that map
  const getItemSize = useCallback(
    (i) => sizeMap.current[i] ?? BASE_ROW, // fall back to base height the first time
    []
  );

  /* --- auto-scroll when active row changes --- */
  useEffect(() => {
    if (!followActive || !activeId || !listRef.current) return;
    const idx = rows.findIndex((u) => u.id === activeId);
    if (idx >= 0) listRef.current.scrollToItem(idx, "center");
  }, [activeId, followActive, rows]);

  useEffect(() => {
    if (!isMobile || !followActive) return;
    const el = document.querySelector(`[data-utt="${activeId}"]`);
    if (el) {
      el.scrollIntoView({ behaviour: "smooth", block: "center" });
    }
  }, [activeId, followActive, isMobile]);

  /* --- keep row heights in sync when rows change (search / filter) --- */
  useEffect(() => {
    if (!listRef.current) return;
    // Re-measure from row 0 – cheaper because it only recalculates sizes,
    // it doesn’t re-render invisible rows.
    listRef.current.resetAfterIndex(0, /* shouldForceUpdate */ false);
  }, [rows.length, editingId, editedText]);

  /* — stop auto-follow when the user manually scrolls — */
  useEffect(() => {
    const el = listRef.current?._outerRef; // react-window outer div
    if (!el) return;
    const stop = () => {
      scrollingByUser.current = true;
      setTimeout(() => (scrollingByUser.current = false), 1500); // debounce
    };
    el.addEventListener("wheel", stop, { passive: true });
    el.addEventListener("touchstart", stop, { passive: true });
    return () => {
      el.removeEventListener("wheel", stop);
      el.removeEventListener("touchstart", stop);
    };
  }, []);

  useEffect(() => {
    if (scrollingByUser.current) return; // user overrules auto scroll
    if (!followActive || !activeId || !listRef.current) return;
    const idx = rows.findIndex((u) => u.id === activeId);
    if (idx >= 0) listRef.current.scrollToItem(idx, "center");
  }, [activeId]);

  const itemData = useMemo(
    () => ({ ...baseData, setSize }),
    [baseData, setSize]
  );

  /* --- always virtualised --- */
  return (
    <List
      ref={listRef}
      height={isMobile ? window.innerHeight * 0.75 : 600}
      itemCount={rows.length}
      itemSize={getItemSize}
      itemKey={(index) => rows[index].id}
      itemData={itemData}
      width="100%"
      outerElementType={isMobile ? MobileOuter : undefined}
    >
      {readOnly ? ReadOnlyUtteranceRow : UtteranceRow}
    </List>
  );
}
