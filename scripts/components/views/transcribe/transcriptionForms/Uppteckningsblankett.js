/* eslint-disable react/require-default-props */
import PropTypes from "prop-types";

export default function Uppteckningsblankett({
  informantNameInput = "",
  informantBirthDateInput = "",
  informantBirthPlaceInput = "",
  informantInformationInput = "",
  title = "",
  messageInput = "",
  inputChangeHandler,
  pageIndex = null,
  titleInput = "",
  numberOfPages = null,
  disableInput = false,
}) {
  return (
    <fieldset disabled={disableInput} className="space-y-4">
      {/* ───── Name / Birth year / Birth place ───── */}
      <div className="grid gap-x-2 gap-y-4 md:grid-cols-12 mb-2">
        {/* Berättat av / Name */}
        <div className="md:col-span-6 flex flex-col">
          <label
            htmlFor="transcription_informantname"
            className="font-semibold mb-1"
          >
            Berättat av
          </label>
          <input
            id="transcription_informantname"
            name="informantNameInput"
            type="text"
            placeholder="Namn"
            value={informantNameInput}
            onChange={inputChangeHandler}
            className="rounded border p-2 font-serif disabled:bg-gray-100"
          />
        </div>

        {/* Född år / Birth year */}
        <div className="md:col-span-2 flex flex-col">
          <label
            htmlFor="transcription_informantbirthdate"
            className="font-semibold mb-1"
          >
            Född&nbsp;år
          </label>
          <input
            id="transcription_informantbirthdate"
            name="informantBirthDateInput"
            type="text"
            placeholder="År"
            value={informantBirthDateInput}
            onChange={inputChangeHandler}
            className="rounded border p-2 font-serif disabled:bg-gray-100"
          />
        </div>

        {/* Född i / Birth place */}
        <div className="md:col-span-4 flex flex-col">
          <label
            htmlFor="transcription_informantbirthplace"
            className="font-semibold mb-1 text-right"
          >
            Född&nbsp;i
          </label>
          <input
            id="transcription_informantbirthplace"
            name="informantBirthPlaceInput"
            type="text"
            placeholder="Ort"
            value={informantBirthPlaceInput}
            onChange={inputChangeHandler}
            className="rounded border p-2 font-serif disabled:bg-gray-100"
          />
        </div>
      </div>

      {/* Övrig informant-info */}
      <div>
        <label htmlFor="transcription_informant" className="font-semibold">
          Fält under berättat av (om det finns fler uppgifter nedskrivna):
        </label>
        <input
          id="transcription_informant"
          name="informantInformationInput"
          type="text"
          placeholder=""
          value={informantInformationInput}
          onChange={inputChangeHandler}
          className="w-full rounded border p-2 font-serif disabled:bg-gray-100"
        />
      </div>

      {/* Titel */}
      <div>
        <label htmlFor="transcription_title" className="font-semibold">
          Titel
        </label>
        <input
          id="transcription_title"
          name="titleInput"
          type="text"
          placeholder="Ex. Skördetraditioner"
          value={titleInput}
          onChange={inputChangeHandler}
          className="w-full rounded border p-2 font-serif disabled:bg-gray-100"
        />
      </div>

      {/* Själva texten */}
      <div>
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
          className="w-full min-h-[18rem] max-h-96 rounded border p-2 font-serif leading-relaxed resize-y disabled:bg-gray-100"
        />
      </div>
    </fieldset>
  );
}

Uppteckningsblankett.propTypes = {
  informantNameInput: PropTypes.string,
  informantBirthDateInput: PropTypes.string,
  informantBirthPlaceInput: PropTypes.string,
  informantInformationInput: PropTypes.string,
  title: PropTypes.string,
  titleInput: PropTypes.string,
  messageInput: PropTypes.string,
  inputChangeHandler: PropTypes.func.isRequired,
  pageIndex: PropTypes.number,
  numberOfPages: PropTypes.number,
  disableInput: PropTypes.bool,
};
