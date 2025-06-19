/* eslint-disable react/require-default-props */
import PropTypes from "prop-types";

export default function Fritext({
  messageInput = "",
  inputChangeHandler,
  pageIndex = null,
  transcriptionstatus = null,
  numberOfPages = null,
}) {
  const disabled =
    transcriptionstatus !== "readytotranscribe" && transcriptionstatus !== null;

  return (
    <div className="text-sm">
      <label htmlFor="transcription_text" className="block mb-0 font-semibold">
        Text
        {pageIndex !== null &&
          ` på sidan ${pageIndex + 1} (av ${numberOfPages})`}
      </label>

      <textarea
        id="transcription_text"
        name="messageInput"
        lang="sv"
        spellCheck="false"
        disabled={disabled}
        value={messageInput}
        onChange={inputChangeHandler}
        className="w-full border border-gray-300 rounded p-2 font-serif leading-relaxed h-96 mt-1"
      />
    </div>
  );
}

Fritext.propTypes = {
  messageInput: PropTypes.string,
  inputChangeHandler: PropTypes.func.isRequired,
  pageIndex: PropTypes.number,
  transcriptionstatus: PropTypes.string,
  numberOfPages: PropTypes.number,
};
