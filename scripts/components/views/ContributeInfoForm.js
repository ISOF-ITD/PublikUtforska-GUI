/* eslint-disable react/require-default-props */
import classNames from 'classnames';
import PropTypes from 'prop-types';
import {
  useCallback,
  useId,
  useMemo,
  useState,
} from 'react';
import { useLocation } from 'react-router-dom';
import config from '../../config';
import { l } from '../../lang/Lang';
import { toastError, toastOk } from '../../utils/toast';

const MESSAGE_KIND_OPTIONS = [
  { value: 'information', label: 'Komplettera eller rätta en uppgift' },
  { value: 'question', label: 'Ställ en fråga' },
  { value: 'feedback', label: 'Lämna en synpunkt' },
];

const ERROR_MESSAGE = 'Något gick fel. Meddelandet kunde inte skickas. Vänligen försök senare, eller kontakta oss på folke@isof.se.';

export default function ContributeInfoForm({
  title, type, id, onClose,
}) {
  const [sending, setSending] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [messageInput, setMessageInput] = useState('');
  const [messageKind, setMessageKind] = useState('information');
  const [emailValid, setEmailValid] = useState(true);
  const emailId = useId();
  const nameId = useId();
  const msgId = useId();
  const messageKindId = useId();
  const { pathname } = useLocation();

  const wordCount = useMemo(
    () => (messageInput.trim() ? messageInput.trim().split(/\s+/).length : 0),
    [messageInput],
  );
  const validateEmail = useCallback(
    (email) => email === '' || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email),
    [],
  );
  const formValid = wordCount >= 2 && validateEmail(emailInput);

  const showError = () => {
    setErrorMsg(l(ERROR_MESSAGE));
    toastError(l(ERROR_MESSAGE));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!formValid || sending) return;

    setSending(true);
    setErrorMsg('');

    let subject = config.appUrl || window.location.origin || '';
    if (subject.endsWith('/')) subject = subject.slice(0, -1);
    const messageKindLabel = MESSAGE_KIND_OPTIONS.find(
      ({ value }) => value === messageKind,
    )?.label || MESSAGE_KIND_OPTIONS[0].label;
    const data = {
      from_email: emailInput,
      from_name: nameInput,
      subject: `${subject.split(/[/]+/).pop()}: VetDuMer-${messageKind}`,
      recordid: id,
      message: [
        `Ärende: ${messageKindLabel}\n${type}: ${title}\n${pathname}`,
        `Från: ${nameInput || l('Anonym')} (${emailInput || l('ingen e-post')})`,
        messageInput,
      ].join('\n\n'),
    };
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    try {
      const formData = new FormData();
      formData.append('json', JSON.stringify(data));
      const response = await fetch(`${config.restApiUrl}feedback/`, {
        method: 'POST',
        body: formData,
        signal: controller.signal,
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const json = await response.json();
      const succeeded = json?.success === true || json?.success === 'true';

      if (succeeded) {
        toastOk(l('Tack för ditt bidrag. Meddelandet skickat.'));
        onClose();
      } else {
        showError();
      }
    } catch (error) {
      if (error?.name !== 'AbortError') showError();
    } finally {
      clearTimeout(timeout);
      setSending(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      <p className="mb-3 text-body">
        {l('Här kan du komplettera eller rätta en uppgift, ställa en fråga eller lämna en synpunkt om materialet.')}
      </p>
      {config.siteOptions.contributeInfoText && (
        <details className="mb-4 rounded border border-border bg-surface-muted px-3 py-2 text-body">
          <summary className="cursor-pointer font-semibold text-link">
            {l('Mer om att bidra med kunskap')}
          </summary>
          <p className="mb-2 mt-3">{config.siteOptions.contributeInfoText}</p>
          <a
            href="https://www.isof.se/folkminnen/beratta-for-oss.html"
            target="_blank"
            rel="noreferrer"
          >
            <strong>{l('Läs mer.')}</strong>
          </a>
        </details>
      )}
      {errorMsg && (
        <div
          className="mb-4 rounded border border-red-200 bg-red-50 px-3 py-2 text-red-800"
          role="status"
          aria-live="polite"
        >
          {errorMsg}
        </div>
      )}

      <fieldset className="mb-4 border-0 p-0">
        <legend className="mb-2 font-medium text-body">
          {l('Vad gäller ditt meddelande?')}
        </legend>
        <div className="grid gap-2 sm:grid-cols-3">
          {MESSAGE_KIND_OPTIONS.map((option) => (
            <label
              key={option.value}
              htmlFor={`${messageKindId}-${option.value}`}
              className="flex cursor-pointer items-start gap-2 rounded border border-border bg-surface px-3 py-2 text-body hover:bg-surface-hover"
            >
              <input
                id={`${messageKindId}-${option.value}`}
                type="radio"
                name="message-kind"
                value={option.value}
                checked={messageKind === option.value}
                onChange={(event) => setMessageKind(event.target.value)}
                disabled={sending}
                className="mt-1 shrink-0 accent-primary"
              />
              <span>{l(option.label)}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <label htmlFor={nameId} className="block font-medium !mt-4">
        {l('Ditt namn (frivilligt)')}
      </label>
      <input
        id={nameId}
        name="name"
        autoComplete="name"
        className="u-full-width mb-3 w-full"
        type="text"
        value={nameInput}
        disabled={sending}
        onChange={(event) => setNameInput(event.target.value)}
      />

      <label htmlFor={emailId} className="block font-medium">
        {l('Din e-postadress (frivilligt)')}
      </label>
      <input
        id={emailId}
        name="email"
        autoComplete="email"
        className={classNames('u-full-width w-full', !emailValid && 'invalid')}
        type="email"
        value={emailInput}
        disabled={sending}
        onChange={(event) => {
          setEmailInput(event.target.value);
          if (!emailValid) setEmailValid(true);
        }}
        onBlur={(event) => setEmailValid(validateEmail(event.target.value))}
        aria-invalid={!emailValid}
        aria-describedby={!emailValid ? `${emailId}-help` : undefined}
      />
      <div className="min-h-[1.25rem]">
        {!emailValid && (
          <span id={`${emailId}-help`} className="form-help error" aria-live="polite">
            {l('Ogiltig e-postadress')}
          </span>
        )}
      </div>

      <label htmlFor={msgId} className="block font-medium">
        {l('Meddelande')}
      </label>
      <textarea
        id={msgId}
        name="message"
        lang="sv"
        spellCheck="false"
        className="u-full-width w-full"
        value={messageInput}
        onChange={(event) => setMessageInput(event.target.value)}
        rows={6}
        required
        disabled={sending}
      />

      <span className="sr-only" aria-live="polite">
        {sending ? l('Skickar…') : ''}
      </span>
      <aside role="note" className="form-help mb-4">
        <span>
          {l('Vi hanterar personuppgifter enligt dataskyddsförordningen.')}
          {' '}
          <a
            href="https://www.isof.se/om-oss/behandling-av-personuppgifter.html"
            target="_blank"
            rel="noreferrer"
          >
            {l('Läs mer.')}
          </a>
        </span>
      </aside>

      <div className="mt-2 flex w-full items-center justify-end gap-2">
        <button type="button" className="button-secondary" onClick={onClose} disabled={sending}>
          {l('Dölj formuläret')}
        </button>
        <button
          className={classNames('button-primary', !formValid && 'hover:cursor-not-allowed')}
          type="submit"
          disabled={!formValid || sending}
          aria-busy={sending || undefined}
          title={!formValid ? l('Knappen aktiveras när du har skrivit minst två ord.') : undefined}
        >
          {sending ? l('Skickar…') : l('Skicka')}
        </button>
      </div>
    </form>
  );
}

ContributeInfoForm.propTypes = {
  title: PropTypes.string.isRequired,
  type: PropTypes.string.isRequired,
  id: PropTypes.string,
  onClose: PropTypes.func.isRequired,
};
