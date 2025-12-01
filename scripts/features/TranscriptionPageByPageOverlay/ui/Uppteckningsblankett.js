/* eslint-disable react/require-default-props */
import PropTypes from "prop-types";
import { l } from "../../../lang/Lang";

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
  // NEW:
  showMeta = true,
  showText = true,
}) {
  return (
    <fieldset disabled={disableInput} className="space-y-1">
      {/* ───── Meta / “formulär” part ───── */}
      {showMeta && (
        <>
          <div className="grid gap-x-2 gap-y-4 md:grid-cols-12 mb-2">
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

          <div>
            <label htmlFor="transcription_informant" className="font-semibold">
              Fält under "Berättat av"
            </label>
            <input
              id="transcription_informant"
              name="informantInformationInput"
              type="text"
              value={informantInformationInput}
              onChange={inputChangeHandler}
              placeholder="Om det finns fler uppgifter nedskrivna"
              className="w-full rounded border p-2 font-serif disabled:bg-gray-100"
            />
          </div>

          <div>
            <label htmlFor="transcription_title" className="font-semibold">
              Titel (eller "Uppgiften rör")
            </label>
            <input
              id="transcription_title"
              name="titleInput"
              type="text"
              placeholder="Om titeln inte står på sidan kan du lämna detta tomt."
              value={titleInput}
              onChange={inputChangeHandler}
              className="w-full rounded border p-2 font-serif disabled:bg-gray-100"
            />
          </div>
        </>
      )}

      {/* ───── The actual free-text / transcription part ───── */}
      {showText && (
        <div className="flex flex-col">
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
        </div>
      )}
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
  // NEW:
  showMeta: PropTypes.bool,
  showText: PropTypes.bool,
};
