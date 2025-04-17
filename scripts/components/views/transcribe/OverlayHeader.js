import config from '../../../config';

import ContributeInfoButton from '../ContributeInfoButton';
import FeedbackButton from '../FeedbackButton';
import TranscriptionHelpButton from './TranscriptionHelpButton';
import TranscribeButton from './TranscribeButton';

/**
 * Header för sida‑för‑sida‑overlayen.
 * Har nu en TranscribeButton i "random"‑läge som både avbryter pågående
 * transkribering och hämtar ett nytt slumpmässigt dokument.
 */
function OverlayHeader({ recordDetails, handleHideOverlay, transcribeCancel }) {
  return (
    <div className="overlay-header">
      Skriv av&nbsp;
      {recordDetails.title || 'uppteckning'}
      {recordDetails.archiveId && (
        <small>
          &nbsp;(ur
          {' '}
          {recordDetails.archiveId}
          {recordDetails.placeString ? ` ${recordDetails.placeString}` : ''}
          )
        </small>
      )}
      {' '}
      {recordDetails.transcriptionType === 'sida' && (
        <small>(sida för sida)</small>
      )}

      {/* Stäng‑knapp */}
      <button
        type="button"
        title="stäng"
        className="close-button white"
        onClick={handleHideOverlay}
        aria-label="Stäng"
      />

      <TranscribeButton
        className="button button-primary next-random-record-button"
        random
        label="Skriv av annan slumpmässig uppteckning"
        transcribeCancel={transcribeCancel}
      />
      {/* Ny slump‑knapp + vanliga kontaktknappar */}
      {!config.siteOptions.hideContactButton && (
        <>
          <FeedbackButton type="Uppteckning" title={recordDetails.title} />
          <ContributeInfoButton type="Uppteckning" title={recordDetails.title} />
          <TranscriptionHelpButton type="Uppteckning" title={recordDetails.title} />
        </>
      )}
    </div>
  );
}

export default OverlayHeader;
