import PropTypes from "prop-types";

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
  type /* "accession" | "record" */,
  total,
  done,
  pillClasses,
}) {
  /* record-level pill */
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

  /* accession progress bar */
  if (type === "accession" && total) {
    const pct = Math.round((done / total) * 100);
    return (
      <div className="mr-2 space-y-1">
        <span className="text-sm">{`${done} av ${total}`}</span>
        <div
          className="h-2 w-full max-w-[200px] border border-isof rounded"
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
};
