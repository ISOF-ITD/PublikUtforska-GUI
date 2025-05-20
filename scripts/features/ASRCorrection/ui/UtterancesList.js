import React, { useRef } from "react";
import { VariableSizeList as List } from "react-window";
import UtteranceRow from "./UtteranceRow";
import useIsMobile from "../hooks/useIsMobile";

const BASE_ROW = 76;
const EXTRA_LINE = 22;

export default function UtterancesList({
  rows,
  editingId,
  editedText,
  listData,
  getActiveIndex,
  followActive,
  readOnly,
}) {
  const listRef = useRef(null);
  const isMobile = useIsMobile();

  /* --- height calculator for react-window --- */
  const getItemSize = (i) => {
    const u = rows[i];
    if (u.id === editingId) {
      const lines = Math.max(2, editedText.split("\n").length);
      return BASE_ROW + (lines - 2) * EXTRA_LINE;
    }
    return BASE_ROW;
  };

  /* --- auto-scroll when active row changes --- */
  React.useEffect(() => {
    if (!followActive || !listRef.current) return;
    const idx = getActiveIndex?.();
    if (idx >= 0) listRef.current.scrollToItem(idx, "center");
  }, [getActiveIndex, followActive]);

  /* --- keep row heights in sync when rows change (search / filter) --- */
  React.useEffect(() => {
    if (!listRef.current) return;
    // Re-measure from row 0 – cheaper because it only recalculates sizes,
    // it doesn’t re-render invisible rows.
    listRef.current.resetAfterIndex(0, /* shouldForceUpdate */ false);
  }, [rows.length, editingId, editedText]);

  /* --- list variants --- */
  return isMobile ? (
    <div className="divide-y">
      {rows.map((row, idx) => (
        <UtteranceRow key={row.id} index={idx} data={listData} />
      ))}
    </div>
  ) : (
    <List
      ref={listRef}
      height={600}
      itemCount={rows.length}
      itemSize={getItemSize}
      itemKey={(index) => rows[index].id}
      itemData={listData}
      width="100%"
    >
      {UtteranceRow}
    </List>
  );
}
