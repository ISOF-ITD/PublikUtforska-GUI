import { useCallback, useMemo, useState, useId } from "react";
import Uppteckningsblankett from "./transcriptionForms/Uppteckningsblankett";
import { l } from "../../../lang/Lang";
import ContributorInfoFields from "./transcriptionForms/ContributorInfoFields";

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
  showMetaFields,
  onToggleMetaFields,
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
  const wordCount = transcriptionText
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
  const formValid = wordCount >= 2 && emailValid;

  /* ─── UI ───────────────────────────────────── */
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">Uppgifter om uppteckningen</h2>
        <button
          type="button"
          onClick={onToggleMetaFields}
          className="text-sm underline"
        >
          {showMetaFields ? "Dölj fälten" : "Visa fälten"}
        </button>
      </div>

      {showMetaFields && (
        // record-level fields should NOT be disabled just because this page was sent
        <Uppteckningsblankett {...uppteckningsProps} disableInput={false} />
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
          <ContributorInfoFields
            nameInput={nameInput}
            emailInput={emailInput}
            onChange={inputChangeHandler}
            emailId={emailId}
            emailValid={emailValid}
            onEmailBlur={handleEmailBlur}
            disabled={disableInput}
          />

          {/* Skicka-knapp */}
          <button
            type="button"
            onClick={sendButtonClickHandler}
            data-gotonext="true"
            className={`
          inline-flex items-center justify-center gap-2 px-6 py-2 rounded-lg
          font-semibold text-white shadow transition
          ${
            sending || disableInput || !formValid
              ? "bg-gray-400 !cursor-not-allowed !hover:text-white"
              : "!bg-isof hover:!text-white hover:!bg-darker-isof hover:brightness-110 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-darker-isof"
          }
        `}
            disabled={disableInput || sending || !formValid}
            title={
              !formValid
                ? l(
                    "Knappen aktiveras när du har skrivit minst två ord i Text-fältet"
                  )
                : undefined
            }
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
