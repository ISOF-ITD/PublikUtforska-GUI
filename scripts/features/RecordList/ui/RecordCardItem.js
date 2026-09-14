import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faFileLines,
  faFilePdf,
} from '@fortawesome/free-solid-svg-icons';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import config from '../../../config';
import { l } from '../../../lang/Lang';
import {
  getPlaceString,
  getTitle,
  pageFromTo,
} from '../../../utils/helpers';
import { pickPrimaryMediaType } from '../../../utils/mediaTypes';
import { createSearchRoute, mergeRouteSearch } from '../../../utils/routeHelper';
import useSubrecords from '../hooks/useSubrecords';
import countPageProgressFromMedia from '../utils/countPageProgressFromMedia';
import AudioWaveIcon from './AudioWaveIcon';
import RecordCardSnippet, {
  selectBestCardSnippet,
  toSemanticHighlightHtml,
} from './RecordCardSnippet';

const COLLECTOR_RELATIONS = ['c', 'collector', 'interviewer', 'recorder'];

function buildThumbnailUrl(source) {
  if (!source) return '';

  try {
    return new URL(source, config?.imageUrl).toString();
  } catch {
    const base = String(config?.imageUrl || '');
    const separator = base && !base.endsWith('/') ? '/' : '';
    return `${base}${separator}${String(source)}`;
  }
}

function getDisplayYear(year) {
  if (typeof year === 'string') return year.split('-')[0];
  if (typeof year === 'number') return String(year);
  return '';
}

function hideBrokenImage(event) {
  const imageElement = event.currentTarget;
  imageElement.style.visibility = 'hidden';
}

