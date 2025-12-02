// Match things like Gr3702:a2, BD1234:b, ulm12:a, etc. (prefix may be letters incl. nordic chars)
export const REC_TAG_ANY_RE =
  /\b([A-Za-zÅÄÖåäö]{1,6})\s?_?(\d{2,6})(?::([a-z])([0-9]{0,2}))?/;

// Times like 00:57 or 1:02:03; also allow optional surrounding parentheses
export const TIME_ANY_RE = /\(?((?:\d{1,2}:)?\d{1,2}:\d{2})\)?/;

function toSeconds(label) {
  const clean = label.replace(/[()]/g, "");
  const parts = clean.split(":").map(Number);
  if (parts.some((n) => Number.isNaN(n))) return 0;
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  return 0;
}

function pad2(n) {
  return String(n).padStart(2, "0");
}

// Normalize tag parts to user-visible (e.g., "GR3702:a2") and to a key (e.g., "gr3702a2")
function formatTag({ prefix, num, side, take }) {
  const showSide = side ? `:${side}${take || ""}` : "";
  return `${prefix}${num}${showSide}`;
}

function tagKey({ prefix, num, side, take }) {
  return `${prefix}${num}${side || ""}${take || ""}`.toLowerCase();
}

function parseRecTag(str) {
  const m = str.match(REC_TAG_ANY_RE);
  if (!m) return null;
  const [, prefixRaw, num, side, take] = m;
  const prefix = prefixRaw.toUpperCase();
  return { prefix, num, side: side || null, take: take || null };
}

function normalizeLabel(label) {
  const clean = label.replace(/[()]/g, "");
  const parts = clean.split(":").map(Number);
  if (parts.length === 2) return `${parts[0]}:${pad2(parts[1])}`;
  if (parts.length === 3)
    return `${parts[0]}:${pad2(parts[1])}:${pad2(parts[2])}`;
  return clean;
}

function collapseWhitespace(s) {
  return s.replace(/\s+/g, " ").trim();
}

/**
 * Map media items by likely recording keys extracted from their `source`.
 * Keys use compact lowercase form without separators (e.g., gr3702a2, gr3702a, gr3702).
 */
export function buildMediaIndex(media = []) {
  const map = new Map();
  for (const m of media) {
    const src = (m?.source || "").toLowerCase();
    // Accept patterns like gr_3702a2, gr3702a2, ulm1234b, bd 9999, etc.
    const mm = src.match(
      /([a-zåäö]{1,6})[\s_]?(\d{2,6})([a-z])?([0-9]{0,2})?/i
    );
    if (!mm) continue;
    const prefix = (mm[1] || "").toLowerCase();
    const num = mm[2] || "";
    const side = (mm[3] || "").toLowerCase();
    const take = (mm[4] || "").toLowerCase();

    const keys = new Set();
    if (prefix && num && side && take)
      keys.add(`${prefix}${num}${side}${take}`);
    if (prefix && num && side) keys.add(`${prefix}${num}${side}`);
    if (prefix && num) keys.add(`${prefix}${num}`);

    for (const k of keys) if (!map.has(k)) map.set(k, m);
  }
  return map;
}

export function pickMediaForTag(tagKeyMaybe, mediaIndex) {
  if (!tagKeyMaybe) return null;
  const key = tagKeyMaybe.toLowerCase();
  // Try exact take, then side, then base number
  if (mediaIndex.has(key)) return mediaIndex.get(key);
  // try without take (strip trailing digits)
  const sideMaybe = key.replace(/\d+$/, "");
  if (mediaIndex.has(sideMaybe)) return mediaIndex.get(sideMaybe);
  // try base number (strip trailing side)
  const baseMaybe = sideMaybe.replace(/[a-z]$/, "");
  if (mediaIndex.has(baseMaybe)) return mediaIndex.get(baseMaybe);
  return null;
}

/**
 * Extract rows from legacy contents text.
 * Produces: { tag: 'GR3702:a2', start: 'M:SS'|'H:MM:SS', seconds: number, text, media? }
 */
export function extractRowsFromContents(contents, mediaIndex) {
  const text = (contents || "").replace(/\u00A0/g, " "); // NBSP -> space

  // Split candidate *recording* blocks primarily on "|". If there are no bars, treat the whole string as one block.
  const blocks = text
    .split("|")
    .map((b) => b.trim())
    .filter(Boolean);
  const rows = [];

  let carryTag = null; // In case a block starts with time straight away (rare)

  for (const block of blocks) {
    const tagParts = parseRecTag(block);
    let tag = tagParts ? formatTag(tagParts) : carryTag;
    let key = tagParts
      ? tagKey(tagParts)
      : carryTag
      ? carryTag.replace(/[^a-z0-9]/gi, "").toLowerCase()
      : null;

    let rest = tagParts ? block.replace(REC_TAG_ANY_RE, "").trim() : block;

    const timeMatches = [...rest.matchAll(new RegExp(TIME_ANY_RE, "g"))];
    if (timeMatches.length === 0) {
      const label = "0:00";
      rows.push({
        tag,
        start: label,
        seconds: 0,
        text: rest.replace(/^[;:,\-\s]+/, "").trim(),
        media: pickMediaForTag(key, mediaIndex),
      });
      carryTag = tag;
      continue;
    }

    for (let i = 0; i < timeMatches.length; i++) {
      const m = timeMatches[i];
      const matchText = m[1];
      const startIdx = m.index ?? 0;
      const label = normalizeLabel(matchText);
      const endIdx =
        i + 1 < timeMatches.length ? timeMatches[i + 1].index : rest.length;

      const afterTimeIdx = startIdx + (m[0]?.length || matchText.length);
      const raw = rest.slice(afterTimeIdx, endIdx).trim();
      const desc = collapseWhitespace(raw.replace(/^[;:,\-\s]+/, ""));

      rows.push({
        tag,
        start: label,
        seconds: toSeconds(label),
        text: desc,
        media: pickMediaForTag(key, mediaIndex),
      });
    }

    carryTag = tag;
  }

  return rows.sort((a, b) => {
    const ta = a.tag || "";
    const tb = b.tag || "";
    if (ta === tb) return a.seconds - b.seconds;
    return ta.localeCompare(tb, "sv");
  });
}
