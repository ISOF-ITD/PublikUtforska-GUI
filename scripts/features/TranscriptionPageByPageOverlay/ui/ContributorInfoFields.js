import PropTypes from 'prop-types';
import { l } from '../../../lang/Lang';

const field = 'w-full rounded-lg border border-border bg-surface p-3 font-serif leading-relaxed text-body '
  + 'disabled:bg-disabled focus:outline-none focus-visible:ring-2 focus-visible:ring-focus '
  + 'focus-visible:border-focus transition !mb-2';

export default function ContributorInfoFields({
  nameInput,
  emailInput,
  onChange,
  emailId,
  emailValid,
  onEmailBlur,
  disabled = false,
}) {
  const emailClassName = `${field}${
    emailValid ? '' : ' border-danger focus-visible:ring-danger'
  }`;

  return (
    <>
      <aside
        role="note"
        className="flex flex-col gap-2 rounded bg-surface-muted p-3 text-sm leading-relaxed text-body"
      >
        <span>
          {l(
            'Vill du att vi anger att det är du som har skrivit av uppteckningen? Ange i så fall ditt namn och din e-postadress nedan. E-postadressen publiceras inte.',
          )}
        </span>
        <span>
          {l('Vi hanterar personuppgifter enligt dataskyddsförordningen.')}
          {' '}
          <a
            href="https://www.isof.se/om-oss/behandling-av-personuppgifter.html"
            target="_blank"
            rel="noreferrer"
            className="font-semibold text-link underline hover:text-link-hover"
          >
            {l('Läs mer.')}
          </a>
        </span>
      </aside>

      <div className="flex flex-col gap-2" aria-disabled={disabled}>
        <div>
          <label htmlFor="transcription_name" className="font-semibold mb-1">
            {l('Ditt namn (frivilligt)')}
          </label>
          <input
            id="transcription_name"
            name="nameInput"
            autoComplete="name"
            type="text"
            value={nameInput}
            onChange={onChange}
            className={field}
            disabled={disabled}
          />
        </div>

        <div>
          <label
            htmlFor={emailId}
            className="font-semibold mb-1 leading-snug"
          >
            {l('Din e-postadress (frivilligt)')}
          </label>
          <input
            id={emailId}
            name="emailInput"
            autoComplete="email"
            type="email"
            value={emailInput}
            onChange={onChange}
            onBlur={onEmailBlur}
            aria-invalid={!emailValid}
            aria-describedby={!emailValid ? `${emailId}-help` : undefined}
            className={emailClassName}
            disabled={disabled}
          />
          {!emailValid && (
            <p
              id={`${emailId}-help`}
              className="mt-1 text-xs text-danger"
              aria-live="polite"
            >
              {l('Ogiltig e-postadress')}
            </p>
          )}
        </div>
      </div>
    </>
  );
}

ContributorInfoFields.propTypes = {
  nameInput: PropTypes.string.isRequired,
  emailInput: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  emailId: PropTypes.string.isRequired,
  emailValid: PropTypes.bool.isRequired,
  onEmailBlur: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
};
