/* eslint-disable react/require-default-props */
import PropTypes from "prop-types";
import { l } from "../../../../lang/Lang";

export default function Fritext({
  messageInput = "",
  inputChangeHandler,
  pageIndex = null,
  numberOfPages = null,
  transcriptionstatus = null,
  disableInput = false,
}) {
  const isDisabled =
    disableInput ||
    (transcriptionstatus !== "readytotranscribe" &&
      transcriptionstatus !== null);

  return (
    <fieldset disabled={isDisabled} className="space-y-2 flex flex-col">
      <label htmlFor="transcription_text" className="font-semibold">
        Text
        {pageIndex !== null &&
          ` på sidan ${pageIndex + 1} (av ${numberOfPages})`}
      </label>

      <textarea
        id="transcription_text"
        name="messageInput"
        lang="sv"
        spellCheck="false"
        value={messageInput}
        onChange={inputChangeHandler}
        className="w-full min-h-[18rem] max-h-96 rounded border p-2 font-serif leading-relaxed resize-y disabled:bg-gray-100 !mb-0"
      />
      <span className="text-sm text-gray-600 self-end" aria-live="polite">
        {messageInput.trim().split(/\s+/).filter(Boolean).length} {l("ord")}
      </span>
    </fieldset>
  );
}

Fritext.propTypes = {
  messageInput: PropTypes.string,
  inputChangeHandler: PropTypes.func.isRequired,
  pageIndex: PropTypes.number,
  numberOfPages: PropTypes.number,
  transcriptionstatus: PropTypes.string,
  disableInput: PropTypes.bool,
};
