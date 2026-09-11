import PropTypes from 'prop-types';
import sanitizeHtml from 'sanitize-html';

const SAFE_HIGHLIGHT_OPTIONS = {
  allowedTags: ['mark'],
  allowedAttributes: {},
};

function firstValue(value) {
  return Array.isArray(value) ? value[0] : value;
}

function addCandidate(candidates, text, score) {
  if (typeof text !== 'string' || !text.trim()) return;
  candidates.push({ text, score });
}

function addNestedCandidates(candidates, nestedResult, fieldName) {
  const nestedHits = nestedResult?.hits?.hits;
  if (!Array.isArray(nestedHits)) return;

  nestedHits.forEach((hit) => {
    const {
      _score: score,
      _source: source = {},
      highlight: hitHighlight = {},
    } = hit || {};
    addCandidate(candidates, firstValue(hitHighlight[fieldName]) || source.text, score);
  });
}

export function selectBestCardSnippet({
  summary,
  highlight = {},
  innerHits = {},
}) {
  const candidates = [];

  // Preserve the card's existing source order when Elasticsearch does not
  // provide a per-fragment score.
  addCandidate(candidates, summary);
  addNestedCandidates(
    candidates,
    innerHits['media.description'],
    'media.description.text',
  );
  addNestedCandidates(
    candidates,
    innerHits['media.utterances.utterances'],
    'media.utterances.utterances.text',
  );
  addCandidate(candidates, firstValue(highlight.text));
  addCandidate(candidates, firstValue(highlight.headwords));
  addCandidate(candidates, firstValue(highlight.contents));
  addNestedCandidates(candidates, innerHits.media, 'media.text');

  const scoredCandidates = candidates.filter(
    ({ score }) => typeof score === 'number' && Number.isFinite(score),
  );
  if (scoredCandidates.length > 0) {
    return scoredCandidates.reduce((best, candidate) => (
      candidate.score > best.score ? candidate : best
    )).text;
  }

  return candidates[0]?.text || '';
}

export function toSemanticHighlightHtml(value) {
  if (value === null || value === undefined) return '';

  const semanticHtml = String(value)
    .replace(/\[\[[^\]]+\]\]/g, ' ')
    .replace(/\\n|\r?\n/g, ' ')
    .replace(/<span class=["']highlight["']>/gi, '<mark>')
    .replace(/<\/span>/gi, '</mark>');

  return sanitizeHtml(semanticHtml, SAFE_HIGHLIGHT_OPTIONS)
    .replace(/\s+/g, ' ')
    .trim();
}

export default function RecordCardSnippet({ text }) {
  const snippetHtml = toSemanticHighlightHtml(text);
  if (!snippetHtml) return null;

  return (
    <p
      className="!mb-0 !mt-2 line-clamp-3 break-words text-sm leading-snug text-body"
      dangerouslySetInnerHTML={{ __html: snippetHtml }}
    />
  );
}

RecordCardSnippet.propTypes = {
  text: PropTypes.string,
};
