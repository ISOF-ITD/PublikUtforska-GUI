import React, { useState } from "react";
import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faDownload,
  faCaretDown,
  faCaretUp,
  faInfoCircle,
  faTimes,
  faCirclePlus,
} from "@fortawesome/free-solid-svg-icons";
import ListPlayButton from "./ListPlayButton";
import DescriptionList from "./DescriptionList";
import DescriptionForm from "./DescriptionForm";
import config from "../../config";
import ConfirmationModal from "./ConfirmationModal";

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
  handleDelete,

  // we receive these from AudioItems so we can lock/unlock:
  startTranscribe,
  cancelTranscribe,

  formData,
  setFormData,
  setInitialFormData,
  handleSave,
  hasUnsavedChanges,
  setHasUnsavedChanges,
  savedUserInfo,
  canContribute,
  highlightData,
}) {
  // If user is editing an existing description:
  const [editDesc, setEditDesc] = useState(null);

  const descriptionsCount = item.description?.length || 0;

  /**
   * Called when user clicks "Ändra" on an existing description.
   */
  function onEditDesc(desc) {
    // If not locked, and no current session, start one:
    if (!isLocked && !hasSession) {
      startTranscribe();
    }
    setEditDesc(desc);
  }

  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [descToDelete, setDescToDelete] = useState(null);

  /**
   * Called when user finishes (Spara) or cancels the edit form.
   * We'll call parent's handleSave to do the POST, then also cancel the session
   * so that others can edit.
   */
  async function onSaveDescription(payload) {
    try {
      if (editDesc) {
        const updatedPayload = {
          ...payload,
          start_from: editDesc.start,
          start_to: payload.start,
          change_from: editDesc.text,
          change_to: payload.text,
          terms: payload.terms,
        };
        await handleSave(updatedPayload);
      } else {
        await handleSave(payload);
      }
    } finally {
      setEditDesc(null);
      cancelTranscribe();
    }
  }

  /**
   * If the user clicks "Avbryt" while editing,
   * we close the form and cancel the transcribe session.
   */
  function onCancelEdit() {
    setEditDesc(null);
    cancelTranscribe();
  }

  return (
    <>
      {/* Main row for the audio item */}
      <tr className="odd:bg-gray-50 even:bg-white border-b last:border-b-0 border-gray-200">
        <td className="py-2 px-4">
          <ListPlayButton
            media={item}
            recordId={recordId}
            recordTitle={audioTitle}
          />
        </td>
        <td className="py-2 px-4">
          {audioTitle}
          {Array.isArray(highlightData) && highlightData.some(h => h._source && h._source.text) ? (
            <div className="bg-yellow-200 mt-1">
              {highlightData
                .filter(h => h._source && h._source.text)
                .map((h, idx) => (
              <div key={idx}>
                {`${h._source.start} ${h._source.text}`}
              </div>
                ))}
            </div>
          ) : null}
        </td>
        <td className="py-2 px-4 flex gap-2 items-center justify-end">
          { canContribute && (<a
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
                <span className="px-1">
                  {descriptionsCount > 0
                    ? `Visa Innehåll (${descriptionsCount})`
                    : "Lägg till beskrivning"}
                </span>
                <FontAwesomeIcon icon={faCaretDown} />
              </span>
            )}
          </a>)}
          <a
            href={`${config.audioUrl}${item.source}`}
            download
            title="Ladda ner ljudfilen"
            className="text-isof hover:text-darker-isof no-underline hover:cursor-pointer"
          >
            <span className="px-1 underline underline-offset-2">Ladda ner</span>{" "}
            <FontAwesomeIcon icon={faDownload} />
          </a>
          {canContribute && (
            <Link
              to={`/records/${recordId}/audio/${encodeURIComponent(item.source)}/transcribe`}
              className="text-isof hover:text-darker-isof transition-colors duration-200 flex hover:cursor-pointer px-2 py-2"
            >
              <span className="px-1 underline underline-offset-2">Skriv av</span>
            </Link>
          )}
        </td>
      </tr>

      {/* If open, show descriptions + add-content button */}
      {openItems[item.source] && (
        <tr
          id={`descriptions-${item.source}`}
          aria-hidden={!openItems[item.source]}
          className="w-full"
        >
          <td colSpan={3} className="py-4 px-4 w-full border-isof">
            {/* List existing descriptions. Pass a callback to start editing */}
            <DescriptionList
              item={item}
              recordId={recordId}
              audioTitle={audioTitle}
              onEditDesc={onEditDesc}
              highlightData={highlightData}
            />

            {/* If we are editing something, show that form. Otherwise show the "Add new" button + form */}
            {editDesc ? (
              // --------------- EDIT FORM ---------------
              <DescriptionForm
                source={item.source}
                editingDesc={editDesc}
                formData={formData}
                setFormData={setFormData}
                setInitialFormData={setInitialFormData}
                isLocked={isLocked}
                hasSession={hasSession}
                onSave={onSaveDescription}
                onCancel={onCancelEdit}
                onDelete={() => {
                  setDescToDelete(editDesc);
                  setShowDeleteConfirmation(true);
                }}
                hasUnsavedChanges={hasUnsavedChanges}
                setHasUnsavedChanges={setHasUnsavedChanges}
                savedUserInfo={savedUserInfo}
              />
            ) : (
              <>
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
                          <span className="">
                            {descriptionsCount > 0
                              ? "Lägg till ny beskrivning"
                              : "Bli först att lägga till en beskrivning"}
                          </span>
                        </>
                      )}
                    </a>
                  </div>
                )}

                {showAddForm[item.source] && (
                  <DescriptionForm
                    source={item.source}
                    editingDesc={null}
                    formData={formData}
                    setFormData={setFormData}
                    setInitialFormData={setInitialFormData}
                    isLocked={isLocked}
                    hasSession={hasSession}
                    onSave={async (payload) => {
                      await handleSave(payload);
                      // if we close the "add new" form, cancel session
                      cancelTranscribe();
                    }}
                    onCancel={() => {
                      onToggleAddForm(item.source);
                      cancelTranscribe();
                    }}
                    hasUnsavedChanges={hasUnsavedChanges}
                    setHasUnsavedChanges={setHasUnsavedChanges}
                  />
                )}
              </>
            )}
          </td>
        </tr>
      )}
      {showDeleteConfirmation && (
        <ConfirmationModal
          isOpen={showDeleteConfirmation}
          onConfirm={() => {
            handleDelete(item.source, descToDelete);
            setShowDeleteConfirmation(false);
            setDescToDelete(null);
            // Close the edit form so it unmounts
            setEditDesc(null);
            // Optionally scroll back up to the list
            const listElement = document.getElementById(
              `descriptions-${item.source}`
            );
            if (listElement) {
              listElement.scrollIntoView({ behavior: "smooth" });
            }
          }}
          onCancel={() => {
            setShowDeleteConfirmation(false);
            setDescToDelete(null);
          }}
          message="Är du säker på att du vill ta bort denna beskrivning?"
          confirmLabel="Ta bort"
          cancelLabel="Avbryt"
          variant="delete"
        />
      )}
    </>
  );
}

AudioItemRow.propTypes = {
  item: PropTypes.object.isRequired,
  audioTitle: PropTypes.string.isRequired,
  recordId: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
    .isRequired,
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
  handleDelete: PropTypes.func.isRequired,
};

export default AudioItemRow;
