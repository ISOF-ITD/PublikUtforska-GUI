import classNames from 'classnames';
import PropTypes from 'prop-types';
import { useCallback, useState, useId } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import config from '../../../config';
import useTranscriptionAvailability from '../../../hooks/useTranscriptionAvailability';
import { createRecordTaskLocation } from '../../../utils/routeHelper';
import { toastError } from '../../../utils/toast';

export default function TranscribeButton({
  transcriptionstatus = null,
  random = false,
  recordId = '',
  className = '',
  onClick = null,
  label = null,
  helptext = null,
  disabled = false,
  variant = 'primary',
  ariaLabel = null,
  ariaDescribedBy = null,
  // optional info about which page to open first
  initialPageIndex = null,
  initialPageSource = null,
}) {
  const [busy, setBusy] = useState(false);
  const isTranscriptionAvailable = useTranscriptionAvailability();
  const location = useLocation();
  const navigate = useNavigate();

  const autoId = useId();
  const helpTextId = helptext ? `transcribe-help-${autoId}` : undefined;
  const describedBy = [helpTextId, ariaDescribedBy].filter(Boolean).join(' ')
    || undefined;

  const startTranscription = useCallback((id, media = null) => {
    navigate(createRecordTaskLocation({
      recordId: id,
      taskPath: 'transcribe',
      pathname: location.pathname,
      search: location.search,
      media,
    }));
  }, [location.pathname, location.search, navigate]);

  const fetchRandomAndStart = useCallback(async () => {
    try {
      setBusy(true);

      // Build a robust URL regardless of how specialEventTranscriptionCategory is formatted.
      const url = new URL(`${config.apiUrl}random_document/`);
      const params = new URLSearchParams({
        type: 'arkiv',
        recordtype: 'one_accession_row',
        transcriptionstatus: 'readytotranscribe',
        categorytypes: 'tradark',
        publishstatus: 'published',
      });

      const extra = (config.specialEventTranscriptionCategory || '')
        .toString()
        .replace(/^[&?]/, '')
        .split('&')
        .filter(Boolean);

      extra.forEach((keyValue) => {
        const [k, v = ''] = keyValue.split('=');
        if (k) params.append(k, v);
      });

      url.search = params.toString();

      const response = await fetch(url.toString());
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const json = await response.json();
      const hit = Reflect.get(json?.hits?.hits?.[0] || {}, '_source');

      if (!hit) {
        toastError('Det finns ingen uppteckning att skriva av just nu.');
        return;
      }

      startTranscription(hit.id);
    } catch {
      toastError('Det gick inte att hämta en slumpmässig uppteckning.');
    } finally {
      setBusy(false);
    }
  }, [startTranscription]);

  const defaultOnClick = useCallback(() => {
    if (random) {
      if (!busy) fetchRandomAndStart();
      return;
    }
    const initialMedia = initialPageSource ?? initialPageIndex;
    startTranscription(recordId, initialMedia);
  }, [
    busy,
    fetchRandomAndStart,
    random,
    recordId,
    startTranscription,
    initialPageIndex,
    initialPageSource,
  ]);

  const effectiveOnClick = onClick || defaultOnClick;

  if (
    (!config.activateTranscription || !isTranscriptionAvailable)
    || (!transcriptionstatus
      || !transcriptionstatus.includes('readytotranscribe'))
  ) {
    return null;
  }
  const isDisabled = disabled || busy;

  return (
    <div className="m-0 p-0 w-full">
      {helptext && <div id={helpTextId}>{helptext}</div>}
      <button
        className={classNames(
          // base
          'flex items-center justify-center gap-2 h-10 px-3 !text-base leading-none tracking-normal border border-solid',
          'no-underline cursor-pointer mb-4 print:hidden transition-opacity duration-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-surface',
          // variants
          variant === 'primary' && 'border-white !text-white',
          variant === 'listLike'
            && 'w-full rounded-md border-transparent bg-surface px-3 py-2 font-medium text-body shadow hover:bg-surface-hover',
          // custom extra classes last
          className,
        )}
        onClick={effectiveOnClick}
        type="button"
        disabled={isDisabled}
        aria-disabled={isDisabled}
        aria-label={ariaLabel || undefined}
        aria-describedby={describedBy}
        data-random={random ? 'true' : 'false'}
        data-busy={busy ? 'true' : 'false'}
        title={typeof label === 'string' ? label : undefined}
      >
        {label}
      </button>
    </div>
  );
}

TranscribeButton.propTypes = {
  transcriptionstatus: PropTypes.string,
  random: PropTypes.bool,
  recordId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  className: PropTypes.string,
  onClick: PropTypes.func,
  label: PropTypes.node,
  helptext: PropTypes.node,
  disabled: PropTypes.bool,
  variant: PropTypes.oneOf(['primary', 'listLike']),
  ariaLabel: PropTypes.string,
  ariaDescribedBy: PropTypes.string,
  initialPageIndex: PropTypes.number,
  initialPageSource: PropTypes.string,
};
