import React from "react";

/**
 * Wrap every case-insensitive `query` match inside <mark>.
 * Returns an array you can render directly.
 */
export default function highlight(text = "", query = "") {
  if (!query.trim()) return text;

  // escape regex metacharacters in the query
  const safe = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const parts = text.split(new RegExp(`(${safe})`, "i"));

  return parts.map((part, i) =>
    part.toLowerCase() === query.toLowerCase() ? (
      <mark key={i} className="bg-yellow-200">
        {part}
      </mark>
    ) : (
      part
    )
  );
}
