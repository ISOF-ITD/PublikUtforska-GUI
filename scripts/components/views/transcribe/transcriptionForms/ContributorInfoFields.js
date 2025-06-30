import { useId } from "react";
import { l } from "../../../../lang/Lang";

/*
 * Name, e-mail, optional comment and GDPR blurb.
 */
export default function ContributorInfoFields({
  messageCommentInput,
  nameInput,
  emailInput,
  inputChangeHandler,
  emailValid,
  setEmailValid,
}) {
  const emailId = useId();
  const commentId = useId();

  const validateEmail = (email) =>
    email === "" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleEmailBlur = (e) => setEmailValid(validateEmail(e.target.value));

  const field =
    "w-full border border-gray-300 rounded-lg p-3 font-serif leading-relaxed " +
    "disabled:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-isof " +
    "focus:border-isof transition !mb-2";

  return (
    <fieldset className="space-y-6 bg-white shadow-sm rounded-lg p-6 border border-gray-200 !mt-0">
      {/* Kommentar */}
      <div>
        <label
          htmlFor={commentId}
          className="font-semibold block mb-1 leading-snug"
        >
          {l("Kommentar till avskriften")}
        </label>
        <textarea
          id={commentId}
          name="messageCommentInput"
          lang="sv"
          spellCheck="false"
          value={messageCommentInput}
          onChange={inputChangeHandler}
          className={field + " h-40 resize-y"}
        />
      </div>

      {/* GDPR text */}
      <aside
        role="note"
        className="text-sm flex flex-col leading-relaxed gap-2 bg-isof/5 p-3 rounded"
      >
        <span>
          {l(
            "Vill du att vi anger att det är du som har skrivit av uppteckningen? Ange i så fall ditt namn och din e-postadress nedan. E-postadressen publiceras inte."
          )}
        </span>
        <span>
          {l("Vi hanterar personuppgifter enligt dataskyddsförordningen.")}
          &nbsp;
          <a
            href="https://www.isof.se/om-oss/behandling-av-personuppgifter.html"
            target="_blank"
            rel="noreferrer"
            className="underline text-isof font-semibold"
          >
            {l("Läs mer.")}
          </a>
        </span>
      </aside>

      {/* Namn & e-post */}
      <div className="flex flex-col gap-2">
        <div>
          <label htmlFor="transcription_name" className="font-semibold mb-1">
            {l("Ditt namn (frivilligt)")}
          </label>
          <input
            id="transcription_name"
            name="nameInput"
            autoComplete="name"
            type="text"
            value={nameInput}
            onChange={inputChangeHandler}
            className={field}
          />
        </div>

        <div>
          <label htmlFor={emailId} className="font-semibold mb-1 leading-snug">
            {l("Din e-postadress (frivilligt)")}
          </label>
          <input
            id={emailId}
            name="emailInput"
            autoComplete="email"
            type="email"
            value={emailInput}
            onChange={inputChangeHandler}
            onBlur={handleEmailBlur}
            aria-invalid={!emailValid}
            aria-describedby={!emailValid ? `${emailId}-help` : undefined}
            className={
              field + (emailValid ? "" : " border-red-500 focus:ring-red-500")
            }
          />
          {!emailValid && (
            <span
              id={`${emailId}-help`}
              className="text-red-600"
              aria-live="polite"
            >
              {l("Ogiltig e-postadress")}
            </span>
          )}
        </div>
      </div>
    </fieldset>
  );
}
