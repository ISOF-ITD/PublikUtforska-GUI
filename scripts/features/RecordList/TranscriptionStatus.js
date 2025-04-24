/* eslint-disable react/require-default-props */
import PropTypes from "prop-types";
import { l } from "../../lang/Lang";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCommentDots } from "@fortawesome/free-solid-svg-icons";

/*  Swedish labels for page-/text-based material */
const labels = {
  readytotranscribe: "Nej",
  undertranscription: "Skrivs av",
  transcribed: "Granskas",
  reviewing: "Granskas",
  needsimprovement: "Granskas",
  approved: "Granskas",
  published: "Avskriven",
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
  if (transcriptiontype === "audio") {
    const count = done ?? 0;
    const bg = count ? "bg-lighter-isof" : "bg-white";

    return (
      <span
        className={`${bg} flex items-center gap-1 flex-nowrap ${pillClasses}`}
        title={`${count} ${l("beskrivningar")}`}
        aria-label={`${count} ${l("beskrivningar")}`}
      >
        <FontAwesomeIcon icon={faCommentDots} />
        {count}
        {/* visually-hidden word for screen readers only */}
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
          status === "published" ? "bg-lighter-isof" : "bg-white"
        } ${pillClasses}`}
      >
        {labels[status] ?? ""}
      </span>
    );
  }

  /* ─────────────────────────────────────────────────────────────
     ACCESSION progress bar for scanned pages 
  ───────────────────────────────────────────────────────────── */
  if (type === "accession" && total && transcriptiontype !== "audio") {
    const pct = Math.round((done / total) * 100);
    return (
      <div className="mr-2 space-y-1">
        <span className="text-sm">{`${done} av ${total}`}</span>
        <div
          className="h-2 w-full max-w-[200px] !border !border-isof rounded"
          title={`${pct}%`}
        >
          <span
            className="block h-full bg-isof rounded"
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
