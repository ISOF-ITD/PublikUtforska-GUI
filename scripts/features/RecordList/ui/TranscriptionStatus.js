/* eslint-disable react/require-default-props */
import PropTypes from "prop-types";
import { l } from "../../../lang/Lang";
import classNames from "classnames";

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
  total,
  done,
  media,
  transcriptiontype,
}) {
  if (transcriptiontype === 'audio') {
    return <span className="transcriptionstatus empty" />;
  }

  if (status !== 'readytocontribute') {
    const fromMedia = countPageProgressFromMedia(media);
    const pageTotal = total ?? fromMedia.total;
    const pageDone = done ?? fromMedia.done;

    if (pageTotal > 0) {
      const safeTotal = Math.max(pageTotal, 1);
      const clampedDone = Math.min(pageDone || 0, safeTotal);
      const pct = Math.round((clampedDone / safeTotal) * 100);

      const pageWord = pageTotal === 1 ? "sida" : "sidor";

      return (
        <div className="mr-2 space-y-1" role="group" aria-label={l('Avskrivna sidor')}>
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

  return <span className="transcriptionstatus empty" />;
}

TranscriptionStatus.propTypes = {
  status: PropTypes.string,
  total: PropTypes.number,
  done: PropTypes.number,
  media: PropTypes.array,
  transcriptiontype: PropTypes.string,
};
