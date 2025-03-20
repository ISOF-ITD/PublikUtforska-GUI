import React, { useState } from "react";
import { TermList, TermNode } from "./TermList";
import StartTimeInputWithPlayer from "./StartTimeInput";

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

function AddDescriptionForm({
  source,
  formData,
  setFormData,
  isLocked,
  hasSession,
  handleSave,
  onCancel,
  hasUnsavedChanges,
  setHasUnsavedChanges,
}) {
  const [showTermNode, setShowTermNode] = useState(false);
  const dataForSource = formData[source] || {};

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

  function handleToggleTerm(source, termObj) {
    setFormData((prevData) => {
      const currentTags = prevData[source]?.selectedTags || [];
      const index = currentTags.findIndex((t) => t.termid === termObj.termid);
      let newTags;
      if (index > -1) {
        newTags = [
          ...currentTags.slice(0, index),
          ...currentTags.slice(index + 1),
        ];
      } else {
        newTags = [...currentTags, termObj];
      }
      return {
        ...prevData,
        [source]: {
          ...prevData[source],
          selectedTags: newTags,
        },
      };
    });
  }

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
    <div className="border border-gray-300 p-4 my-4 bg-white text-sm relative">
      {/* 1. Name + email */}
      <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
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
      <div className="mb-4">
        <label className="inline-flex items-center gap-2">
          <input
            type="checkbox"
            checked={dataForSource.rememberMe || false}
            onChange={(e) => handleChangeField("rememberMe", e.target.checked)}
          />
          <span>Kom ihåg mig</span>
        </label>
      </div>
      {/* 2. Start time */}
      <div className="mb-4">
        <label className="block font-semibold mb-1">Starttid (MM:SS)</label>
        <p className="text-xs text-gray-500">
          Ange minuter och sekunder, t.ex. 01:23
        </p>
        <StartTimeInputWithPlayer
          value={dataForSource.start || ""}
          onChange={(val) => handleChangeField("start", val)}
        />
      </div>
      {/* 3. Description text */}
      <div>
        <label className="block font-semibold mb-1">
          Beskrivning / Annotation
        </label>
        <span className="text-xs text-gray-500 pb-2">
          Beskriv kortfattat vad som sägs i ljudintervallet. Har du fler
          detaljer eller ytterligare insikter, dela gärna med dig av dem!
        </span>
        <textarea
          className="border p-2 w-full"
          rows="4"
          value={dataForSource.descriptionText || ""}
          onChange={(e) => handleChangeField("descriptionText", e.target.value)}
        />
      </div>
      {/* 4. Terms */}
      <div className="mb-4">
        <label className="block font-semibold">Termer / Ämnesord</label>
        <span className="text-xs text-gray-500 my-1">
          Ange ett ämnesord eller markera ett eller flera från listan.
        </span>
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
                      // Add the tag
                      setFormData((prevData) => {
                        const currentTags = prevData[source].selectedTags || [];
                        const duplicate = currentTags.some(
                          (tt) => tt.termid === match.termid
                        );
                        if (duplicate) return prevData;
                        return {
                          ...prevData,
                          [source]: {
                            ...prevData[source],
                            selectedTags: [...currentTags, match],
                            typedTag: "",
                          },
                        };
                      });
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
            <span
              key={tagObj.termid}
              className="flex items-center gap-1 bg-isof text-white px-2 py-1 rounded"
            >
              {tagObj.termid} {tagObj.term}
              <span
                className="hover:cursor-pointer"
                onClick={() => handleToggleTerm(source, tagObj)}
              >
                ×
              </span>
            </span>
          ))}
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
            hasSession
              ? "bg-isof hover:bg-darker-isof hover:cursor-pointer"
              : "bg-gray-400 cursor-not-allowed"
          }`}
          onClick={() => hasSession && handleSave(source)}
        >
          Spara
        </a>
      </div>
    </div>
  );
}

export default AddDescriptionForm;
