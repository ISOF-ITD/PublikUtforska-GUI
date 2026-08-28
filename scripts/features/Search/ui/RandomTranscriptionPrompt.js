import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPen } from '@fortawesome/free-solid-svg-icons';
import { l } from '../../../lang/Lang';
import config from '../../../config';
import TranscribeButton from '../../TranscriptionPageByPageOverlay/ui/TranscribeButton';

export default function RandomTranscriptionPrompt() {
  return (
    <section
      className="mt-3 rounded-md border border-border bg-surface-muted p-3 text-body"
      aria-labelledby="random-transcription-heading"
    >
      <h2 id="random-transcription-heading" className="!m-0 !text-lg text-body">
        {l('Kom igång direkt')}
      </h2>
      <TranscribeButton
        className="!mb-0 !h-auto !min-h-[2.75rem] !whitespace-normal !break-words !py-2 !leading-snug"
        transcriptionstatus="readytotranscribe"
        label={(
          <>
            <FontAwesomeIcon icon={faPen} aria-hidden="true" />
            {l('Skriv av slumpmässigt vald uppteckning')}
            {config.specialEventTranscriptionCategoryLabel && (
              <span className="text-sm">
                {config.specialEventTranscriptionCategoryLabel}
              </span>
            )}
          </>
        )}
        random
        ariaLabel={l('Skriv av slumpmässigt vald uppteckning')}
        variant="listLike"
      />
    </section>
  );
}
