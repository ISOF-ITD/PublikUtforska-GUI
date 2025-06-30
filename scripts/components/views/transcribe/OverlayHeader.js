import config from "../../../config";
import PropTypes from "prop-types";
import { l } from "../../../lang/Lang";

import ContributeInfoButton from "../ContributeInfoButton";
import FeedbackButton from "../FeedbackButton";
import TranscriptionHelpButton from "./TranscriptionHelpButton";
import TranscribeButton from "./TranscribeButton";

/**
 * Header for the page-by-page overlay.
 * Har nu en TranscribeButton i "random"‑läge som både avbryter pågående
 * transkribering och hämtar ett nytt slumpmässigt dokument.
 */
function OverlayHeader({
  recordDetails,
  handleHideOverlay,
  transcribeCancel,
  progressCurrent = 0,
  progressTotal = 0,
}) {
  const progressLabel =
    progressTotal > 1
      ? `${progressCurrent} / ${progressTotal}`
      : null; /* NB &ndash; keeps spaces with NBSP */
  return (
    <>
      Skriv av&nbsp;
      {recordDetails.title || "uppteckning"}
      {recordDetails.archiveId && (
        <small>
          &nbsp;(ur {recordDetails.archiveId}
          {recordDetails.placeString ? ` ${recordDetails.placeString}` : ""})
        </small>
      )}
      {recordDetails.transcriptionType === "sida" && (
        <small>(sida för sida)</small>
      )}
      {progressTotal > 1 && (
        <div className="mt-2 lg:w-1/2 w-full flex flex-col gap-1" aria-live="polite">
          <div
            className="h-1 bg-gray-200 rounded overflow-hidden"
            role="progressbar"
            aria-valuenow={progressCurrent}
            aria-valuemin={0}
            aria-valuemax={progressTotal}
            title={`${l("Sida")}: ${progressLabel}`}
          >
            <div
              className="h-full bg-lighter-isof transition-all"
              style={{ width: `${(progressCurrent / progressTotal) * 100}%` }}
            />
          </div>
          <span className="text-sm leading-none text-white self-start">
            {l("Sida")} {progressLabel}
          </span>
          <span className="sr-only">
            {l("Du är på sida")} {progressCurrent} {l("av")} {progressTotal}
          </span>
        </div>
      )}
      {!config.siteOptions.hideContactButton && (
        <>
          <FeedbackButton type="Uppteckning" title={recordDetails.title} />
          <ContributeInfoButton
            type="Uppteckning"
            title={recordDetails.title}
          />
          <TranscriptionHelpButton
            type="Uppteckning"
            title={recordDetails.title}
          />
        </>
      )}
    </>
  );
}

OverlayHeader.propTypes = {
  recordDetails: PropTypes.object.isRequired,
  handleHideOverlay: PropTypes.func,
  transcribeCancel: PropTypes.func,
  progressCurrent: PropTypes.number,
  progressTotal: PropTypes.number,
};

export default OverlayHeader;
