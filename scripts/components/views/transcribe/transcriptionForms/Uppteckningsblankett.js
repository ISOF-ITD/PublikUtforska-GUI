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
  numberOfPages = null,
}) {
  return (
    <div className="space-y-4 text-sm">
      {/* Rad 1 – etiketter */}
      <div className="grid gap-2 md:grid-cols-12 font-semibold">
        <label htmlFor="transcription_informantname" className="md:col-span-6">
          Berättat av
        </label>
        <label
          htmlFor="transcription_informantbirthdate"
          className="md:col-span-2"
        >
          Född år
        </label>
        <label
          htmlFor="transcription_informantbirthplace"
          className="md:col-span-4"
        >
          Född i
        </label>
      </div>

      {/* Rad 2 – inputs */}
      <div className="grid gap-2 md:grid-cols-12">
        <input
          id="transcription_informantname"
          name="informantNameInput"
          type="text"
          value={informantNameInput}
          onChange={inputChangeHandler}
          className="md:col-span-6 border border-gray-300 rounded p-2 font-serif"
        />

        <input
          id="transcription_informantbirthdate"
          name="informantBirthDateInput"
          type="text"
          value={informantBirthDateInput}
          onChange={inputChangeHandler}
          className="md:col-span-2 border border-gray-300 rounded p-2 font-serif"
        />

        <input
          id="transcription_informantbirthplace"
          name="informantBirthPlaceInput"
          type="text"
          value={informantBirthPlaceInput}
          onChange={inputChangeHandler}
          className="md:col-span-4 border border-gray-300 rounded p-2 font-serif"
        />
      </div>

      {/* Övrig informant-info */}
      <div>
        <label
          htmlFor="transcription_informant"
          className="block mb-0 font-semibold"
        >
          Fält under berättat av (om det finns fler uppgifter nedskrivna)
        </label>
        <input
          id="transcription_informant"
          name="informantInformationInput"
          type="text"
          value={informantInformationInput}
          onChange={inputChangeHandler}
          className="w-full border border-gray-300 rounded p-2 font-serif mb-1"
        />
      </div>

      {/* Titel */}
      <div>
        <label
          htmlFor="transcription_title"
          className="block mb-0 font-semibold"
        >
          Titel
        </label>
        <input
          id="transcription_title"
          name="titleInput"
          type="text"
          value={title}
          onChange={inputChangeHandler}
          className="w-full border border-gray-300 rounded p-2 font-serif mb-1"
        />
      </div>

      {/* Själva texten */}
      <div>
        <label
          htmlFor="transcription_text"
          className="block mb-0 font-semibold"
        >
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
          className="w-full border border-gray-300 rounded p-2 font-serif leading-relaxed h-96"
        />
      </div>
    </div>
  );
}

Uppteckningsblankett.propTypes = {
  informantNameInput: PropTypes.string,
  informantBirthDateInput: PropTypes.string,
  informantBirthPlaceInput: PropTypes.string,
  informantInformationInput: PropTypes.string,
  title: PropTypes.string,
  messageInput: PropTypes.string,
  inputChangeHandler: PropTypes.func.isRequired,
  pageIndex: PropTypes.number,
  numberOfPages: PropTypes.number,
};
