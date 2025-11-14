/* eslint-disable react/require-default-props */
import React from "react";
import PropTypes from "prop-types";

/*
- Removes [[...]] refs and \n
- Word-based snippets (maxSnippets, maxWords)
- Keeps <span class="highlight">...</span>
- Ellipses only when trimmed
Fallback:
- If maxSnippets is undefined, keeps the char-window behavior.
*/

function sanitizeHtmlPreservingHighlightTags(html) {
  if (!html) return "";
  // Remove image/file refs like [[Lada_I163/...jpg]]
  let s = String(html)
    .replace(/\[\[[^\]]+\]\]/g, " ") // kill [[...]]
    .replace(/\\n|\r?\n/g, " ") // remove real and literal \n
    .replace(/\s+/g, " ") // collapse spaces
    .trim();
  return s;
}

function snippetsByWords(html, { maxSnippets, maxWords }) {
  // Replace highlight tags with markers surrounded by spaces so they tokenize cleanly
  const highlightStart = "__highlightStart__";
  const highlightEnd = "__highlightEnd__";
  const marked = html
    .replace(/<span class="highlight">/g, ` ${highlightStart} `)
    .replace(/<\/span>/g, ` ${highlightEnd} `);

  const tokens = marked.split(/\s+/).filter(Boolean);
  const snippets = [];

  for (let i = 0; i < tokens.length && snippets.length < maxSnippets; i += 1) {
    if (tokens[i] !== highlightStart) continue;

    // collect highlighted words
    let j = i + 1;
    const highlighted = [];
    while (j < tokens.length && tokens[j] !== highlightEnd) {
      highlighted.push(tokens[j]);
      j += 1;
    }
    if (j >= tokens.length) break; // unmatched; stop safely

    const hCount = Math.max(1, highlighted.length);
    const budget = Math.max(1, maxWords);
    const contextBudget = Math.max(0, budget - hCount);
    const beforeTarget = Math.floor(contextBudget / 2);
    const afterTarget = contextBudget - beforeTarget;

    // collect BEFORE words (skipping markers)
    const before = [];
    let k = i - 1;
    while (k >= 0 && before.length < beforeTarget) {
      const t = tokens[k];
      if (t !== highlightStart && t !== highlightEnd) before.unshift(t);
      k -= 1;
    }

    // collect AFTER words (skipping markers)
    const after = [];
    let k2 = j + 1;
    while (k2 < tokens.length && after.length < afterTarget) {
      const t = tokens[k2];
      if (t !== highlightStart && t !== highlightEnd) after.push(t);
      k2 += 1;
    }

    const hadBeforeTrim = k >= 0; // there are words further back
    const hadAfterTrim = k2 < tokens.length; // there are words further ahead

    // rebuild HTML with preserved highlight span
    let snippet = [
      before.join(" "),
      `<span class="highlight">${highlighted.join(" ")}</span>`,
      after.join(" "),
    ]
      .filter(Boolean)
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();

    if (hadBeforeTrim) snippet = `... ${snippet}`;
    if (hadAfterTrim) snippet = `${snippet} ...`;

    snippets.push(snippet);
    i = j; // jump past the highlight end
  }

  // If there were no highlights at all, return a single trimmed snippet
  if (snippets.length === 0) {
    const words = html.split(/\s+/).filter(Boolean);
    const cut = words.slice(0, maxWords).join(" ");
    return [words.length > maxWords ? `${cut} ...` : cut];
  }

  return snippets;
}

function HighlightedText({
  text,
  className = "",
  maxSnippets,
  maxWords = 15,
  // Legacy char-based prop (kept for backwards compatibility elsewhere):
  surroundingCharsForHighlights = 60,
}) {
  const raw = typeof text === "string" ? text : String(text ?? "");
  if (!raw) return null;

  // If caller provided maxSnippets, run tidy (word-based) mode
  if (typeof maxSnippets === "number") {
    const cleaned = sanitizeHtmlPreservingHighlightTags(raw);
    const pieces = snippetsByWords(cleaned, { maxSnippets, maxWords });
    return (
      <>
        {pieces.map((html, idx) => (
          <div
            key={`${idx}-${html.length}`}
            className={`item-summary inline-block bg-white rounded-lg shadow-md font-serif max-w-full text-sm py-2 px-2 leading-tight my-2 mb-0 ${className}`}
            dangerouslySetInnerHTML={{ __html: html }}
          />
        ))}
      </>
    );
  }

  // Character windows
  const str = raw;
  const spanStart = '<span class="highlight">';
  const spanEnd = "</span>";
  const highlights = [];

  let startPos = str.indexOf(spanStart);
  while (startPos !== -1) {
    const endPos = str.indexOf(spanEnd, startPos);
    if (endPos === -1) break;
    highlights.push([
      Math.max(0, startPos - surroundingCharsForHighlights),
      endPos + spanEnd.length + surroundingCharsForHighlights,
    ]);
    startPos = str.indexOf(spanStart, endPos + spanEnd.length);
  }

  if (highlights.length === 0) {
    return (
      <div
        className={`item-summary inline-block bg-white rounded-lg shadow-md font-serif max-w-full text-sm py-2 px-2 leading-tight my-2 mb-0 ${className}`}
        dangerouslySetInnerHTML={{ __html: str }}
      />
    );
  }

  highlights.sort((a, b) => a[0] - b[0]);
  const merged = [highlights[0]];
  for (let i = 1; i < highlights.length; i += 1) {
    const last = merged[merged.length - 1];
    const cur = highlights[i];
    if (cur[0] <= last[1]) last[1] = Math.max(last[1], cur[1]);
    else merged.push(cur);
  }

  return (
    <>
      {merged.map(([start, end]) => {
        let beforeText = "";
        let afterText = "";
        let adjustedStart = start;
        let adjustedEnd = end;

        if (start !== 0) {
          beforeText = "...";
          adjustedStart += 3;
        }
        if (end !== str.length) {
          afterText = "...";
          adjustedEnd -= 3;
        }

        const html = str.slice(adjustedStart, adjustedEnd);
        const key = `${adjustedStart}-${adjustedEnd}`;
        return (
          <div
            key={key}
            className={`item-summary inline-block bg-white rounded-lg shadow-md font-serif max-w-full text-sm py-2 px-2 leading-tight my-2 mb-0 ${className}`}
            dangerouslySetInnerHTML={{ __html: beforeText + html + afterText }}
          />
        );
      })}
    </>
  );
}

HighlightedText.propTypes = {
  text: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  className: PropTypes.string,
  // tidy mode (word-based)
  maxSnippets: PropTypes.number,
  maxWords: PropTypes.number,
  // legacy (char-based)
  surroundingCharsForHighlights: PropTypes.number,
};

export default HighlightedText;
