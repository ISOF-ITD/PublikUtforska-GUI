import React from "react";
import PropTypes from "prop-types";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faDownload,
  faCaretDown,
  faCaretUp,
  faInfoCircle,
  faCirclePlus,
  faTimes,
} from "@fortawesome/free-solid-svg-icons";
import ListPlayButton from "../ListPlayButton";
import DescriptionList from "./DescriptionList";
import AddDescriptionForm from "./AddDescriptionForm";

function AudioItemRow({
  item,
  audioTitle,
  recordId,
  openItems,
  onToggle,
  showAddForm,
  onToggleAddForm,
  isLocked,
  hasSession,
  serverHasOngoingSession,
  config,
  formData,
  setFormData,
  handleSave,
  hasUnsavedChanges,
  setHasUnsavedChanges,
}) {
  return (
    <>
      {/* Main row for the audio item */}
      <tr className="odd:bg-gray-50 even:bg-white border-b last:border-b-0 border-gray-200">
        <td className="py-2 px-4">
          <ListPlayButton media={item} recordId={recordId} recordTitle={audioTitle} />
        </td>
        <td className="py-2 px-4">{audioTitle}</td>
        <td className="py-2 px-4 flex gap-2 items-center">
          <a
            className="text-isof hover:text-darker-isof transition-colors duration-200 flex hover:cursor-pointer px-2 py-2"
            aria-expanded={openItems[item.source] ? "true" : "false"}
            aria-controls={`descriptions-${item.source}`}
            onClick={() => onToggle(item.source)}
          >
            {openItems[item.source] ? (
              <span className="whitespace-nowrap">
                <span className="px-1">Stäng</span>{" "}
                <FontAwesomeIcon icon={faCaretUp} />
              </span>
            ) : (
              <span className="whitespace-nowrap">
                <span className="px-1">Visa Innehåll</span>{" "}
                <FontAwesomeIcon icon={faCaretDown} />
              </span>
            )}
          </a>
          <a
            href={`${config.audioUrl}${item.source}`}
            download
            title="Ladda ner ljudfilen"
            className="text-isof hover:text-darker-isof no-underline hover:cursor-pointer"
          >
            <span className="px-1 underline underline-offset-2">Ladda ner</span>{" "}
            <FontAwesomeIcon icon={faDownload} />
          </a>
        </td>
      </tr>

      {/* If open, show descriptions + add-content button */}
      {openItems[item.source] && (
        <tr id={`descriptions-${item.source}`} aria-hidden={!openItems[item.source]}>
          <td colSpan={3} className="py-4 px-4 border-isof">
            {/* The existing descriptions table */}
            <DescriptionList item={item} recordId={recordId} audioTitle={audioTitle} />

            {/* If the server or local says there's a session in use, show the warning, otherwise show button */}
            {serverHasOngoingSession && !hasSession ? (
              <div className="flex justify-center my-4">
                <div className="px-4 py-2 bg-gray-200 text-gray-700 rounded flex items-center">
                  <FontAwesomeIcon icon={faInfoCircle} className="mr-2" />
                  <span>
                    Någon annan håller på att lägga till en beskrivning.
                    Försök igen senare.
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex justify-center my-4">
                <a
                  type="button"
                  className={`transition-all duration-300 ease-in-out flex gap-2 justify-center items-center rounded hover:cursor-pointer w-full px-4 py-2 ${
                    showAddForm[item.source]
                      ? "bg-gray-200 hover:bg-gray-300 text-gray-700"
                      : "bg-isof hover:bg-darker-isof text-white"
                  }`}
                  onClick={() => onToggleAddForm(item.source)}
                >
                  {showAddForm[item.source] ? (
                    <>
                      <span className="flex-grow text-left">
                        Lägg till ny beskrivning
                      </span>
                      <FontAwesomeIcon icon={faTimes} />
                    </>
                  ) : (
                    <>
                    <FontAwesomeIcon icon={faCirclePlus} />
                      <span>Lägg till ny beskrivning</span>
                    </>
                  )}
                </a>
              </div>
            )}

            {/* The form for adding new content */}
            {showAddForm[item.source] && (
              <AddDescriptionForm
                source={item.source}
                formData={formData}
                setFormData={setFormData}
                isLocked={isLocked}
                hasSession={hasSession}
                handleSave={handleSave}
                onCancel={() => onToggleAddForm(item.source)}
                hasUnsavedChanges={hasUnsavedChanges}
                setHasUnsavedChanges={setHasUnsavedChanges}
              />
            )}
          </td>
        </tr>
      )}
    </>
  );
}

AudioItemRow.propTypes = {
  item: PropTypes.object.isRequired,
  audioTitle: PropTypes.string.isRequired,
  recordId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  openItems: PropTypes.object.isRequired,
  onToggle: PropTypes.func.isRequired,
  showAddForm: PropTypes.object.isRequired,
  onToggleAddForm: PropTypes.func.isRequired,
  isLocked: PropTypes.bool.isRequired,
  hasSession: PropTypes.bool.isRequired,
  serverHasOngoingSession: PropTypes.bool.isRequired,
  config: PropTypes.object.isRequired,
  formData: PropTypes.object.isRequired,
  setFormData: PropTypes.func.isRequired,
  handleSave: PropTypes.func.isRequired,
  hasUnsavedChanges: PropTypes.bool.isRequired,
  setHasUnsavedChanges: PropTypes.func.isRequired,
};

export default AudioItemRow;
