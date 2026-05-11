import { Link } from 'react-router-dom';
import { useMemo } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPencil,
  faFileLines,
  faFilePdf,
  faVolumeHigh,
} from '@fortawesome/free-solid-svg-icons';
import PropTypes from 'prop-types';
import { l } from '../../../lang/Lang';
import {
  getTitle,
  getPlaceString,
  pageFromTo,
} from '../../../utils/helpers';
import config from '../../../config';
import TranscribeButton from '../../TranscriptionPageByPageOverlay/ui/TranscribeButton';
import useSubrecords from '../hooks/useSubrecords';
import HighlightedText from './HighlightedText';
import { secondsToMMSS } from '../../../utils/timeHelper';
import { createSearchRoute } from '../../../utils/routeHelper';
import { pickPrimaryMediaType } from '../../../utils/mediaTypes';

export default function RecordCardItem({
  item,
  searchParams,
  mode = 'material',
  highlightRecordsWithMetadataField,
  isSelected,
  onRecordActivate,
}) {
  const src = item?._source ?? {};

  const {
    archive = {},
    media = [],
    metadata = [],
    places = [],
    persons = [],
    transcriptiontype,
    transcriptionstatus,
    title,
    recordtype,
    materialtype,
    contents,
    year,
    id,
  } = src;

  const highlight = item?.highlight ?? {};
  const innerHits = item?.inner_hits ?? {};
  const itemText = item?.text;

  /* ───────────────── sub-records (needed for the counters) ─────────────── */
  const {
    count = 0,
    countDone = 0,
    mediaCount = 0,
    mediaCountDone = 0,
  } = useSubrecords({
    // network request ≈ table row
    recordtype,
    id,
    ...src,
  });

  // helpers
  const displayTitle = useMemo(
    () => getTitle(title, contents, archive, highlight),
    [title, contents, archive, highlight],
  );
  const archiveId = useMemo(
    () => archive?.archive_id_display_search?.join(', ') || '',
    [archive, archive.archive_id_display_search],
  );
  const archivePage = useMemo(() => {
    try {
      const val = typeof pageFromTo === 'function'
        ? pageFromTo({ _source: { archive } })
        : archive?.page;

      return val ? String(val) : '';
    } catch (e) {
      return '';
    }
  }, [archive]);
  const archiveDisplay = `${archiveId}${archivePage ? `:${archivePage}` : ''}`;
  const placeString = useMemo(() => getPlaceString(places || []), [places]);

  // build a search suffix from the current list params
  const searchSuffix = createSearchRoute(searchParams || {});

  // avoid adding a bare "/" when there are no params
  const recordUrl = `${
    mode === 'transcribe' ? '/transcribe' : ''
  }/records/${id}${searchSuffix === '/' ? '' : searchSuffix}`;

  const hasTranscription = useMemo(
    () => !!media?.some?.(
      (m) => m?.type === 'audio' && m?.utterances?.utterances?.length > 0,
    ),
    [media],
  );
  const transcriptionBadgeClass = [
    'mb-0.5 ml-1 inline-flex items-center gap-1 rounded border border-border',
    'bg-white/80 px-1.5 py-0.5 align-middle text-[10px] font-semibold',
    'leading-none text-link shadow-sm',
  ].join(' ');
  const contentHitLabelClass = 'mr-1 text-[var(--color-result-card-label)]';
  const firstImageMedia = media.find((m) => m?.type?.startsWith('image')) || null;
  let thumbnail = '';
  if (firstImageMedia?.source) {
    try {
      thumbnail = new URL(firstImageMedia.source, config?.imageUrl).toString();
    } catch {
      const base = String(config?.imageUrl || '');
      const sep = base && !base.endsWith('/') ? '/' : '';
      thumbnail = `${base}${sep}${String(firstImageMedia.source || '')}`;
    }
  }
  const primaryMediaType = pickPrimaryMediaType(media);
  const mediaPreview = {
    audio: {
      icon: faVolumeHigh,
      label: l('Inspelning'),
      className: 'text-primary',
    },
    image: {
      icon: faFileLines,
      label: l('Uppteckning'),
      className: 'text-primary',
    },
    pdf: {
      icon: faFilePdf,
      label: 'PDF',
      className: 'text-danger',
    },
  }[primaryMediaType];

  // ───────── highlight / summary
  const hasHighlightedSummary = !!highlightRecordsWithMetadataField
    && metadata?.some?.((m) => m?.type === highlightRecordsWithMetadataField)
    && itemText;

  const summary = hasHighlightedSummary
    ? itemText.length > 250
      ? `${itemText.slice(0, 250)}…`
      : itemText
    : null;

  // Collector filtering
  const collectorPersons = persons?.filter?.((p) => ['c', 'collector', 'interviewer', 'recorder'].includes(p?.relation)) ?? [];

  const isAudioRecording = transcriptiontype === 'audio'
    || recordtype === 'one_audio_record'
    || media.some(
      (m) => m?.type === 'audio' || m?.source?.toLowerCase().endsWith('.mp3'),
    );

  let total;
  let done;
  if (!isAudioRecording) {
    total = transcriptiontype === 'sida' ? mediaCount : count;
    done = transcriptiontype === 'sida' ? mediaCountDone : countDone;
  }
  const pageTotal = total ?? 0;
  const safePageTotal = Math.max(pageTotal, 1);
  const pageDone = Math.min(done ?? 0, safePageTotal);
  const transcriptionProgress = !isAudioRecording
    && transcriptionstatus !== 'readytocontribute'
    && pageTotal > 0
    ? {
      label: `${pageDone} av ${pageTotal} ${pageTotal === 1 ? 'sida' : 'sidor'}`,
      pct: Math.round((pageDone / safePageTotal) * 100),
    }
    : null;

  // normalize year to a displayable string safely
  let displayYear = null;
  if (typeof year === 'string') {
    [displayYear] = year.split('-');
  } else if (typeof year === 'number') {
    displayYear = String(year);
  }

  const handleRecordClick = () => {
    onRecordActivate?.(id);
  };
  const showCollectors = config?.siteOptions?.recordList?.visibleCollecorPersons
    && collectorPersons.length > 0;

  return (
    <article
      className={`group relative overflow-hidden rounded-md !border bg-[var(--color-result-card-bg)] p-3 shadow-sm transition-all hover:shadow-md ${
        isSelected
          ? '!border-focus ring-2 ring-focus ring-offset-1'
          : '!border-[var(--color-result-card-rule)]'
      }`}
    >
      {/* Header Section */}
      <div className="flex items-start gap-3">
        {thumbnail && (
          <img
            src={thumbnail}
            alt=""
            className="h-28 w-[72px] shrink-0 rounded-sm border border-[var(--color-result-card-rule)] bg-surface object-contain p-0.5"
            loading="lazy"
            decoding="async"
            onError={(e) => {
              e.currentTarget.style.visibility = 'hidden';
            }}
          />
        )}
        {!thumbnail && mediaPreview && (
          <div className="flex h-28 w-[72px] shrink-0 items-center justify-center rounded-sm border border-[var(--color-result-card-rule)] bg-surface-muted">
            <FontAwesomeIcon
              icon={mediaPreview.icon}
              title={mediaPreview.label}
              className={`${mediaPreview.className} text-3xl`}
              aria-hidden="true"
            />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <span className="block text-lg font-semibold leading-tight !text-link">
            {recordUrl ? (
              <Link
                to={recordUrl}
                className="!text-link hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-focus"
                onClick={handleRecordClick}
              >
                <span
                // ensure string
                  dangerouslySetInnerHTML={{ __html: String(displayTitle || '') }}
                />
                {hasTranscription && (
                  <span
                    className={transcriptionBadgeClass}
                    title={l('Har avskrift')}
                    aria-label={l('Har avskrift')}
                  >
                    <FontAwesomeIcon
                      icon={faFileLines}
                      className="text-[11px]"
                      aria-hidden="true"
                    />
                    <span>{l('Avskrift')}</span>
                  </span>
                )}
              </Link>
            ) : (
              <span
                className="!text-link opacity-70 cursor-not-allowed"
                aria-disabled="true"
              >
                <span
                  dangerouslySetInnerHTML={{ __html: String(displayTitle || '') }}
                />
              </span>
            )}
            {archiveDisplay && (
            <span className="mt-0.5 block truncate text-sm font-normal leading-snug text-[var(--color-result-card-label)]">
              {archiveDisplay}
            </span>
            )}
          </span>

          {/* Metadata Grid */}
          <div className="mt-3 flex flex-col text-sm leading-snug">
            {placeString && (
            <div className="grid grid-cols-[5.75rem_minmax(0,1fr)] border-t border-[var(--color-result-card-rule)] py-1">
              <span className="pr-2 text-right text-[var(--color-result-card-label)]">
                {l('Ort')}
              </span>
              <span className="min-w-0 break-words font-medium text-body">
                {placeString}
              </span>
            </div>
            )}

            {displayYear && (
            <div className="grid grid-cols-[5.75rem_minmax(0,1fr)] border-t border-[var(--color-result-card-rule)] py-1">
              <span className="pr-2 text-right text-[var(--color-result-card-label)]">
                {l('År')}
              </span>
              <span className="min-w-0 break-words font-medium text-body">
                {displayYear}
              </span>
            </div>
            )}

            {showCollectors && (
            <div className="grid grid-cols-[5.75rem_minmax(0,1fr)] border-t border-[var(--color-result-card-rule)] py-1">
              <span className="pr-2 text-right text-[var(--color-result-card-label)]">
                {l('Insamlare')}
              </span>
              <span className="flex min-w-0 flex-wrap gap-x-1 font-medium text-body">
                {collectorPersons.map((p) => {
                  const pid = (p?.id != null ? String(p.id) : '').toLowerCase();
                  if (!pid) return null;
                  return (
                    <Link
                      key={`collector-${pid}-${p?.relation ?? ''}-${p?.name ?? ''}`}
                      to={`${
                        mode === 'transcribe' ? '/transcribe' : ''
                      }/persons/${pid}`}
                      className="text-body hover:underline"
                    >
                      {l(p?.name || '')}
                    </Link>
                  );
                })}
              </span>
            </div>
            )}

            {transcriptionProgress && (
            <div className="grid grid-cols-[5.75rem_minmax(0,1fr)] border-t border-[var(--color-result-card-rule)] py-1">
              <span className="pr-2 text-right text-[var(--color-result-card-label)]">
                {l('Avskrivna')}
              </span>
              <div className="flex min-w-0 items-center gap-2">
                <span className="min-w-0 shrink break-words font-medium text-body">
                  {transcriptionProgress.label}
                </span>
                <div
                  className="h-1.5 w-14 shrink-0 overflow-hidden rounded border border-primary border-solid bg-surface"
                  role="progressbar"
                  aria-valuemin={0}
                  aria-valuemax={safePageTotal}
                  aria-valuenow={pageDone}
                  aria-label={l('Avskrivna')}
                  title={`${transcriptionProgress.pct}%`}
                >
                  <span
                    className="block h-full rounded bg-accent"
                    style={{ width: `${transcriptionProgress.pct}%` }}
                  />
                </div>
              </div>
            </div>
            )}
          </div>
        </div>
      </div>

      {/* Summary first (if any) */}
      {summary && (
        <span className="mt-2 text-sm text-muted line-clamp-4">
          {summary}
        </span>
      )}

      {innerHits?.['media.description']?.hits?.hits.map((descHit) => {
        const highlighted = descHit.highlight?.['media.description.text']?.[0]
              ?? descHit._source?.text
              ?? '';

        if (!highlighted) return null;

        return (
          <div
            className="flex flex-col mt-2 text-sm leading-snug"
            key={`description-${descHit?.['_id'] ?? 'hit'}-${
              descHit?.['_nested']?.offset ?? highlighted
            }`}
          >
            <span className={contentHitLabelClass}>Innehållsbeskrivning:</span>
            <HighlightedText
              text={highlighted}
              className="inline"
              maxSnippets={1}
              maxWords={15}
            />
          </div>
        );
      })}
      {innerHits?.['media.utterances.utterances']?.hits?.hits.map(
        (descHit) => {
          const highlighted = descHit.highlight?.['media.utterances.utterances.text']?.[0]
                ?? descHit._source?.text
                ?? '';

          if (!highlighted) return null;

          const startLabel = descHit._source?.start !== undefined
            ? ` (${secondsToMMSS(descHit._source.start)})`
            : '';

          return (
            <div
              className="flex flex-col mt-2 text-sm leading-snug"
              key={`utterance-${descHit?.['_id'] ?? 'hit'}-${
                descHit?.['_nested']?.offset ?? ''
              }-${descHit?.['_source']?.start ?? startLabel}`}
            >
              <span className={contentHitLabelClass}>
                Ljudavskrift
                {startLabel}
                :
              </span>
              <HighlightedText
                text={highlighted}
                className="inline"
                maxSnippets={1}
                maxWords={15}
              />
            </div>
          );
        },
      )}
      {highlight?.text?.[0] && (
      <div className="flex flex-col mt-2 text-sm leading-snug">
        <span className={contentHitLabelClass}>Transkribering:</span>
        <HighlightedText
          text={highlight.text[0]} // only the ES highlight HTML
          className="inline"
          maxSnippets={1}
          maxWords={15}
        />
      </div>
      )}
      {highlight?.headwords?.[0] && (
      <div className="flex flex-col mt-2 text-sm leading-snug">
        <span className={contentHitLabelClass}>
          Uppgifter från äldre innehållsregister:
        </span>
        <HighlightedText
          text={highlight.headwords[0]}
          maxSnippets={1}
          maxWords={15}
          className="inline"
        />
      </div>
      )}

      {highlight?.contents?.[0] && (
      <div className="flex flex-col mt-2 text-sm leading-snug">
        <span className={contentHitLabelClass}>Beskrivning av innehåll:</span>
        <HighlightedText
          text={highlight.contents[0]}
          maxSnippets={1}
          maxWords={15}
          className="inline"
        />
      </div>
      )}

      {innerHits?.media?.hits?.hits.map((hit) => {
        const highlighted = hit.highlight?.['media.text']?.[0];
        if (!highlighted) return null;

        return (
          <div
            className="flex flex-col mt-2 text-sm leading-snug"
            key={`media-${hit?.['_id'] ?? 'hit'}-${
              hit?.['_nested']?.offset ?? highlighted
            }`}
          >
            <span className={contentHitLabelClass}>Transkribering:</span>
            <HighlightedText
              text={highlighted}
              className="inline"
              maxSnippets={1}
              maxWords={15}
            />
          </div>
        );
      })}

      {/* Transcription CTA */}
      {transcriptionstatus === 'readytotranscribe'
        && (media?.length ?? 0) > 0 && (
          <div className="mt-4 border-t border-border pt-3">
            <TranscribeButton
              className="w-full justify-center bg-primary hover:bg-primary-hover !text-white font-medium rounded-lg transition-colors"
              label={(
                <>
                  <FontAwesomeIcon icon={faPencil} />
                  {' '}
                  {l('Skriv av')}
                </>
              )}
              title={title}
              recordId={id}
              archiveId={archive?.archive_id}
              places={places}
              images={media || []}
              transcriptionType={transcriptiontype}
              random={false}
            />
          </div>
      )}
    </article>
  );
}

RecordCardItem.propTypes = {
  item: PropTypes.object.isRequired,
  searchParams: PropTypes.object,
  mode: PropTypes.string,
  highlightRecordsWithMetadataField: PropTypes.string,
  isSelected: PropTypes.bool,
  onRecordActivate: PropTypes.func,
};
