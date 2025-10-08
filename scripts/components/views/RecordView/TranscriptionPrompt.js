import PropTypes from "prop-types";
import React, { useMemo } from "react";
import TranscribeButton from "../transcribe/TranscribeButton";
import { l } from "../../../lang/Lang";

// short keys; wrap with l()
const STRINGS = {
  underTranscription:
    "Den här uppteckningen håller på att transkriberas av annan användare.",
  underReview: "Den här uppteckningen är avskriven och granskas.",
  notTranscribed: "Den här uppteckningen är inte avskriven.",
  invitation:
    "Vill du vara med och tillgängliggöra samlingarna för fler? Hjälp oss att skriva av berättelser!",
  transcribe: "Skriv av",
  perPage: "sida för sida",
  of: "av",
  pages: "sidor",
  pagesTranscribed: "sidor avskrivna",
  pagesLeft: "kvar",
  readyPages: "redo att skrivas av",
  readyPagesPlural: "redo att skrivas av",
  randomCta: "Transkribera en slumpmässig uppteckning",
  lockedInfo:
    "Alla sidor är upptagna just nu. Testa en slumpmässig uppteckning!",
  noPagesInfo: "Den här uppteckningen saknar skannade sidor.",
  tipStartFirstFree: "Tips: Öppna för att starta på första lediga sidan.",
  recordLabel: "Uppteckning",
};

const statusStyles = (raw) => {
  const status = (raw || "").toLowerCase();
  switch (status) {
    case "readytotranscribe":
      return {
        label: "Kan skrivas av",
        cls: "bg-emerald-100 text-emerald-800 ring-emerald-600/20",
      };
    case "undertranscription":
      return {
        label: "Pågår",
        cls: "bg-amber-100 text-amber-800 ring-amber-600/20",
      };
    case "reviewing":
    case "transcribed":
    case "needsimprovement":
    case "approved":
      return {
        label: "Under granskning",
        cls: "bg-sky-100 text-sky-800 ring-sky-600/20",
      };
    case "published":
      return {
        label: "Publicerad",
        cls: "bg-gray-100 text-gray-800 ring-gray-600/20",
      };
    default:
      return {
        label: "Status okänd",
        cls: "bg-gray-100 text-gray-800 ring-gray-600/20",
      };
  }
};

