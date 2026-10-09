import {
  Fragment, useContext, useEffect, useId, useMemo, useRef, useState,
} from 'react';
import PropTypes from 'prop-types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowUp, faChevronDown, faChevronLeft, faChevronRight, faChevronUp,
} from '@fortawesome/free-solid-svg-icons';
import { useLocation, useNavigate, useNavigationType } from 'react-router-dom';
import { AudioContext } from '../../contexts/AudioContext';
import { getAudioTitle } from '../../utils/helpers';
import {
  normalizeTranscript, selectedTranscript, transcriptExport, transcriptFragment,
  transcriptTimestamp,
} from './transcriptUtils';

const controlClass = '!m-0 !h-auto min-h-11 max-w-full whitespace-normal rounded !border !border-solid !border-border bg-surface px-3 py-2 text-sm leading-snug text-body hover:bg-surface-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus';
const previewLength = 4;

function HighlightedText({ text, query, allowItalics = false }) {
  if (allowItalics && /<\/?i>/i.test(text)) {
    let italic = false;
    let position = 0;
    return text.split(/(<\/?i>)/i).map((part) => {
      const key = String(position);
      position += part.length;
      if (/^<\/?i>$/i.test(part)) {
        italic = part.toLowerCase() === '<i>';
        return null;
      }
      const content = <HighlightedText text={part} query={query} />;
      return italic ? <em key={key}>{content}</em> : <Fragment key={key}>{content}</Fragment>;
    });
  }
  const terms = query.match(/"[^"]+"|\S+/g)
    ?.map((term) => term.replace(/^"|"$/g, '')).filter(Boolean) || [];
  if (!terms.length) return text;
  const pattern = terms.map((term) => term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
  const matcher = new RegExp(`(${pattern})`, 'giu');
  let offset = 0;
  return text.split(matcher).map((part, index) => {
    const key = `${offset}-${part}`;
    offset += part.length;
    return (
    // The split alternates unmatched text and captured matches, including empty parts.
      <Fragment key={key}>
        {index % 2 ? <mark>{part}</mark> : part}
      </Fragment>
    );
  });
}

HighlightedText.propTypes = {
  text: PropTypes.string.isRequired,
  query: PropTypes.string.isRequired,
  allowItalics: PropTypes.bool,
};

export function TranscriptReader({
  record, audio, title, headingRef, onReturnToRecordings = null,
}) {
  const {
    currentAudio, currentTime = 0, playing, playAudio,
  } = useContext(AudioContext);
  const segments = useMemo(() => normalizeTranscript(audio), [audio]);
  const [query, setQuery] = useState('');
  const [onlyMatches, setOnlyMatches] = useState(false);
  const [follow, setFollow] = useState(false);
  const [searchIndex, setSearchIndex] = useState(-1);
  const [message, setMessage] = useState('');
  const [expanded, setExpanded] = useState(false);
  const segmentRefs = useRef(new Map());
  const inputId = useId();
  const selectedIsPlaying = playing && String(currentAudio?.record?.id) === String(record.id)
    && currentAudio?.audio?.source === audio.source;
  const active = selectedIsPlaying
    ? segments.find((segment) => currentTime / 1000 >= segment.start
      && currentTime / 1000 < segment.end)?.id : null;
  const terms = query.toLocaleLowerCase('sv').normalize('NFC').match(/"[^"]+"|\S+/g)
    ?.map((term) => term.replace(/^"|"$/g, ''))
    .filter(Boolean) || [];
  const matches = segments.filter((segment) => terms.length
    && terms.every((term) => segment.text.toLocaleLowerCase('sv').normalize('NFC').includes(term)));
  const searchSegment = matches[searchIndex]?.id;
  const metadata = audio.utterances?.metadata;
  const isOcr = metadata?.process?.some((process) => process.type?.includes('ocr'));
  const hasMore = segments.length > previewLength;
  const filtered = onlyMatches && terms.length > 0;
  const visibleSegments = filtered ? matches : segments;
  const showAll = expanded || filtered;

  useEffect(() => {
    if (follow && active) segmentRefs.current.get(active)?.scrollIntoView({ block: 'nearest' });
  }, [follow, active]);

  const navigateMatch = (direction) => {
    let next = (searchIndex + direction + matches.length) % matches.length;
    if (searchIndex < 0) next = direction > 0 ? 0 : matches.length - 1;
    setSearchIndex(next);
    setExpanded(true);
    window.requestAnimationFrame(() => {
      segmentRefs.current.get(matches[next].id)?.scrollIntoView({ block: 'center' });
    });
  };

  const collapse = () => {
    setExpanded(false);
    setFollow(false);
    setOnlyMatches(false);
    headingRef.current?.scrollIntoView({ block: 'start' });
    headingRef.current?.focus({ preventScroll: true });
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(transcriptExport(segments, 'txt'));
      setMessage('Hela avskriften har kopierats.');
    } catch {
      setMessage('Avskriften kunde inte kopieras. Markera texten och kopiera den manuellt.');
    }
  };

  const download = (format) => {
    const blob = new Blob([transcriptExport(segments, format)], { type: format === 'vtt' ? 'text/vtt;charset=utf-8' : 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `avskrift-${audio.id}.${format}`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return (
    <section className="mt-3 rounded-lg border border-solid border-border bg-surface text-body" aria-labelledby={transcriptFragment(audio.id)}>
      <h3 ref={headingRef} id={transcriptFragment(audio.id)} tabIndex={-1} className="!m-0 scroll-mt-4 break-words px-4 pt-4 text-lg font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus">
        {`Avskrift: ${title}`}
      </h3>
      {!segments.length ? <p className="px-4 py-3">Det finns ingen avskrift för den här inspelningen.</p> : (
        <>
          {record.id !== 'bd10106_253556' && !isOcr && (
            <p className="!mb-0 px-4 text-sm text-muted">Avskriften är automatiskt genererad och kan innehålla fel.</p>
          )}
          <div className="sticky top-0 z-10 rounded-t-lg border-0 border-b border-solid border-border bg-surface px-4 py-3">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              {hasMore && (
                <button
                  type="button"
                  className={`${controlClass} !border-primary !bg-primary !text-[var(--color-text-inverted)] hover:!bg-primary-hover`}
                  aria-expanded={!!showAll}
                  aria-controls={`${inputId}-text`}
                  onClick={() => { if (showAll) collapse(); else setExpanded(true); }}
                >
                  <FontAwesomeIcon icon={showAll ? faChevronUp : faChevronDown} aria-hidden="true" className="mr-2" />
                  {showAll ? 'Visa kort förhandsvisning' : 'Visa hela avskriften'}
                </button>
              )}
              {onReturnToRecordings && (
                <button type="button" className={`${controlClass} !border-transparent text-link`} onClick={onReturnToRecordings}>
                  <FontAwesomeIcon icon={faArrowUp} aria-hidden="true" className="mr-2" />
                  Till inspelningarna
                </button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <label htmlFor={`${inputId}-search`} className="min-w-0 flex-1">
                <span className="sr-only">Sök i avskriften</span>
                <input
                  id={`${inputId}-search`}
                  type="search"
                  placeholder="Sök i hela avskriften"
                  value={query}
                  className={`${controlClass} w-full min-w-0`}
                  onChange={(event) => { setQuery(event.target.value); setSearchIndex(-1); }}
                />
              </label>
              <button type="button" aria-label="Föregående träff" title="Föregående träff" className={`${controlClass} shrink-0`} disabled={!matches.length} onClick={() => navigateMatch(-1)}>
                <FontAwesomeIcon icon={faChevronLeft} aria-hidden="true" />
              </button>
              <button type="button" aria-label="Nästa träff" title="Nästa träff" className={`${controlClass} shrink-0`} disabled={!matches.length} onClick={() => navigateMatch(1)}>
                <FontAwesomeIcon icon={faChevronRight} aria-hidden="true" />
              </button>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
              <label htmlFor={`${inputId}-follow`} className="flex items-center gap-2">
                <input
                  id={`${inputId}-follow`}
                  type="checkbox"
                  checked={follow}
                  onChange={(event) => {
                    setFollow(event.target.checked);
                    if (event.target.checked) setExpanded(true);
                  }}
                />
                Följ uppspelningen
              </label>
              {terms.length > 0 && (
                <label htmlFor={`${inputId}-filter`} className="flex items-center gap-2">
                  <input id={`${inputId}-filter`} type="checkbox" checked={onlyMatches} onChange={(event) => setOnlyMatches(event.target.checked)} />
                  Visa endast träffar
                </label>
              )}
              <span role="status" className="text-muted">
                {query.trim() && `${searchIndex < 0 ? 0 : searchIndex + 1} av ${matches.length} träffar i hela avskriften`}
              </span>
            </div>
          </div>
          <details className="mx-4 my-2 text-sm">
            <summary className="cursor-pointer py-2 text-link focus-visible:outline focus-visible:outline-2 focus-visible:outline-focus">Kopiera och ladda ner</summary>
            <div className="flex flex-wrap gap-2 py-2">
              <button type="button" className={controlClass} onClick={copy}>Kopiera hela avskriften</button>
              <button type="button" className={controlClass} onClick={() => download('txt')}>Ladda ner hela avskriften (.txt)</button>
              <button type="button" className={controlClass} onClick={() => download('vtt')}>Ladda ner hela avskriften (.vtt)</button>
            </div>
          </details>
          <p role="status" className="!m-0 px-4 text-sm">{message}</p>
          <div id={`${inputId}-text`} className="max-w-prose px-2 py-2 sm:px-4">
            {visibleSegments.map((segment, index) => (
              <div
                key={segment.id}
                hidden={!showAll && index >= previewLength}
                ref={(element) => {
                  if (element) segmentRefs.current.set(segment.id, element);
                  else segmentRefs.current.delete(segment.id);
                }}
                className={`items-start gap-3 rounded border-0 border-l-2 border-solid px-2 py-1 ${!showAll && index >= previewLength ? 'hidden' : 'flex'} ${active === segment.id ? 'border-primary bg-surface-muted' : 'border-transparent'} ${searchSegment === segment.id ? 'outline outline-2 outline-focus' : ''}`}
              >
                <button
                  type="button"
                  className="!m-0 !h-auto min-h-8 shrink-0 rounded border-none bg-transparent px-1 py-1 text-sm font-medium leading-snug tabular-nums text-link underline underline-offset-4 hover:bg-surface-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
                  aria-label={`Spela från ${transcriptTimestamp(segment.start)}`}
                  aria-current={active === segment.id ? 'true' : undefined}
                  onClick={() => playAudio({
                    record: { id: record.id, title }, audio, time: segment.start,
                  })}
                >
                  {transcriptTimestamp(segment.start)}
                </button>
                <p className="!m-0 min-w-0 flex-1 whitespace-pre-wrap break-words py-1 leading-relaxed">
                  <HighlightedText
                    text={segment.text}
                    query={query}
                    allowItalics={record.id === 'bd10106_253556'}
                  />
                </p>
              </div>
            ))}
          </div>
          {hasMore && !showAll && (
            <p className="!m-0 rounded-b-lg bg-surface-muted px-4 py-3 text-sm text-muted">Det här är början av avskriften. Välj ”Visa hela avskriften” för att läsa vidare.</p>
          )}
          {hasMore && showAll && (
            <div className="border-0 border-t border-solid border-border p-4">
              <button type="button" className={controlClass} onClick={collapse}>Fäll ihop och gå till början</button>
            </div>
          )}
        </>
      )}
    </section>
  );
}

TranscriptReader.propTypes = {
  record: PropTypes.object.isRequired,
  audio: PropTypes.object.isRequired,
  title: PropTypes.string.isRequired,
  headingRef: PropTypes.object.isRequired,
  onReturnToRecordings: PropTypes.func,
};

export default function AudioTranscript({ record, audioItems, onReturnToRecordings = null }) {
  const location = useLocation();
  const navigate = useNavigate();
  const navigationType = useNavigationType();
  const { currentAudio, playing } = useContext(AudioContext);
  const headingRef = useRef(null);
  const previousPlayback = useRef({ currentAudio, playing });
  const requested = location.hash.startsWith('#avskrift-') ? location.hash.slice(1) : null;
  const initialFragment = useRef(requested);
  const selected = selectedTranscript(record, audioItems, location.hash);

  useEffect(() => {
    if (!initialFragment.current) return undefined;
    let scrollFrame;
    // Wait until the page shell has completed its initial navigation reset.
    const frame = window.requestAnimationFrame(() => {
      scrollFrame = window.requestAnimationFrame(() => {
        headingRef.current?.scrollIntoView({ block: 'start' });
      });
    });
    return () => {
      window.cancelAnimationFrame(frame);
      window.cancelAnimationFrame(scrollFrame);
    };
  }, []);

  useEffect(() => {
    const previous = previousPlayback.current;
    previousPlayback.current = { currentAudio, playing };
    if (!playing || (previous.currentAudio === currentAudio && previous.playing)) return;
    if (String(currentAudio?.record?.id) !== String(record.id)) return;
    const audio = audioItems.find((item) => item.source === currentAudio.audio.source);
    if (audio && selected?.id !== audio.id) {
      navigate({ pathname: location.pathname, search: location.search, hash: `#${transcriptFragment(audio.id)}` }, { replace: true, preventScrollReset: true });
    }
  }, [
    currentAudio, playing, record.id, audioItems, selected, navigate,
    location.pathname, location.search,
  ]);

  useEffect(() => {
    if (navigationType === 'PUSH' && location.state?.focusTranscript && headingRef.current) {
      headingRef.current.scrollIntoView({ block: 'start' });
      headingRef.current.focus({ preventScroll: true });
    }
  }, [location.key, location.state, navigationType]);

  if (requested && !selected) return <p role="status">Inspelningen i länken finns inte i den här accessionen. Välj en avskrift i ljudlistan.</p>;
  if (!selected) return null;
  const title = getAudioTitle(
    selected.title,
    record.contents,
    record.archive?.archive_org,
    record.archive?.archive,
    selected.source,
    record.year,
    record.persons,
  )?.trim()
    || `Inspelning ${audioItems.indexOf(selected) + 1}`;

  return (
    <TranscriptReader
      key={selected.id}
      record={record}
      audio={selected}
      title={title}
      headingRef={headingRef}
      onReturnToRecordings={onReturnToRecordings}
    />
  );
}

AudioTranscript.propTypes = {
  record: PropTypes.object.isRequired,
  audioItems: PropTypes.arrayOf(PropTypes.object).isRequired,
  onReturnToRecordings: PropTypes.func,
};
