/* eslint-disable react/require-default-props */
import PropTypes from "prop-types";
import { l } from "../../../lang/Lang";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCommentDots } from "@fortawesome/free-solid-svg-icons";

/*  Swedish labels for page-/text-based material */
const labels = {
  readytotranscribe: "Redo för avskrivning",
  undertranscription: "Skrivs av",
  transcribed: "Granskas",
  reviewing: "Granskas",
  needsimprovement: "Granskas",
  approved: "Granskas",
  published: "Avskriven",
  readytocontribute: "Redo att bidra",
};

export default function TranscriptionStatus({
  status,
  type,
  total,
  done,
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
        className={`${bg} flex items-center gap-1 flex-nowrap ${pillClasses}`}
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
     RECORD-LEVEL pill for handwritten/text pages 
  ───────────────────────────────────────────────────────────── */
  if (status && status !== "accession") {
    return (
      <span
        className={`${
          status === "published" ? "bg-gray-300" : "!bg-lighter-isof"
        } ${pillClasses} mt-1`}
      >
        {labels[status] ??
          String(status).charAt(0).toUpperCase() + String(status).slice(1)}
      </span>
    );
  }

  /* ─────────────────────────────────────────────────────────────
     ACCESSION progress bar for scanned pages 
  ───────────────────────────────────────────────────────────── */
  if (type === "accession" && total && transcriptiontype !== "audio") {
    const safeTotal = total > 0 ? total : 1;
    const pct = Math.round(((done || 0) / safeTotal) * 100);
    return (
      <div className="mr-2 space-y-1" role="group" aria-label={l("Förlopp")}>
        <span className="text-sm">{`${done} av ${total}`}</span>
        <div
          className="relative h-2 w-full max-w-[200px] overflow-hidden rounded border border-isof border-solid bg-white"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={safeTotal}
          aria-valuenow={done || 0}
          aria-label={l("Avskrivna sidor")}
          title={`${pct}%`}
        >
          <span
            className="absolute inset-0 h-full bg-lighter-isof rounded-l"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    );
  }

  return <span className="transcriptionstatus empty" />;
}

TranscriptionStatus.propTypes = {
  status: PropTypes.string,
  type: PropTypes.string,
  total: PropTypes.number,
  done: PropTypes.number,
  pillClasses: PropTypes.string.isRequired,
  transcriptiontype: PropTypes.string,
};