export default function TranscriptionPrompt({ data }) {
  const {
    transcriptiontype = null,
    transcriptionstatus,
    media = [],
    title = "",
    id,
    archive,
    places = [],
    recordtype,
  } = data || {};

  if (recordtype === "one_accession_row" || transcriptionstatus === "published")
    return null;
  if (transcriptiontype === "audio") return null;

  const statusNorm = (transcriptionstatus || "").toLowerCase();
  const isUnderTranscription = statusNorm === "undertranscription";
  const statusId = `tp-status-${id}`;
  const progressId = `tp-progress-${id}`;

  // ---- derived state ----
  const derived = useMemo(() => {
    const total = Array.isArray(media) ? media.length : 0;

    let done = 0;
    let ready = 0;
    for (const m of media) {
      const s = (m?.transcriptionstatus || "").toLowerCase();
      if (s === "transcribed" || s === "published") done += 1;
      if (s === "readytotranscribe") ready += 1;
    }

    const isUnderReview = [
      "undertranscription",
      "transcribed",
      "reviewing",
      "needsimprovement",
      "approved",
    ].includes(statusNorm);

    const hasReadyPage =
      transcriptiontype === "sida"
        ? ready > 0
        : statusNorm === "readytotranscribe";

    const pagesLeft = total > 0 ? Math.max(total - done, 0) : 0;

    return {
      totalPages: total,
      transcribedCount: done,
      readyCount: ready,
      hasReadyPage,
      isUnderReview,
      pagesLeft,
      pill: statusStyles(transcriptionstatus),
      nextReadyText:
        transcriptiontype === "sida" && ready > 0
          ? `${ready} ${
              ready === 1 ? l(STRINGS.readyPages) : l(STRINGS.readyPagesPlural)
            }`
          : null,
    };
  }, [media, transcriptiontype, transcriptionstatus, statusNorm]);

  const {
    totalPages,
    transcribedCount,
    hasReadyPage,
    isUnderReview,
    pagesLeft,
    readyCount,
    pill,
    nextReadyText,
  } = derived;

  // Primary enabled
  const primaryEnabled =
    !isUnderTranscription &&
    (transcriptiontype === "sida"
      ? hasReadyPage
      : statusNorm === "readytotranscribe");

  // Short, scannable status line
  const statusLine =
    transcriptiontype === "sida" && totalPages > 0
      ? // compact: "X/Y sidor • Z kvar"
        `${transcribedCount}/${totalPages} ${l(
          STRINGS.pages
        )} • ${pagesLeft} ${l(STRINGS.pagesLeft)}`
      : l(STRINGS.notTranscribed);

  // Show a secondary random CTA when the main action is blocked or there are no free pages
  const showRandom =
    (!primaryEnabled &&
      (transcriptiontype === "sida" ? totalPages > 0 : true)) ||
    (transcriptiontype === "sida" && totalPages === 0);

  return (
    <section
      className="rounded-2xl !border !border-gray-200 bg-white/80 p-4 mb-2 shadow"
      aria-labelledby={`tp-${id}`}
      aria-describedby={statusId}
      aria-busy={isUnderTranscription ? "true" : undefined}
      data-testid="transcription-prompt"
    >
      {/* A11y heading for aria-labelledby */}
      <h2 id={`tp-${id}`} className="sr-only">
        {l(STRINGS.recordLabel)}: {title || id}
      </h2>

      {/* Header */}
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

      {/* Progress (sida only) */}
      {transcriptiontype === "sida" && totalPages > 0 && (
        <div className="mt-3" aria-live="polite">
          <div
            id={progressId}
            className="h-2 w-full lg:w-1/2 overflow-hidden rounded bg-gray-200"
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
      )}

      {/* Copy & CTAs */}
      <div className="mt-4 space-y-2">
        {/* State text (compact) */}
        <span className="text-gray-900">
          {statusNorm === "undertranscription"
            ? l(STRINGS.underTranscription)
            : isUnderReview
            ? l(STRINGS.underReview)
            : totalPages === 0 && transcriptiontype === "sida"
            ? l(STRINGS.noPagesInfo)
            : l(STRINGS.invitation)}
        </span>

        {/* Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Primary */}
          <TranscribeButton
            className="button button-primary inline-flex items-center justify-center rounded-lg px-3 py-2 text-sm font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:opacity-50 disabled:hover:cursor-not-allowed"
            label={`${l(STRINGS.transcribe)} ${
              transcriptiontype === "sida" ? l(STRINGS.perPage) : ""
            }`}
            title={title}
            recordId={id}
            archiveId={archive?.archive_id}
            places={places}
            images={media}
            transcriptionType={transcriptiontype}
            random={false}
            disabled={!primaryEnabled}
            aria-disabled={!primaryEnabled}
            aria-describedby={
              !primaryEnabled && transcriptiontype === "sida"
                ? statusId
                : undefined
            }
          />
          {/* Helpful note for disabled state (only when relevant) */}
          {!primaryEnabled &&
            statusNorm !== "undertranscription" &&
            transcriptiontype === "sida" &&
            totalPages > 0 &&
            readyCount === 0 && (
              <span className="ml-1 text-gray-900" role="note">
                {l(STRINGS.lockedInfo)}
              </span>
            )}
        </div>

        {/* Ready pages tip */}
        {transcriptiontype === "sida" && nextReadyText && (
          <span className="text-gray-700">{l(STRINGS.tipStartFirstFree)}</span>
        )}
      </div>
    </section>
  );
}

TranscriptionPrompt.propTypes = {
  data: PropTypes.shape({
    transcriptiontype: PropTypes.string,
    transcriptionstatus: PropTypes.string.isRequired,
    media: PropTypes.arrayOf(
      PropTypes.shape({
        transcriptionstatus: PropTypes.string,
      })
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
