import PropTypes from 'prop-types';
import TranscribeButton from '../../TranscriptionPageByPageOverlay/ui/TranscribeButton';
import { l } from '../../../lang/Lang';
import useTranscriptionAvailability from '../../../hooks/useTranscriptionAvailability';

// short keys; wrap with l()
const STRINGS = {
  invitation:
    'Vill du vara med och tillgängliggöra samlingarna för fler? Hjälp oss att skriva av berättelser!',
  transcribe: 'Skriv av',
  perPage: 'sida för sida',
  pages: 'sidor',
  pagesTranscribed: 'sidor avskrivna',
  pagesLeft: 'kvar',
  readyPages: 'redo att skrivas av',
  readyPagesPlural: 'redo att skrivas av',
  lockedInfo:
    'Alla sidor är upptagna just nu. Testa en slumpmässig uppteckning!',
  tipStartFirstFree:
    'Tips: Tryck för att starta på den första otranskriberade sidan.',
  recordLabel: 'Uppteckning',
};

const statusStyles = (raw) => {
  const status = (raw || '').toLowerCase();

  switch (status) {
    case 'readytotranscribe':
      return {
        label: 'Kan skrivas av',
        cls: 'bg-emerald-100 text-emerald-800 ring-emerald-600/20',
      };
    case 'undertranscription':
      return {
        label: 'Pågår',
        cls: 'bg-amber-100 text-amber-800 ring-amber-600/20',
      };
    case 'reviewing':
    case 'transcribed':
    case 'needsimprovement':
    case 'approved':
      return {
        label: 'Under granskning',
        cls: 'bg-sky-100 text-sky-800 ring-sky-600/20',
      };
    case 'published':
      return {
        label: 'Publicerad',
        cls: 'bg-gray-100 text-gray-800 ring-gray-600/20',
      };
    default:
      return {
        label: 'Status okänd',
        cls: 'bg-gray-100 text-gray-800 ring-gray-600/20',
      };
  }
};

