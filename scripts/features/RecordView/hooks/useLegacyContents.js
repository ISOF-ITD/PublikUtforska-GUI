import { useMemo } from "react";
import { getAudioTitle } from "../../../utils/helpers";
import {
  TIME_ANY_RE,
  extractRowsFromContents,
  buildMediaIndex,
} from "../utils/legacyContentsParser";

export default function useLegacyContents({
  contents,
  media = [],
  title,
  archiveOrg,
  archive,
  year,
  persons,
}) {
  const mediaIndex = useMemo(() => buildMediaIndex(media), [media]);

  const hasStructured = useMemo(() => {
    const text = contents || "";
    return TIME_ANY_RE.test(text);
  }, [contents]);

  const defaultAudio = useMemo(
    () =>
      media.find((m) => (m?.type || "").toLowerCase().includes("audio")) ||
      media[0],
    [media]
  );

  const audioTitle = useMemo(() => {
    const src = defaultAudio?.source;
    return getAudioTitle(
      title,
      contents,
      archiveOrg,
      archive,
      src,
      year,
      persons
    );
  }, [title, contents, archiveOrg, archive, defaultAudio, year, persons]);

  const rows = useMemo(() => {
    if (!hasStructured) return [];
    return extractRowsFromContents(contents, mediaIndex);
  }, [contents, hasStructured, mediaIndex]);

  const isCompact = useMemo(() => {
    if (!rows.length) return false;
    const totalLen = rows.reduce((sum, r) => sum + (r.text || "").length, 0);
    const avgLen = totalLen / rows.length;
    return rows.length <= 50 && avgLen <= 18;
  }, [rows]);

  const rowCount = useMemo(() => {
    if (hasStructured) return rows.length;
    return (contents || "").trim().split(/\n+/).filter(Boolean).length;
  }, [hasStructured, rows, contents]);

  return {
    mediaIndex,
    hasStructured,
    defaultAudio,
    audioTitle,
    rows,
    isCompact,
    rowCount,
  };
}
