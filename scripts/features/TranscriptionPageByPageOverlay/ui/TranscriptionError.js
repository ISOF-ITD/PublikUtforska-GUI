import { useId, useRef } from 'react';
import PropTypes from 'prop-types';
import { l } from '../../../lang/Lang';

const ERROR_MESSAGES = {
  SESSION_MISSING: 'Avskrivningssessionen saknas. Kopiera din text till ett eget dokument innan du öppnar transkriberingen på nytt.',
  OFFLINE: 'Du verkar sakna internetanslutning. Kontrollera anslutningen och försök igen.',
  NETWORK_ERROR: 'Kontakten med servern avbröts eller kunde inte upprättas. Kontrollera internetanslutningen och försök igen.',
  HTTP_ERROR: 'Servern svarade med ett fel. Försök igen om en stund. Om felet kvarstår, kontakta oss med feluppgifterna nedan.',
  INVALID_RESPONSE: 'Vi fick inget giltigt svar från servern. Försök igen om en stund. Om felet kvarstår, kontakta oss med feluppgifterna nedan.',
  API_REJECTED: 'Servern godkände inte begäran. Kontakta oss med feluppgifterna nedan om det inte hjälper att försöka igen.',
};

export default function TranscriptionError({ error, messageId }) {
  const reportId = useId();
  const reportRef = useRef(null);
  const isSave = error?.operation === 'save';
  const report = error ? [
    `${l('Åtgärd')}: ${isSave ? l('Spara avskrift') : l('Starta avskrivningssession')}`,
    `${l('Accessionens ID')}: ${error.recordId}`,
    ...(error.page ? [`${l('Bildfil')}: ${error.page}`] : []),
    ...(error.pageNumber ? [`${l('Sidnummer')}: ${error.pageNumber}`] : []),
    `${l('Tidpunkt (UTC)')}: ${error.timestamp}`,
    `${l('Felkod')}: ${error.code}`,
    ...(error.httpStatus ? [`HTTP: ${error.httpStatus}`] : []),
    ...(isSave ? [`${l('Avskrivningssession')}: ${error.hasSession ? l('Finns') : l('Saknas')}`] : []),
    ...(error.serverMessage ? [`${l('Serverns meddelande')}: ${error.serverMessage}`] : []),
  ].join('\n') : '';

  return (
    <div>
      <div id={messageId} role="alert" aria-atomic="true">
        {error && (
          <div className="mt-3 rounded-lg border border-border bg-surface-muted p-4 text-body">
            <p className="!mt-0 font-semibold">
              {isSave
                ? l('Det gick inte att bekräfta att avskriften sparades.')
                : l('Det gick inte att starta avskrivningssessionen.')}
            </p>
            <p>{l(ERROR_MESSAGES[error.code])}</p>
            {isSave && error.code !== 'SESSION_MISSING' && (
              <p className="!mb-0">
                {l('Din text finns kvar på sidan. Kopiera den till ett eget dokument innan du laddar om eller lämnar sidan.')}
              </p>
            )}
          </div>
        )}
      </div>
      {error && (
        <details className="mt-2 rounded-lg border border-border bg-surface p-3 text-body">
          <summary className="cursor-pointer rounded-sm text-link underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus">
            {l('Feluppgifter för support')}
          </summary>
          <p>{l('Kopiera feluppgifterna och skicka dem till oss när du beskriver problemet.')}</p>
          <label htmlFor={reportId} className="block font-semibold">
            {l('Feluppgifter att kopiera')}
          </label>
          <textarea
            id={reportId}
            ref={reportRef}
            readOnly
            value={report}
            rows={8}
            className="mt-2 h-48 w-full min-w-0 resize-y rounded border border-border bg-surface p-2 leading-relaxed text-body focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
          />
          <button
            type="button"
            className="mt-2 h-auto min-h-[44px] whitespace-normal rounded border border-border bg-surface px-3 py-2 text-sm leading-normal text-link focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
            onClick={() => {
              reportRef.current?.focus();
              reportRef.current?.select();
            }}
          >
            {l('Markera feluppgifter för kopiering')}
          </button>
        </details>
      )}
    </div>
  );
}

TranscriptionError.propTypes = {
  error: PropTypes.shape({
    operation: PropTypes.oneOf(['start', 'save']).isRequired,
    code: PropTypes.oneOf(Object.keys(ERROR_MESSAGES)).isRequired,
    recordId: PropTypes.string.isRequired,
    page: PropTypes.string,
    pageNumber: PropTypes.string,
    timestamp: PropTypes.string.isRequired,
    hasSession: PropTypes.bool.isRequired,
    httpStatus: PropTypes.number,
    serverMessage: PropTypes.string,
  }),
  messageId: PropTypes.string.isRequired,
};
