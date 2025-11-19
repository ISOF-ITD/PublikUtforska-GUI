import { useCallback, useMemo, useState, useId } from "react";
import Uppteckningsblankett from "./Uppteckningsblankett";
import { l } from "../../../lang/Lang";
import ContributorInfoFields from "./ContributorInfoFields";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChevronDown,
  faChevronUp,
  faCircleChevronDown,
  faCircleChevronUp,
} from "@fortawesome/free-solid-svg-icons";

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
  pagenumberInput = "",
  foneticSignsInput = false,
  unreadableInput = false,
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
  const [emailValid, setEmailValid] = useState(true);
  const emailId = useId();
  const commentId = useId();

  const validateEmail = useCallback(
    (email) => email === "" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email),
    []
  );

  const page = pages[currentPageIndex] ?? {};
  const disableInput = page.transcriptionstatus !== "readytotranscribe";
  const isSent = !!page.isSent;

  const sendButtonLabel = isSent
    ? l("Sidan har skickats")
    : l(`Skicka sida ${currentPageIndex + 1} (av ${pages.length})`);

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

  const handleEmailBlur = (e) => setEmailValid(validateEmail(e.target.value));
  const wordCount = transcriptionText
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
  const formValid = wordCount >= 2 && emailValid;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-center w-full">
        <button
          type="button"
          onClick={onToggleMetaFields}
          className="text-sm w-full flex items-center gap-2 !my-0"
        >
          {showMetaFields ? (
            <span className="w-full flex items-center justify-between">
              {l("Dölj uppgifter om uppteckningen")}{" "}
              <FontAwesomeIcon className="text-lg" icon={faCircleChevronUp} />
            </span>
          ) : (
            <span className="w-full flex items-center justify-between">
              {l("Visa uppgifter om uppteckningen")}{" "}
              <FontAwesomeIcon className="text-lg" icon={faCircleChevronDown} />
            </span>
          )}
        </button>
      </div>

      {/* 1) META: toggleable */}
      {showMetaFields && (
        <Uppteckningsblankett
          {...uppteckningsProps}
          disableInput={false}
          showMeta={true}
          showText={false}
        />
      )}

      {/* 2) TEXT: always visible */}
      <fieldset
        className="space-y-2 bg-white shadow-sm rounded-lg p-4 border border-gray-200"
        disabled={disableInput}
      >
        <label
          htmlFor="transcription_text_always"
          className="font-semibold block"
        >
          Text på sidan {currentPageIndex + 1} (av {pages.length})
        </label>
        <textarea
          id="transcription_text_always"
          name="messageInput"
          lang="sv"
          spellCheck="false"
          value={transcriptionText}
          onChange={inputChangeHandler}
          className="w-full min-h-[18rem] max-h-96 rounded border p-2 font-serif leading-relaxed resize-y disabled:bg-gray-100"
        />
        <span className="text-sm text-gray-600 self-end" aria-live="polite">
          {wordCount} {l("ord")}
        </span>
      </fieldset>

      {/* 2b) PAGE META: page number + flags */}
      <fieldset
        className="space-y-3 bg-white shadow-sm rounded-lg p-4 border border-gray-200"
        disabled={disableInput}
      >
        <div className="flex flex-col">
          <label
            htmlFor="transcription_pagenumber"
            className="font-semibold mb-1"
          >
            Sidnummer
          </label>
          <input
            id="transcription_pagenumber"
            name="pagenumberInput"
            type="text"
            value={pagenumberInput ?? ""}
            onChange={inputChangeHandler}
            className="w-32 rounded border p-2 font-serif disabled:bg-gray-100"
          />
          <span className="text-xs text-gray-500 mt-1">
            Du kan ändra om det inte stämmer.
          </span>
        </div>

        <div className="flex flex-col gap-2">
          <label className="inline-flex items-center gap-2">
            <input
              type="checkbox"
              name="foneticSignsInput"
              checked={!!foneticSignsInput}
              onChange={inputChangeHandler}
            />
            <span>Innehåller fonetiska tecken</span>
          </label>

          <label className="inline-flex items-center gap-2">
            <input
              type="checkbox"
              name="unreadableInput"
              checked={!!unreadableInput}
              onChange={inputChangeHandler}
            />
            <span>Sidan är svårläst eller delvis oläslig</span>
          </label>
        </div>
      </fieldset>

      {/* 3) Comment + contributor + send */}
      {(page.transcriptionstatus === "readytotranscribe" || isSent) && (
        <fieldset
          className="space-y-6 bg-white shadow-sm rounded-lg p-6 border border-gray-200"
          disabled={disableInput}
        >
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
            <span className="text-xs text-gray-500">
              {l(
                "Har du stött på något problem med avskriften eller har du någon annan kommentar till den? Skriv då i kommentarsfältet."
              )}
            </span>
          </div>

          <ContributorInfoFields
            nameInput={nameInput}
            emailInput={emailInput}
            onChange={inputChangeHandler}
            emailId={emailId}
            emailValid={emailValid}
            onEmailBlur={handleEmailBlur}
            disabled={disableInput}
          />

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
