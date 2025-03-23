import React, { useEffect, useState } from "react";
import { TermList, TermNode } from "./TermList";
import StartTimeInputWithPlayer from "./StartTimeInput";
import { faInfoCircle } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import PropTypes from "prop-types";

/**
 * A small helper to flatten the tree of terms into a single list
 * so we can do easy "search by typedTag".
 */
function flattenTermList(termNodes) {
  const result = [];
  function traverse(node) {
    result.push({ termid: node.termid, term: node.term });
    if (Array.isArray(node.children)) {
      node.children.forEach((child) => traverse(child));
    }
  }
  termNodes.forEach((rootNode) => traverse(rootNode));
  return result;
}
const allTerms = flattenTermList(TermList).sort((a, b) =>
  a.termid.localeCompare(b.termid)
);

/**
 * This form handles both "Add new" AND "Edit existing" modes.
 * If `editingDesc` is passed, it populates the form with that data
 * and calls `onSave` with a parameter that includes the existing desc ID.
 */
function DescriptionForm({
  source,
  // If this is an existing description to edit:
  editingDesc, // (or null/undefined if "add new" mode)
  // Parent's data for new descriptions:
  formData,
  setFormData,
  setInitialFormData,
  // Lock & session props:
  isLocked,
  hasSession,
  // Parent callback that does the final POST or PUT:
  onSave,
  onCancel,
  // For tracking unsaved changes:
  hasUnsavedChanges,
  setHasUnsavedChanges,
}) {
  // We'll track whether the user wants to see the big tree of terms:
  const [showTermNode, setShowTermNode] = useState(false);

  // In DescriptionForm.js - Update useEffect
  useEffect(() => {
    if (editingDesc) {
      const prefill = {
        name: formData[source]?.name || "",
        email: formData[source]?.email || "",
        rememberMe: formData[source]?.rememberMe || false,
        start: editingDesc.start || "",
        descriptionText: editingDesc.text || "",
        typedTag: "",
        selectedTags: editingDesc.terms || [],
      };

      // Update both form data and initial form data
      setFormData((prev) => ({
        ...prev,
        [source]: prefill,
      }));
      setInitialFormData((prev) => ({
        ...prev,
        [source]: prefill,
      }));
    }
  }, [editingDesc, source, setFormData, setInitialFormData]);

  // The parent’s code gave us a `formData[source]` object:
  const dataForSource = formData[source] || {};

  // Helper to modify fields in formData[source]
  function handleChangeField(field, value) {
    setFormData((prev) => ({
      ...prev,
      [source]: {
        ...prev[source],
        [field]: value,
      },
    }));
    setHasUnsavedChanges(true);
  }

  // Toggling existing terms
  function handleToggleTerm(termObj) {
    setFormData((prev) => {
      const currentTags = prev[source].selectedTags || [];
      const index = currentTags.findIndex((t) => t.termid === termObj.termid);
      let newTags;
      if (index > -1) {
        // remove
        newTags = [
          ...currentTags.slice(0, index),
          ...currentTags.slice(index + 1),
        ];
      } else {
        // add
        newTags = [...currentTags, termObj];
      }
      return {
        ...prev,
        [source]: {
          ...prev[source],
          selectedTags: newTags,
        },
      };
    });
  }

  // Adding a brand-new typed term
  function handleAddTypedTag() {
    const typedTag = dataForSource.typedTag?.trim();
    if (!typedTag) return;
    const newTagObj = { term: typedTag, termid: "user:" + typedTag };
    setFormData((prevData) => {
      const currentTags = prevData[source].selectedTags || [];
      const duplicate = currentTags.some(
        (t) => t.term.toLowerCase() === typedTag.toLowerCase()
      );
      if (duplicate) return prevData;
      return {
        ...prevData,
        [source]: {
          ...prevData[source],
          selectedTags: [...currentTags, newTagObj],
          typedTag: "",
        },
      };
    });
  }

  return (
    <div className="border border-gray-300 p-4 mb-4 bg-white text-sm relative">
      <p className="text-lg font-semibold pb-4 text-isof">
        Din kunskap kan hjälpa andra -{" "}
        {editingDesc ? "Redigera beskrivning" : "Lägg till en beskrivning"}
      </p>
      {/* Start time */}
      <div className="mb-4">
        <label className="block font-semibold mb-1">Starttid (MM:SS) *</label>
        <div className="mb-2 text-sm bg-isof bg-opacity-10 p-2 rounded flex items-start">
          <FontAwesomeIcon
            icon={faInfoCircle}
            className="mr-2 my-1 text-isof"
          />
          Steg 1 av 3. Ange den tidpunkt när innehållet börjar. Du kan använda
          ljudspelaren för att hitta exakt tid eller skriva in den manuellt.
        </div>
        <StartTimeInputWithPlayer
          autoFocus={!editingDesc}
          value={dataForSource.start || ""}
          onChange={(val) => handleChangeField("start", val)}
          required
        />
      </div>

      {/* Description text */}
      <div>
        <label className="block font-semibold mb-1">Beskrivning *</label>
        <span className="text-xs text-gray-500 pb-2"></span>
        <div className="mb-2 text-sm bg-isof bg-opacity-10 p-2 rounded flex">
          <FontAwesomeIcon
            icon={faInfoCircle}
            className="mr-2 my-1 text-isof"
          />
          Steg 2 av 3. Beskriv kortfattat vad som sägs i ljudintervallet. Har du
          fler detaljer eller ytterligare insikter, dela gärna med dig av dem!
        </div>
        <textarea
          className="border p-2 w-full !mb-2"
          rows="4"
          value={dataForSource.descriptionText || ""}
          onChange={(e) => handleChangeField("descriptionText", e.target.value)}
          required
        />
        <div className="text-right text-xs text-gray-500">
          {dataForSource.descriptionText?.length || 0}/500 tecken
        </div>
      </div>

      {/* 4. Terms */}
      <div className="mb-4">
        <label className="block font-semibold">Ämnesord *</label>
        <div className="mb-2 text-sm bg-isof bg-opacity-10 p-2 rounded flex">
          <FontAwesomeIcon
            icon={faInfoCircle}
            className="mr-2 text-isof my-1"
          />
          Steg 3 av 3. Välj eller skriv minst ett ord som bäst beskriver
          innehållet. Du kan välja flera ord.
        </div>
        <div className="relative">
          <input
            type="text"
            className="border p-1 w-full"
            placeholder="Skriv t.ex. 'Musik' eller 'Mat'"
            value={dataForSource.typedTag || ""}
            onChange={(e) => handleChangeField("typedTag", e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && dataForSource.typedTag?.trim()) {
                e.preventDefault();
                handleAddTypedTag();
              }
            }}
          />
          {dataForSource.typedTag?.length > 0 && (
            <div className="absolute z-10 bg-white border border-gray-300 mt-1 w-full max-h-48 overflow-y-auto">
              {allTerms
                .filter((t) =>
                  t.term
                    .toLowerCase()
                    .includes(dataForSource.typedTag.toLowerCase())
                )
                .slice(0, 15)
                .map((match) => (
                  <div
                    key={match.termid}
                    className="px-2 py-1 hover:bg-gray-100 hover:cursor-pointer"
                    onClick={() => {
                      handleToggleTerm(match);
                      handleChangeField("typedTag", "");
                    }}
                  >
                    {match.term}
                  </div>
                ))}
            </div>
          )}
        </div>
        <button
          type="button"
          className="mt-4 text-sm text-white focus:text-white hover:text-white bg-isof hover:bg-darker-isof px-2 py-1"
          onClick={() => setShowTermNode(!showTermNode)}
        >
          {showTermNode ? "Dölj termlista ▲" : "Visa termlista ▼"}
        </button>

        {showTermNode && (
          <div className="border p-2 mt-2">
            {TermList.map((rootNode) => (
              <TermNode
                key={rootNode.termid}
                node={rootNode}
                selectedTags={dataForSource.selectedTags}
                onToggle={handleToggleTerm}
                source={source}
              />
            ))}
          </div>
        )}

        {/* Show selected tags */}
        {dataForSource.selectedTags?.length > 0 && (
          <span className="block mt-2">Valda ämnesord:</span>
        )}
        <div className="flex flex-wrap gap-2 mt-2">
          {(dataForSource.selectedTags || []).map((tagObj) => (
            <span className="flex items-center gap-1 bg-isof text-white px-2 py-1 rounded">
              {tagObj.term}
              <span
                className="hover:cursor-pointer ml-1"
                onClick={() => handleToggleTerm(tagObj)}
              >
                ×
              </span>
            </span>
          ))}
        </div>

        {/* 1. Name + email */}
        <div className="mt-2">
          <details className="text-sm text-gray-600">
            <summary className="hover:cursor-pointer list-none">
              <FontAwesomeIcon icon={faInfoCircle} className="mr-2" />
              Varför frågar vi efter namn/e-post?
            </summary>
            <p className="pt-4 pl-6">
              Vi samlar endast in denna information för att kunna skapa
              statistik och topplistor över bidragsgivare. Ditt namn kan visas
              publikt om du hamnar bland toppbidragsgivarna. Din e-post används
              endast om vi behöver kontakta dig angående ditt bidrag.
            </p>
          </details>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div>
            <label className="block font-semibold mb-1">
              Ditt namn (ej obligatoriskt)
            </label>
            <input
              type="text"
              placeholder="Ange ditt namn"
              className="border p-2 w-full"
              value={dataForSource.name || ""}
              onChange={(e) => handleChangeField("name", e.target.value)}
            />
          </div>
          <div>
            <label className="block font-semibold mb-1">
              Din e-post (ej obligatoriskt)
            </label>
            <input
              type="email"
              placeholder="Ange din e-post"
              className="border p-2 w-full"
              value={dataForSource.email || ""}
              onChange={(e) => handleChangeField("email", e.target.value)}
            />
          </div>
        </div>

        {/* remember me */}
        <div className="my-4">
          <label className="inline-flex items-center gap-2">
            <input
              type="checkbox"
              checked={dataForSource.rememberMe || false}
              onChange={(e) =>
                handleChangeField("rememberMe", e.target.checked)
              }
            />
            <span>Kom ihåg mig</span>
          </label>
        </div>
      </div>
      

      {/* 5. Save / Cancel */}
      <div className="flex items-center justify-end gap-4">
        <a
          type="button"
          className="underline text-gray-600 hover:text-gray-900 hover:cursor-pointer"
          onClick={onCancel}
        >
          Avbryt
        </a>
        <a
          type="button"
          className={`px-4 py-2 rounded text-white ${
            hasSession &&
            dataForSource.start?.trim() &&
            dataForSource.descriptionText?.trim() &&
            dataForSource.selectedTags?.length
              ? "bg-isof hover:bg-darker-isof hover:cursor-pointer"
              : "bg-gray-400 cursor-not-allowed"
          }`}
          onClick={() => {
            if (hasSession) {
              onSave({
                source,
                start: dataForSource.start,
                text: dataForSource.descriptionText,
                terms: dataForSource.selectedTags || [],
                email: dataForSource.email || "",
                name: dataForSource.name || "",
                rememberMe: dataForSource.rememberMe || false,
              });
            }
          }}
        >
          {editingDesc ? "Spara ändringar" : "Spara"}
        </a>
      </div>
    </div>
  );
}

export default DescriptionForm;
