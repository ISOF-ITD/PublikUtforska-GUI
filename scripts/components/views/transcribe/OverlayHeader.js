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
    <>
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

      

      {!config.siteOptions.hideContactButton && (
        <>
          <FeedbackButton type="Uppteckning" title={recordDetails.title} />
          <ContributeInfoButton type="Uppteckning" title={recordDetails.title} />
          <TranscriptionHelpButton type="Uppteckning" title={recordDetails.title} />
        </>
      )}
    </>
  );
}

export default OverlayHeader;
