/* eslint-disable react/require-default-props */
import PropTypes from "prop-types";
import { l } from "../../../lang/Lang";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCommentDots } from "@fortawesome/free-solid-svg-icons";
import classNames from "classnames";

/*  Swedish labels for page-/text-based material */
const labels = {
  readytotranscribe: "Redo för avskrivning",
  undertranscription: "Skrivs av",
  transcribed: "Granskas",
  reviewing: "Granskas",
  needsimprovement: "Granskas",
  approved: "Granskas",
  published: "Avskriven",
  // readytocontribute: "Redo att bidra",
};

const DONE_PAGE_STATUSES = new Set([
  "undertranscription",
  "transcribed",
  "reviewing",
  "needsimprovement",
  "approved",
  "published",
]);

function countPageProgressFromMedia(media = []) {
  const pages = (Array.isArray(media) ? media : []).filter(
    (m) => m && m.type !== "pdf" // PDFs are not transcribable
  );

  const done = pages.reduce((acc, m) => {
    const st = m?.transcriptionstatus;
    return acc + (DONE_PAGE_STATUSES.has(st) ? 1 : 0);
  }, 0);

  return { total: pages.length, done };
}

export default function TranscriptionStatus({
  status,
  type,
  total,
  done,
  media,
  pillClasses,
  transcriptiontype,
}) {
  /* ─────────────────────────────────────────────────────────────
     AUDIO: show a passive counter
  ───────────────────────────────────────────────────────────── */
  if (transcriptiontype === "audio" && status === "readytocontribute") {
    const count = done ?? 0;
    const bg = count ? "!bg-lighter-isof" : "bg-white";

    return (
      <span
        className={classNames(bg,  pillClasses, "flex items-center gap-1 flex-nowrap")}
        title={`${count} ${l("beskrivningar")}`}
        aria-label={`${count} ${l("beskrivningar")}`}
      >
        <FontAwesomeIcon icon={faCommentDots} />
        {count}
        <span className="sr-only"> {l("beskrivningar")}</span>
      </span>
    );
  }

  /* ─────────────────────────────────────────────────────────────
     ACCESSION progress bar for scanned pages (derived from media[])
     - excludes PDFs
  ───────────────────────────────────────────────────────────── */
  if (type === "accession" && transcriptiontype !== "audio" && status !== "readytocontribute" && transcriptiontype) {
    const fromMedia = countPageProgressFromMedia(media);
    const pageTotal = total ?? fromMedia.total;
    const pageDone = done ?? fromMedia.done;

    if (pageTotal > 0) {
      const safeTotal = Math.max(pageTotal, 1);
      const clampedDone = Math.min(pageDone || 0, safeTotal);
      const pct = Math.round((clampedDone / safeTotal) * 100);

      const pageWord = pageTotal === 1 ? "sida" : "sidor";

      return (
        <div className="mr-2 space-y-1" role="group" aria-label={l("Förlopp")}>
          <span className="text-xs break-words">
            {`${clampedDone} av ${pageTotal} ${pageWord}`}
          </span>

          <div
            className="relative h-2 w-full max-w-[200px] overflow-hidden rounded border border-isof border-solid bg-white"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={safeTotal}
            aria-valuenow={clampedDone}
            aria-label={l("Avskrivna sidor")}
            title={`${pct}%`}
          >
            <span
              className={classNames(
                "absolute inset-0 h-full bg-lighter-isof",
                pct === 100 ? "rounded" : "rounded-l"
              )}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      );
    }
  }

  /* ─────────────────────────────────────────────────────────────
     RECORD-LEVEL pill (non-accession)
  ───────────────────────────────────────────────────────────── */
  if (status && status !== "accession" && status !== "readytocontribute") {
    return (
      <span
        className={`${
          status === "published" ? "bg-gray-300" : "!bg-lighter-isof"
        } ${pillClasses} text-center`}
      >
        {labels[status] ?? status}
      </span>
    );
  }

  return <span className="transcriptionstatus empty" />;
}

TranscriptionStatus.propTypes = {
  status: PropTypes.string,
  type: PropTypes.string,
  total: PropTypes.number,
  done: PropTypes.number,
  media: PropTypes.array,
  pillClasses: PropTypes.string.isRequired,
  transcriptiontype: PropTypes.string,
};
