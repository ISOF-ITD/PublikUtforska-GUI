import PropTypes from 'prop-types';
import { l } from '../../../lang/Lang';

function OverlayHeader({
  recordDetails,
  progressCurrent = 0,
  progressTotal = 0,
}) {
  const progressLabel = progressTotal > 1
    ? `${progressCurrent} / ${progressTotal}`
    : null;
  const heading = `Skriv av ${recordDetails.title || 'uppteckning'}`;
  const archiveLabel = recordDetails.archiveId
    ? `(ur ${recordDetails.archiveId}${
      recordDetails.placeString ? ` ${recordDetails.placeString}` : ''
    })`
    : null;
  const visibleProgressLabel = `${l('Sida')} ${progressLabel}`;
  const screenReaderProgressLabel = `${l('Du är på sida')} ${
    progressCurrent
  } ${l('av')} ${progressTotal}`;

  return (
    <header className="container-header mb-6">
      <h1 className="mb-2 !text-[var(--color-text-inverted)]">
        {heading}
        {archiveLabel && (
          <small>
            {' '}
            {archiveLabel}
          </small>
        )}
        {recordDetails.transcriptionType === 'sida' && (
          <small className="ml-2">(sida för sida)</small>
        )}
      </h1>
      {progressTotal > 1 && (
        <div className="mt-2 lg:w-1/2 w-full flex flex-col gap-1" aria-live="polite">
          <div
            className="h-1 overflow-hidden rounded bg-surface-muted"
            role="progressbar"
            aria-label={l('Transkriberingsprogress')}
            aria-valuenow={progressCurrent}
            aria-valuemin={0}
            aria-valuemax={progressTotal}
            title={`${l('Sida')}: ${progressLabel}`}
          >
            <div
              className="h-full bg-primary transition-all"
              style={{ width: `${(progressCurrent / progressTotal) * 100}%` }}
            />
          </div>
          <span className="self-start text-sm leading-none text-[var(--color-text-inverted)]">
            {visibleProgressLabel}
          </span>
          <span className="sr-only">
            {screenReaderProgressLabel}
          </span>
        </div>
      )}
    </header>
  );
}

OverlayHeader.propTypes = {
  recordDetails: PropTypes.object.isRequired,
  progressCurrent: PropTypes.number,
  progressTotal: PropTypes.number,
};

export default OverlayHeader;
