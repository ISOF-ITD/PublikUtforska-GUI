import { useCallback, useMemo, useState, useId } from "react";
import Uppteckningsblankett from "./transcriptionForms/Uppteckningsblankett";
import Fritext from "./transcriptionForms/Fritext";
import { l } from "../../../lang/Lang";

/* — Re-usable TW strings — */
const field =
  "w-full border border-gray-300 rounded-lg p-3 font-serif leading-relaxed " +
  "disabled:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-isof " +
  "focus:border-isof transition !mb-2";

export default function TranscriptionForm({
  sending,
  recordDetails,
  currentPageIndex,
  pages,
  transcriptionText,
  informantNameInput,
  informantBirthDateInput,
  informantBirthPlaceInput,
  informantInformationInput,
  nameInput,
  emailInput,
  titleInput,
  comment,
  inputChangeHandler,
  sendButtonClickHandler,
}) {
  /* ─── Local state ─────────────────────────── */
  const [emailValid, setEmailValid] = useState(true);
  const emailId = useId();
  const commentId = useId();

  const validateEmail = useCallback(
    (email) => email === "" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email),
    []
  );

  /* ─── Derived state ───────────────────────── */
  const page = pages[currentPageIndex] ?? {};
  const disableInput = page.transcriptionstatus !== "readytotranscribe";
  const isSent = !!page.isSent;

  const sendButtonLabel = isSent
    ? l("Sidan har skickats")
    : l(`Skicka sida ${currentPageIndex + 1} (av ${pages.length})`);

  /* ─── Shared props for sub-forms ───────────── */
  const commonProps = useMemo(
    () => ({
      messageInput: transcriptionText,
      inputChangeHandler,
      pageIndex: currentPageIndex,
      numberOfPages: pages.length,
      transcriptionstatus: page.transcriptionstatus,
      disableInput,
      titleInput,
    }),
    [
      transcriptionText,
      inputChangeHandler,
      currentPageIndex,
      pages.length,
      page.transcriptionstatus,
      disableInput,
      titleInput,
    ]
  );

  const uppteckningsProps = {
    informantNameInput,
    informantBirthDateInput,
    informantBirthPlaceInput,
    informantInformationInput,
    title: recordDetails.title,
    titleInput,
    ...commonProps,
  };

  /* ─── Handlers ─────────────────────────────── */
  const handleEmailBlur = (e) => setEmailValid(validateEmail(e.target.value));

  /* ─── UI ───────────────────────────────────── */
  return (
    <div className="space-y-6">
      {/* inner form — chooses layout based on type */}
      {page.transcriptiontype === "uppteckningsblankett" ? (
        <Uppteckningsblankett {...uppteckningsProps} />
      ) : (
        <Fritext {...commonProps} />
      )}

      {(page.transcriptionstatus === "readytotranscribe" || isSent) && (
        <fieldset
          className="space-y-6 bg-white shadow-sm rounded-lg p-6 border border-gray-200"
          disabled={disableInput}
        >
          {/* Kommentar */}
          <div>
            <label
              htmlFor={commentId}
              className="font-semibold block mb-1 leading-snug"
            >
              {l(
                `Kommentar till sidan ${currentPageIndex + 1} (av ${
                  pages.length
                })`
              )}
            </label>
            <textarea
              id={commentId}
              name="messageCommentInput"
              lang="sv"
              spellCheck="false"
              value={comment}
              onChange={inputChangeHandler}
              className={field + " h-40 resize-y"}
            />
          </div>

          {/* GDPR blurb */}
          <aside
            role="note"
            className="text-sm leading-relaxed space-y-1 bg-isof/5 p-3 rounded flex flex-col gap-2"
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
            {/* Namn */}
            <div>
              <label
                htmlFor="transcription_name"
                className="font-semibold mb-1"
              >
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

            {/* Email */}
            <div>
              <label
                htmlFor={emailId}
                className="font-semibold mb-1 leading-snug"
              >
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
                  field +
                  (emailValid ? "" : " border-red-500 focus:ring-red-500")
                }
              />
              {!emailValid && (
                <p
                  id={`${emailId}-help`}
                  className="mt-1 text-xs text-red-600"
                  aria-live="polite"
                >
                  {l("Ogiltig e-postadress")}
                </p>
              )}
            </div>
          </div>

          {/* Skicka-knapp */}
          <button
            type="button"
            onClick={sendButtonClickHandler}
            data-gotonext="true"
            className={`
              inline-flex items-center justify-center gap-2 px-6 py-2 rounded-lg
              font-semibold text-white shadow transition
              ${
                sending || disableInput
                  ? "bg-gray-400 cursor-not-allowed"
                  : "!bg-isof hover:!text-white hover:!bg-darker-isof hover:brightness-110 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-darker-isof"
              }
            `}
            disabled={disableInput || sending}
          >
            {sending ? l("Skickar…") : sendButtonLabel}
          </button>

          {/* Tack */}
          {isSent && (
            <p className="mt-4" aria-live="polite">
              {l(
                "Tack för din avskrift. Efter granskning kommer den att publiceras."
              )}
            </p>
          )}
        </fieldset>
      )}
    </div>
  );
}