export default function RecordCardItem({
  item,
  searchParams,
  mode = 'material',
  highlightRecordsWithMetadataField,
  isSelected,
  onRecordActivate,
  detailSearch = '',
  headingLevel = 'h3',
}) {
  const {
    _source: source = {},
    highlight = {},
    inner_hits: innerHits = {},
    text: itemText,
  } = item || {};
  const {
    archive = {},
    contents,
    id,
    media = [],
    metadata = [],
    persons = [],
    places = [],
    recordtype,
    title,
    transcriptionstatus,
    transcriptiontype,
    year,
  } = source;
  const mediaItems = Array.isArray(media) ? media : [];
  const metadataItems = Array.isArray(metadata) ? metadata : [];
  const personItems = Array.isArray(persons) ? persons : [];
  const placeItems = Array.isArray(places) ? places : [];
  const Heading = headingLevel;

  const {
    count = 0,
    countDone = 0,
    mediaCount = 0,
    mediaCountDone = 0,
  } = useSubrecords({
    recordtype,
    id,
    ...source,
  });

  const displayTitle = getTitle(title, contents, archive, highlight) || l('(Utan titel)');
  const titleHtml = toSemanticHighlightHtml(displayTitle);
  const archiveId = archive?.archive_id_display_search?.join(', ')
    || archive?.archive_id_row
    || String(id || '');
  let archivePage = '';
  try {
    archivePage = pageFromTo({ _source: { archive } });
  } catch {
    archivePage = '';
  }
  const archiveDisplay = `${archiveId}${archivePage ? `:${archivePage}` : ''}`;
  const placeString = getPlaceString(placeItems);
  const extraPlaceCount = Math.max(0, placeItems.length - 1);
  const extraPlaces = extraPlaceCount > 0
    ? `${extraPlaceCount} ${extraPlaceCount === 1 ? 'annan' : 'andra'}`
    : '';
  const displayPlace = `${placeString}${extraPlaces ? `, ${extraPlaces}` : ''}`;
  const displayYear = getDisplayYear(year);
  const collectorNames = personItems
    .filter((person) => COLLECTOR_RELATIONS.includes(person?.relation))
    .map((person) => person?.name?.trim())
    .filter(Boolean)
    .join(', ');
  const showCollectors = config?.siteOptions?.recordList?.visibleCollecorPersons
    && collectorNames;

  const searchSuffix = createSearchRoute(searchParams || {});
  const recordUrl = mergeRouteSearch(
    `${mode === 'transcribe' ? '/transcribe' : ''}/records/${id}${
      searchSuffix === '/' ? '' : searchSuffix
    }`,
    detailSearch,
  );

  const hasTranscription = mediaItems.some((mediaItem) => (
    mediaItem?.type === 'audio'
    && (
      mediaItem?.has_transcription
      || mediaItem?.utterances?.utterances?.length > 0
    )
  ));
  const isAudioRecording = transcriptiontype === 'audio'
    || recordtype === 'one_audio_record'
    || mediaItems.some((mediaItem) => (
      mediaItem?.type === 'audio'
      || mediaItem?.source?.toLowerCase().endsWith('.mp3')
    ));

  const primaryMediaType = pickPrimaryMediaType(mediaItems);
  const firstImageMedia = mediaItems.find(
    (mediaItem) => mediaItem?.type?.startsWith('image'),
  );
  const thumbnail = primaryMediaType === 'audio'
    ? ''
    : buildThumbnailUrl(firstImageMedia?.source);
  const mediaPreview = {
    audio: {
      className: 'text-primary',
    },
    image: {
      icon: faFileLines,
      className: 'text-primary',
    },
    pdf: {
      icon: faFilePdf,
      className: 'text-danger',
    },
  }[primaryMediaType];

  const hasHighlightedSummary = Boolean(highlightRecordsWithMetadataField)
    && metadataItems.some((metadataItem) => (
      metadataItem?.type === highlightRecordsWithMetadataField
    ))
    && typeof itemText === 'string';
  const summary = hasHighlightedSummary ? itemText : '';
  const snippet = selectBestCardSnippet({ summary, highlight, innerHits });

  let total = 0;
  let done = 0;
  if (!isAudioRecording) {
    total = transcriptiontype === 'sida' ? mediaCount : count;
    done = transcriptiontype === 'sida' ? mediaCountDone : countDone;
  }
  const fromMedia = countPageProgressFromMedia(mediaItems);
  const totalCount = Number(total);
  const hasSubrecordTotal = Number.isFinite(totalCount) && totalCount > 0;
  const pageTotal = hasSubrecordTotal ? totalCount : fromMedia.total;
  const safePageTotal = Math.max(pageTotal, 1);
  const doneCount = Number(done);
  const pageDone = Math.min(
    hasSubrecordTotal && Number.isFinite(doneCount) && doneCount >= 0
      ? doneCount
      : fromMedia.done,
    safePageTotal,
  );
  const showTranscriptionProgress = !isAudioRecording
    && transcriptionstatus !== 'readytocontribute'
    && pageTotal > 0;
  const transcriptionValue = showTranscriptionProgress
    ? `${pageDone} av ${pageTotal} ${pageTotal === 1 ? 'sida' : 'sidor'}`
    : '';
  const transcriptionLabel = showTranscriptionProgress
    ? `${l('Avskrivna')}: ${transcriptionValue}`
    : '';
  const transcriptionPercentage = showTranscriptionProgress
    ? Math.round((pageDone / safePageTotal) * 100)
    : 0;

  const cardClasses = [
    'group box-border block h-auto min-w-0 rounded-md !border p-4 no-underline shadow-sm',
    'bg-[var(--color-result-card-bg)] !text-body md:h-[22rem]',
    'transition-[background-color,border-color,box-shadow] duration-150',
    'hover:!border-primary hover:bg-surface-hover hover:no-underline hover:shadow',
    'focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-focus',
    'focus-visible:outline-offset-2',
    isSelected
      ? '!border-focus ring-2 ring-focus ring-offset-1 ring-offset-surface'
      : '!border-[var(--color-result-card-rule)]',
  ].join(' ');

  const handleRecordClick = () => {
    onRecordActivate?.(id);
  };

  return (
    <article className="h-full min-w-0">
      <Link to={recordUrl} className={cardClasses} onClick={handleRecordClick}>
        <div className="flex h-full min-w-0 flex-col">
          <div className="flex min-w-0 items-start gap-3">
            {thumbnail && (
              <img
                src={thumbnail}
                alt=""
                className="h-[112px] w-[72px] shrink-0 rounded-sm border border-[var(--color-result-card-rule)] object-contain p-0.5"
                loading="lazy"
                decoding="async"
                onError={hideBrokenImage}
              />
            )}
            {!thumbnail && mediaPreview && (
              <span
                className="flex h-[112px] w-[72px] shrink-0 items-center justify-center rounded-sm border border-[var(--color-result-card-rule)] bg-surface-muted"
                aria-hidden="true"
              >
                {primaryMediaType === 'audio' ? (
                  <AudioWaveIcon
                    className={`${mediaPreview.className} h-8 w-12`}
                  />
                ) : (
                  <FontAwesomeIcon
                    icon={mediaPreview.icon}
                    className={`${mediaPreview.className} text-3xl`}
                  />
                )}
              </span>
            )}

            <div className="min-w-0 flex-1">
              <p className="m-0 break-words text-sm leading-snug text-[var(--color-result-card-label)]">
                {archiveDisplay}
              </p>
              <Heading
                className="!mb-0 !mt-1 break-words !text-lg/[1.25] font-semibold !text-link md:line-clamp-3"
                dangerouslySetInnerHTML={{ __html: titleHtml }}
              />
              {snippet && <RecordCardSnippet text={snippet} />}
            </div>
          </div>

          <dl className="mt-auto space-y-1 pt-4 text-sm leading-snug text-body">
            {displayPlace && (
              <div className="grid min-w-0 grid-cols-[4.75rem_minmax(0,1fr)] gap-x-2">
                <dt className="font-medium text-muted">{l('Ort')}</dt>
                <dd className="m-0 min-w-0 break-words md:line-clamp-2">
                  {displayPlace}
                </dd>
              </div>
            )}
            {displayYear && (
              <div className="grid min-w-0 grid-cols-[4.75rem_minmax(0,1fr)] gap-x-2">
                <dt className="font-medium text-muted">{l('År')}</dt>
                <dd className="m-0 min-w-0">{displayYear}</dd>
              </div>
            )}
            {showCollectors && (
              <div className="grid min-w-0 grid-cols-[4.75rem_minmax(0,1fr)] gap-x-2">
                <dt className="font-medium text-muted">{l('Insamlare')}</dt>
                <dd className="m-0 min-w-0 break-words md:line-clamp-2">
                  {collectorNames}
                </dd>
              </div>
            )}
          </dl>

          <div className="mt-3 flex items-center md:min-h-[1.75rem]">
            {hasTranscription && (
              <span className="inline-flex items-center rounded-full border border-border bg-yellow-50 px-2 py-1 text-xs font-medium leading-none text-body">
                {l('Automatisk ljudavskrift')}
              </span>
            )}
            {showTranscriptionProgress && (
              <dl className="w-full text-xs text-body">
                <div className="grid min-w-0 grid-cols-[4.75rem_minmax(0,1fr)] items-center gap-x-2">
                  <dt className="font-medium text-muted">{l('Avskrivna')}</dt>
                  <dd className="m-0 flex min-w-0 items-center gap-2">
                    <span className="shrink-0">{transcriptionValue}</span>
                    <span
                      className="h-1.5 min-w-12 flex-1 overflow-hidden rounded-full border border-border bg-surface-muted"
                      role="progressbar"
                      aria-valuemin={0}
                      aria-valuemax={safePageTotal}
                      aria-valuenow={pageDone}
                      aria-label={transcriptionLabel}
                    >
                      <span
                        className="block h-full rounded-full bg-accent"
                        style={{ width: `${transcriptionPercentage}%` }}
                      />
                    </span>
                  </dd>
                </div>
              </dl>
            )}
          </div>
        </div>
      </Link>
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
  detailSearch: PropTypes.string,
  headingLevel: PropTypes.oneOf(['h2', 'h3', 'h4']),
};
