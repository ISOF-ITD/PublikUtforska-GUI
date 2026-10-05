import { useEffect, useId, useState } from 'react';
import PropTypes from 'prop-types';
import { l } from '../../../lang/Lang';

const buttonClass = 'h-auto min-h-11 rounded border border-border bg-surface px-4 py-2 text-body '
  + 'whitespace-normal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus';

export default function TranscriptionDraftNotice({
  candidates, storageError, restored, onRestore, onDismiss,
}) {
  const selectId = useId();
  const [selected, setSelected] = useState('');
  useEffect(() => setSelected(candidates[0]?.key || ''), [candidates]);

  return (
    <>
      <p role="alert" aria-atomic="true" className="text-body">
        {storageError && l('Utkastet kunde inte sparas i webbläsaren. Texten finns kvar på sidan. Kopiera den innan du lämnar sidan.')}
      </p>
      <p role="status" aria-atomic="true" className="text-body">
        {restored && l('Utkastet har återställts. Ändringar du redan gjort på sidan har behållits. Avskriften behöver fortfarande skickas in.')}
      </p>
      {!!candidates.length && (
        <section aria-label={l('Sparade utkast')} className="mb-4 rounded-lg border border-border bg-surface-muted p-4 text-body">
          <p>{l('Det finns ett lokalt utkast för denna accession. Utkast sparas i den här webbläsaren i sju dagar efter senaste ändringen.')}</p>
          <label htmlFor={selectId} className="block font-semibold">{l('Välj utkast')}</label>
          <select
            id={selectId}
            value={selected}
            onChange={(event) => setSelected(event.target.value)}
            className="mb-3 min-h-11 w-full min-w-0 rounded border border-border bg-surface p-2 text-body focus-visible:ring-2 focus-visible:ring-focus"
          >
            {candidates.map((draft, index) => (
              <option key={draft.key} value={draft.key}>
                {`${index + 1}. ${new Date(draft.updatedAt).toLocaleString('sv-SE')} (${draft.pages.length} ${l('sidor')})`}
              </option>
            ))}
          </select>
          <div className="flex flex-wrap gap-3">
            <button type="button" className={buttonClass} onClick={() => onRestore(selected)}>{l('Återställ utkast')}</button>
            <button type="button" className={buttonClass} onClick={onDismiss}>{l('Fortsätt utan att återställa')}</button>
          </div>
        </section>
      )}
    </>
  );
}

TranscriptionDraftNotice.propTypes = {
  candidates: PropTypes.arrayOf(PropTypes.shape({
    key: PropTypes.string.isRequired,
    updatedAt: PropTypes.number.isRequired,
    pages: PropTypes.arrayOf(PropTypes.object).isRequired,
  })).isRequired,
  storageError: PropTypes.bool.isRequired,
  restored: PropTypes.bool.isRequired,
  onRestore: PropTypes.func.isRequired,
  onDismiss: PropTypes.func.isRequired,
};
