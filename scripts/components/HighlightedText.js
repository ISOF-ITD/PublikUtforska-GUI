import React from 'react';
import PropTypes from 'prop-types';

/*
This component extracts text surrounding a highlighted <span> element.
It looks for a <span> with the class 'highlight' and extracts the span
plus a certain number of characters before and after it (defined by 'surroundingCharsForHighlights').
If two highlights are close to each other, they are included in the same div.
The result is inserted into a <div> element with the class 'item-summary record-text small'.
Ellipsis are only added if characters were removed.
The highlighted text is kept within a span with the class 'highlight'.
*/
function HighlightedText({ text, surroundingCharsForHighlights }) {
  if (!text) {
    return null;
  }

  const str = text;
  const spanStart = '<span class="highlight">';
  const spanEnd = '</span>';
  const highlights = [];

  // Identify all highlights in the string
  let startPos = str.indexOf(spanStart);
  while (startPos !== -1) {
    const endPos = str.indexOf(spanEnd, startPos);
    if (endPos === -1) break;
    highlights.push([Math.max(0, startPos - surroundingCharsForHighlights), endPos + spanEnd.length + surroundingCharsForHighlights]);
    startPos = str.indexOf(spanStart, endPos + spanEnd.length);
  }

  // Merge close highlights
  highlights.sort((a, b) => a[0] - b[0]);
  const mergedHighlights = [highlights[0]];
  for (let i = 1; i < highlights.length; i++) {
    const lastHighlight = mergedHighlights[mergedHighlights.length - 1];
    const highlight = highlights[i];
    if (highlight[0] <= lastHighlight[1]) {
      lastHighlight[1] = Math.max(lastHighlight[1], highlight[1]);
    } else {
      mergedHighlights.push(highlight);
    }
  }

  // Create the output HTML
  return (
    <>
      {mergedHighlights.map((highlight, i) => {
        let beforeText = '';
        if (highlight[0] !== 0) {
          beforeText = '...';
          highlight[0] += 3; // account for the ellipsis
        }
        let afterText = '';
        if (highlight[1] !== str.length) {
          afterText = '...';
          highlight[1] -= 3; // account for the ellipsis
        }
        const html = str.slice(highlight[0], highlight[1]);
        return (
          <div
            key={i}
            className="item-summary record-text small"
            dangerouslySetInnerHTML={{ __html: beforeText + html + afterText }}
          />
        );
      })}
    </>
  );
}

HighlightedText.propTypes = {
  text: PropTypes.string.isRequired,
  surroundingCharsForHighlights: PropTypes.number.isRequired,
};

export default HighlightedText;
