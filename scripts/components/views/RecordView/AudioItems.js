import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import config from "../../../config";
import { getAudioTitle } from "../../../utils/helpers";
import ConfirmationModal from "../../ConfirmationModal";
import AudioItemRow from "./AudioItemRow";
import "./DescriptionForm";

function AudioItems({ data }) {
  const {
    id,
    media,
    contents,
    archive: { arhive_org: archiveOrg, archive },
    year,
    persons,
    // The server’s transcription status
    transcriptionstatus,
  } = data;

  // If the server says “undertranscription”, that means someone else has locked it
  const serverHasOngoingSession = transcriptionstatus === "undertranscription";

  // Our local session if we are the ones transcribing
  const [transcribeSession, setTranscribeSession] = useState(null);

  // If we want to override the lock status locally after we cancel
  const [localLockOverride, setLocalLockOverride] = useState(false);

  // These help us keep track of open items (i.e., toggling "Visa innehåll")
  const [openItems, setOpenItems] = useState({});

  // We’ll store the various forms’ states in here, keyed by audio source
  const [formData, setFormData] = useState({});

  // We also track if we have unsaved changes, to show confirmation on close
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [sourceToClose, setSourceToClose] = useState(null);

  // We track which forms are visible for a given source
  const [showAddForm, setShowAddForm] = useState({});

  // Keep track of the user’s name/email in localStorage
  const [savedUserInfo, setSavedUserInfo] = useState(() => {
    const savedInfo = localStorage.getItem("userInfo");
    return savedInfo
      ? JSON.parse(savedInfo)
      : { name: "", email: "", rememberMe: false };
  });

  // We store the initial form data so we can detect unsaved changes
  const [initialFormData, setInitialFormData] = useState({});

  const isLocked =
    !transcribeSession &&
    !localLockOverride &&
    transcriptionstatus === "undertranscription";

  // Handle page unload => cancel transcription
  useEffect(() => {
    function handleBeforeUnload() {
      cancelTranscribe();
    }
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [transcribeSession]);

  // ---- MAIN ACTIONS ----

  const startTranscribe = async () => {
    const payload = {
      recordid: data.id,
    };
    try {
      const response = await fetch(`${config.restApiUrl}describe/start/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        throw new Error(`POST failed with status ${response.status}`);
      }
      const result = await response.json();

      setTranscribeSession(result.data.transcribesession);
      return result.data.transcribesession;
    } catch (error) {
      console.error("Error creating a transcription session:", error);
    }
  };

  const cancelTranscribe = async () => {
    if (!transcribeSession) return;
    const payload = {
      recordid: data.id,
      transcribesession: transcribeSession,
    };

    const fd = new FormData();
    fd.append("json", JSON.stringify(payload));

    try {
      const response = await fetch(`${config.restApiUrl}transcribecancel/`, {
        method: "POST",
        body: fd,
      });
      if (!response.ok) {
        throw new Error(`POST failed with status ${response.status}`);
      }
      await response.json();
      setTranscribeSession(null);
    } catch (error) {
      console.error("Error cancelling a transcription session:", error);
    }
  };

  const handleToggle = (source) => {
    setOpenItems((prev) => ({ ...prev, [source]: !prev[source] }));
  };

  // The "Add new description" toggler
  const handleToggleAddFormWithConfirmation = (source) => {
    const currentFormData = formData[source] || {};
    const currentInitialData = initialFormData[source] || {};

    const formChanged = Object.keys(currentFormData).some((key) => {
      if (key === "name" || key === "email" || key === "rememberMe")
        return false;
      return (
        JSON.stringify(currentFormData[key]) !==
        JSON.stringify(currentInitialData[key])
      );
    });

    if (formChanged) {
      setSourceToClose(source);
      setShowConfirmationModal(true);
    } else {
      handleToggleAddForm(source);
    }
  };

  const handleToggleAddForm = (source) => {
    const currentlyVisible = showAddForm[source];

    if (currentlyVisible) {
      // Reset form data when closing
      setFormData((prev) => {
        const newData = { ...prev };
        delete newData[source];
        return newData;
      });
      setShowAddForm((prev) => ({ ...prev, [source]: false }));
      cancelTranscribe();
      setLocalLockOverride(true);
      setHasUnsavedChanges(false);
    } else {
      // open it
      setLocalLockOverride(false);
      if (!isLocked && !transcribeSession) {
        startTranscribe();
      }
      const defaultData = {
        name: savedUserInfo.name,
        email: savedUserInfo.email,
        rememberMe: savedUserInfo.rememberMe,
        start: "",
        descriptionText: "",
        typedTag: "",
        selectedTags: [],
      };
      setInitialFormData((prev) => ({ ...prev, [source]: defaultData }));
      setFormData((prev) => ({ ...prev, [source]: defaultData }));
      setShowAddForm((prev) => ({ ...prev, [source]: true }));
    }
  };

  const handleConfirmClose = () => {
    // Reset form data to initial state
    setFormData((prev) => {
      const newData = { ...prev };
      delete newData[sourceToClose];
      return newData;
    });
    handleToggleAddForm(sourceToClose);
    setShowConfirmationModal(false);
    setSourceToClose(null);
    setHasUnsavedChanges(false);
  };

  const handleCancelClose = () => {
    setShowConfirmationModal(false);
    setSourceToClose(null);
  };

  const handleSave = async (payload) => {
    const {
      source,
      name,
      email,
      rememberMe,
      start,
      text,
      terms,
      start_from,
      start_to,
      change_from,
      change_to,
    } = payload;

    // 1. "Remember Me" logic:
    if (rememberMe) {
      const newUserInfo = { name, email, rememberMe: true };
      setSavedUserInfo(newUserInfo);
      localStorage.setItem("userInfo", JSON.stringify(newUserInfo));
    } else {
      localStorage.removeItem("userInfo");
      setSavedUserInfo({ name: "", email: "", rememberMe: false });
    }

    // 2. Construct the body for POST
    const finalPayload = {
      recordid: data.id,
      file: source,
      transcribesession: transcribeSession,
      from_email: email || "",
      from_name: name || "",
      terms: terms || [],
    };

    if (start_from) {
      // Include original and new data
      finalPayload.start_from = start_from;
      finalPayload.change_from = change_from;
      finalPayload.change_to = change_to;
      if (start_to && start_to !== start_from) {
        finalPayload.start_to = start_to;
      }
    } else {
      // New entry
      finalPayload.start = start;
      finalPayload.change_to = text;
    }

    try {
      const response = await fetch(`${config.restApiUrl}describe/change/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(finalPayload),
      });

      if (!response.ok) {
        throw new Error(`POST failed with status ${response.status}`);
      }
      await response.json();

      // 3. If success, update local UI state:
      setInitialFormData((prev) => ({
        ...prev,
        [source]: formData[source],
      }));
      setHasUnsavedChanges(false);
      setShowAddForm((prev) => ({ ...prev, [source]: false }));

      // Cancel transcription session if needed
      cancelTranscribe();
      setLocalLockOverride(true);
      window.location.reload();
    } catch (error) {
      console.error("Error submitting description:", error);
    }
  };

  const handleDelete = async (source, desc) => {
    try {
      let session = transcribeSession;
      if (!session) {
        session = await startTranscribe();
        if (!session) {
          throw new Error("Could not start a session for deletion.");
        }
      }

      const payload = {
        recordid: data.id,
        file: source,
        transcribesession: session,
        start: desc.start,
        from_email: savedUserInfo.email || "",
        from_name: savedUserInfo.name || "",
      };

      const response = await fetch(`${config.restApiUrl}describe/delete/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Delete failed");
      }

      window.location.reload();
    } catch (error) {
      console.error("Delete error:", error);
    }
  };

  // We'll only show items that are audio type
  const audioDataItems = media.filter((item) => item.type === "audio");

  // Auto-Expand First Item
  useEffect(() => {
    if (audioDataItems.length === 1) {
      setOpenItems({ [audioDataItems[0].source]: true });
    }
  }, [audioDataItems]);

  return (
    <div className="mx-auto border-none">
      <div className="overflow-x-auto mb-4 rounded">
        <table className="w-full table-auto border-collapse lg:text-sm text-xs">
          <tbody>
            {audioDataItems.map((item) => {
              const audioTitle = getAudioTitle(
                item.title,
                contents,
                archiveOrg,
                archive,
                item.source,
                year,
                persons
              );
              return (
                <AudioItemRow
                  key={item.source}
                  item={item}
                  audioTitle={audioTitle}
                  recordId={id}
                  openItems={openItems}
                  onToggle={handleToggle}
                  showAddForm={showAddForm}
                  onToggleAddForm={handleToggleAddFormWithConfirmation}
                  isLocked={isLocked}
                  hasSession={!!transcribeSession}
                  serverHasOngoingSession={serverHasOngoingSession}
                  startTranscribe={startTranscribe}
                  cancelTranscribe={cancelTranscribe}
                  config={config}
                  formData={formData}
                  setFormData={setFormData}
                  setInitialFormData={setInitialFormData}
                  handleSave={handleSave}
                  hasUnsavedChanges={hasUnsavedChanges}
                  setHasUnsavedChanges={setHasUnsavedChanges}
                  handleDelete={handleDelete}
                  savedUserInfo={savedUserInfo}
                />
              );
            })}
          </tbody>
        </table>
      </div>
      <ConfirmationModal
        isOpen={showConfirmationModal}
        onConfirm={handleConfirmClose}
        onCancel={handleCancelClose}
        message="Du har osparade ändringar. Vill du stänga formuläret ändå?"
      />
    </div>
  );
}

AudioItems.propTypes = {
  data: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    media: PropTypes.arrayOf(
      PropTypes.shape({
        type: PropTypes.string.isRequired,
        source: PropTypes.string.isRequired,
        title: PropTypes.string,
        description: PropTypes.arrayOf(
          PropTypes.shape({
            text: PropTypes.string,
            start: PropTypes.string,
            terms: PropTypes.arrayOf(
              PropTypes.shape({
                term: PropTypes.string,
                termid: PropTypes.string,
              })
            ),
          })
        ),
      })
    ).isRequired,
    contents: PropTypes.string,
    archive: PropTypes.shape({
      arhive_org: PropTypes.string,
      archive: PropTypes.string,
    }),
    year: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    persons: PropTypes.arrayOf(PropTypes.object),
    transcriptionstatus: PropTypes.string,
  }).isRequired,
};

export default AudioItems;