export default function TranscriptionCTA({ data }) {
  const isTranscriptionAvailable = useTranscriptionAvailability();
  const {
    transcriptiontype = null,
    transcriptionstatus,
    media = [],
    title = '',
    id,
    archive,
    places = [],
  } = data || {};

  const mediaItems = Array.isArray(media) ? media : [];
  const imagePages = mediaItems.filter(
    (item) => (item?.type || '').toLowerCase() === 'image',
  );
  const hasImagePages = imagePages.length > 0;
  const hasAudioMedia = mediaItems.some(
    (item) => (item?.type || '').toLowerCase().includes('audio'),
  );
  const normalizedTranscriptionType = transcriptiontype || (hasImagePages ? 'sida' : '');
  const isAudioRecord = (
    normalizedTranscriptionType === 'audio'
    || (!transcriptiontype && hasAudioMedia && !hasImagePages)
  );

  const { transcribedCount, readyCount, transcribableCount } = imagePages.reduce(
    (counts, page) => {
      const pageStatus = (page?.transcriptionstatus || '').toLowerCase();
      const isCompleted = pageStatus === 'transcribed' || pageStatus === 'published';
      const isReady = pageStatus === 'readytotranscribe';
      const isTranscribable = !pageStatus || isReady;

      return {
        transcribedCount: counts.transcribedCount + (isCompleted ? 1 : 0),
        readyCount: counts.readyCount + (isReady ? 1 : 0),
        transcribableCount: counts.transcribableCount + (isTranscribable ? 1 : 0),
      };
    },
    {
      transcribedCount: 0,
      readyCount: 0,
      transcribableCount: 0,
    },
  );

  // Show the CTA when at least one image page can be transcribed.
  if (
    !isTranscriptionAvailable
    || isAudioRecord
    || !hasImagePages
    || readyCount === 0
  ) {
    return null;
  }

  const totalPages = imagePages.length;
  const pagesLeft = Math.max(totalPages - transcribedCount, 0);
  const primaryEnabled = transcribableCount > 0;
  const pill = statusStyles(transcriptionstatus);
  const statusId = `tp-status-${id}`;
  const progressId = `tp-progress-${id}`;
  const statusLine = `${transcribedCount}/${totalPages} ${l(
    STRINGS.pages,
  )} - ${pagesLeft} ${l(STRINGS.pagesLeft)}`;
  const readyPagesLabel = readyCount === 1
    ? l(STRINGS.readyPages)
    : l(STRINGS.readyPagesPlural);
  const nextReadyText = readyCount > 0 ? `${readyCount} ${readyPagesLabel}` : null;

  return (
    <section
      className="rounded-2xl !border !border-gray-200 bg-white/80 p-4 mb-2 shadow"
      aria-labelledby={`tp-${id}`}
      aria-describedby={statusId}
      data-testid="transcription-prompt"
    >
      <h2 id={`tp-${id}`} className="sr-only">
        {`${l(STRINGS.recordLabel)}: ${title || id}`}
      </h2>

      <div className="mt-1 flex items-center gap-2">
        <span
          className={`inline-flex items-center rounded-full px-2 py-1 text-sm font-medium ring-1 ring-inset whitespace-nowrap ${pill.cls}`}
          aria-label={l(pill.label)}
        >
          {l(pill.label)}
        </span>
        <span id={statusId} className="text-gray-900" aria-live="polite">
          {statusLine}
        </span>
      </div>

      <div className="mt-3" aria-live="polite">
        <div
          id={progressId}
          className="h-2 w-full overflow-hidden rounded bg-gray-200 lg:w-1/2"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={totalPages}
          aria-valuenow={Math.min(transcribedCount, totalPages)}
          aria-label={l(STRINGS.pagesTranscribed)}
          title={`${transcribedCount}/${totalPages}`}
        >
          <div
            className="h-full rounded bg-emerald-500 transition-all"
            style={{
              width: `${
                totalPages > 0 ? (transcribedCount / totalPages) * 100 : 0
              }%`,
            }}
          />
        </div>
      </div>

      <div className="mt-4 space-y-2">
        <span className="text-gray-900">{l(STRINGS.invitation)}</span>

        <div className="flex flex-wrap items-center gap-2">
          <TranscribeButton
            className="button button-primary inline-flex items-center justify-center rounded-lg px-3 py-2 text-sm font-medium shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 disabled:opacity-50 disabled:hover:cursor-not-allowed"
            label={`${l(STRINGS.transcribe)} ${l(STRINGS.perPage)}`}
            title={title}
            recordId={id}
            archiveId={archive?.archive_id}
            places={places}
            images={imagePages}
            transcriptionType={normalizedTranscriptionType}
            random={false}
            disabled={!primaryEnabled}
            aria-disabled={!primaryEnabled}
            aria-describedby={!primaryEnabled ? statusId : undefined}
          />
          {!primaryEnabled && (
            <span className="ml-1 text-gray-900" role="note">
              {l(STRINGS.lockedInfo)}
            </span>
          )}
        </div>

        {nextReadyText && (
          <span className="text-gray-700">{l(STRINGS.tipStartFirstFree)}</span>
        )}
      </div>
    </section>
  );
}

TranscriptionCTA.propTypes = {
  data: PropTypes.shape({
    transcriptiontype: PropTypes.string,
    transcriptionstatus: PropTypes.string.isRequired,
    media: PropTypes.arrayOf(
      PropTypes.shape({
        transcriptionstatus: PropTypes.string,
        type: PropTypes.string,
      }),
    ),
    title: PropTypes.string,
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    archive: PropTypes.shape({
      archive_id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    }),
    places: PropTypes.arrayOf(PropTypes.object),
    recordtype: PropTypes.string.isRequired,
  }).isRequired,
};
