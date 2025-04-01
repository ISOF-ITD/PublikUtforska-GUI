import React, { useEffect, useState, useCallback } from "react";
import { TermList, TermNode } from "./TermList";
import StartTimeInputWithPlayer from "./StartTimeInput";
import { faInfoCircle } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import PropTypes from "prop-types";

// Memoize flattenTermList as it's static data
const allTerms = (() => {
  const flattenTermList = (termNodes) => {
    const result = [];
    const traverse = (node) => {
      result.push({ termid: node.termid, term: node.term });
      node.children?.forEach(traverse);
    };
    termNodes.forEach(traverse);
    return result.sort((a, b) => a.termid.localeCompare(b.termid));
  };
  return flattenTermList(TermList);
})();

const InfoMessage = ({ children }) => (
  <div className="mb-2 text-sm bg-isof bg-opacity-10 p-2 rounded flex items-start">
    <FontAwesomeIcon icon={faInfoCircle} className="mr-2 my-1 text-isof" />
    {children}
  </div>
);

const Tag = ({ tag, onRemove }) => (
  <span className="flex items-center gap-1 bg-isof text-white px-2 py-1 rounded">
    {tag.term}
    <span className="hover:cursor-pointer ml-1" onClick={() => onRemove(tag)}>
      ×
    </span>
  </span>
);

function DescriptionForm({
  source,
  editingDesc,
  formData,
  setFormData,
  setInitialFormData,
  isLocked,
  hasSession,
  onSave,
  onCancel,
  onDelete,
  hasUnsavedChanges,
  setHasUnsavedChanges,
  savedUserInfo,
}) {
  const [showTermNode, setShowTermNode] = useState(false);
  const dataForSource = formData[source] || {};
  const [error, setError] = useState(null);

  // Initialize form data for edit mode
  useEffect(() => {
    if (editingDesc) {
      const prefill = {
        name: savedUserInfo.name,
        email: savedUserInfo.email,
        rememberMe: savedUserInfo.rememberMe || false,
        start: editingDesc.start || "",
        descriptionText: editingDesc.text || "",
        typedTag: "",
        selectedTags: editingDesc.terms || [],
      };

      setFormData((prev) => ({ ...prev, [source]: prefill }));
      setInitialFormData((prev) => ({ ...prev, [source]: prefill }));
    }
  }, [editingDesc, source, setFormData, setInitialFormData]);

  // Memoized field handler
  const handleChangeField = useCallback(
    (field, value) => {
      setFormData((prev) => ({
        ...prev,
        [source]: { ...prev[source], [field]: value },
      }));
      setHasUnsavedChanges(true);
    },
    [source, setFormData, setHasUnsavedChanges]
  );

  const handleToggleTerm = useCallback(
    (termObj) => {
      setFormData((prev) => {
        const current = prev[source]?.selectedTags || [];
        const exists = current.some((t) => t.termid === termObj.termid);
        return {
          ...prev,
          [source]: {
            ...prev[source],
            selectedTags: exists
              ? current.filter((t) => t.termid !== termObj.termid)
              : [...current, termObj],
          },
        };
      });
    },
    [source, setFormData]
  );

  const handleAddTypedTag = useCallback(() => {
    const typedTag = (dataForSource.typedTag || "").trim();
    if (!typedTag) return;

    const exists = (dataForSource.selectedTags || []).some(
      (t) => t.term.toLowerCase() === typedTag.toLowerCase()
    );

    if (!exists) {
      handleChangeField("selectedTags", [
        ...(dataForSource.selectedTags || []),
        { term: typedTag, termid: `user:${typedTag}` },
      ]);
      handleChangeField("typedTag", "");
    }
  }, [dataForSource, handleChangeField]);

  // Form validation state
  const isValid = Boolean(
    hasSession &&
      dataForSource.start?.trim() &&
      dataForSource.descriptionText?.trim() &&
      dataForSource.selectedTags?.length
  );

  return (
    <div className="border border-gray-300 p-4 mb-4 bg-white text-sm relative">
      <p className="text-lg font-semibold pb-4 text-isof">
        Din kunskap kan hjälpa andra -{" "}
        {editingDesc ? "Redigera beskrivning" : "Lägg till en beskrivning"}
      </p>

      <ExplanationSection />

      <FormSection title="Starttid (MM:SS) *">
        <InfoMessage>
          Steg 1 av 3. Ange den tidpunkt då samtalsämnet börjar. Du kan använda
          ljudspelaren för att hitta exakt tid eller ange tiden manuellt.
        </InfoMessage>
        <StartTimeInputWithPlayer
          autoFocus={!editingDesc}
          value={dataForSource.start || ""}
          onChange={(val) => handleChangeField("start", val)}
          required
        />
      </FormSection>

      <FormSection title="Beskrivning *">
        <InfoMessage>
          Steg 2 av 3. Beskriv kortfattat vad som sägs i ljudintervallet. Har du
          fler detaljer eller ytterligare insikter, dela gärna med dig av dem.
        </InfoMessage>
        <textarea
          className="border p-2 w-full mb-2"
          rows="4"
          value={dataForSource.descriptionText || ""}
          onChange={(e) => handleChangeField("descriptionText", e.target.value)}
          maxLength={500}
          required
        />
        <CharacterCount count={dataForSource.descriptionText?.length} />
      </FormSection>

      <TermSection
        data={dataForSource}
        showTermNode={showTermNode}
        onToggleTerm={handleToggleTerm}
        onAddTag={handleAddTypedTag}
        onChange={handleChangeField}
        onToggleTree={() => setShowTermNode(!showTermNode)}
      />

      <UserInfoSection data={dataForSource} onChange={handleChangeField} />

      <FormActions
        isValid={isValid}
        isEditing={Boolean(editingDesc)}
        onCancel={onCancel}
        onSave={() =>
          onSave({
            source,
            start: dataForSource.start,
            text: dataForSource.descriptionText,
            terms: dataForSource.selectedTags || [],
            email: dataForSource.email || "",
            name: dataForSource.name || "",
            rememberMe: dataForSource.rememberMe || false,
          })
        }
        onDelete={onDelete}
      />
    </div>
  );
}

// Sub-components
const FormSection = ({ title, children }) => (
  <div className="mb-4">
    <label className="block font-semibold mb-1">{title}</label>
    {children}
  </div>
);

const CharacterCount = ({ count }) => (
  <div className="text-right text-xs text-gray-500">
    {count || 0}/500 tecken
  </div>
);

const TermSection = ({
  data,
  showTermNode,
  onToggleTerm,
  onAddTag,
  onChange,
  onToggleTree,
}) => (
  <FormSection title="Ämnesord *">
    <InfoMessage>
      Steg 3 av 3. Välj eller skriv minst ett ämnesord som bäst beskriver
      innehållet. Du kan välja flera ord.
    </InfoMessage>

    <div className="relative">
      <input
        type="text"
        className="border p-1 w-full"
        placeholder="Skriv t.ex. 'Musik' eller 'Mat'"
        value={data.typedTag || ""}
        onChange={(e) => onChange("typedTag", e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && onAddTag()}
      />
      <TermSuggestions
        typedTag={data.typedTag}
        onSelect={onToggleTerm}
        onChange={onChange}
      />
    </div>

    <button
      type="button"
      className="mt-4 text-sm text-white hover:text-white bg-isof hover:bg-darker-isof px-2 py-1"
      onClick={onToggleTree}
    >
      {showTermNode ? "Dölj termlista ▲" : "Visa termlista ▼"}
    </button>

    {showTermNode && (
      <div className="border p-2 mt-2">
        {TermList.map((rootNode) => (
          <TermNode
            key={rootNode.termid}
            node={rootNode}
            selectedTags={data.selectedTags}
            onToggle={onToggleTerm}
          />
        ))}
      </div>
    )}

    <SelectedTags tags={data.selectedTags} onRemove={onToggleTerm} />
  </FormSection>
);

const TermSuggestions = ({ typedTag, onSelect, onChange }) => {
  if (!typedTag) return null;

  const matches = allTerms
    .filter((t) => t.term.toLowerCase().includes(typedTag.toLowerCase()))
    .slice(0, 15);

  return (
    <div className="absolute z-10 bg-white border border-gray-300 mt-1 w-full max-h-48 overflow-y-auto">
      {matches.map((match) => (
        <div
          key={match.termid}
          className="px-2 py-1 hover:bg-gray-100 cursor-pointer"
          onClick={() => {
            onSelect(match);
            onChange("typedTag", ""); // Now uses the passed prop
          }}
        >
          {match.term}
        </div>
      ))}
    </div>
  );
};

const SelectedTags = ({ tags, onRemove }) => (
  <>
    {tags?.length > 0 && (
      <div className="flex flex-wrap gap-2 mt-2">
        {tags.map((tag) => (
          <Tag key={tag.termid} tag={tag} onRemove={onRemove} />
        ))}
      </div>
    )}
  </>
);

const ExplanationSection = () => {
  return (
    <div className="mb-4">
      <details className="text-sm text-gray-600">
        <summary className="hover:cursor-pointer list-none flex items-center">
          <FontAwesomeIcon icon={faInfoCircle} className="mr-2" />
          Varför samlar vi in innehållsbeskrivningar?
        </summary>
        <p className="pt-4 pl-6">
          Vi behöver dina innehållsbeskrivningar för att andra ska kunna få en
          snabb överblick av vad ljudklippet handlar om. Genom att dela med dig
          av din kunskap kan du hjälpa forskare, släktforskare och andra
          intresserade att snabbare hitta rätt information.
        </p>
      </details>
    </div>
  );
};

const UserInfoSection = ({ data, onChange }) => (
  <div className="mt-4">
    <div className="mt-2">
      <details className="text-sm text-gray-600">
        <summary className="hover:cursor-pointer list-none">
          <FontAwesomeIcon icon={faInfoCircle} className="mr-2" />
          Varför frågar vi efter namn/e-post?
        </summary>
        <p className="pt-4 pl-6">
          Vi samlar in den här informationen enbart för att skapa statistik och
          listor över bidragsgivare. Ditt namn visas i bidragsgivarelistan för
          den här uppteckningen, och kan även synas på hemsidan om du hamnar
          bland toppbidragsgivarna. Din e-postadress används endast om vi
          behöver kontakta dig angående ditt bidrag.
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
          value={data?.name || ""}
          onChange={(e) => onChange("name", e.target.value)}
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
          value={data?.email || ""}
          onChange={(e) => onChange("email", e.target.value)}
        />
      </div>
    </div>

    {/* remember me */}
    <div className="my-4">
      <label className="inline-flex items-center gap-2">
        <input
          type="checkbox"
          checked={data?.rememberMe || false}
          onChange={(e) => onChange("rememberMe", e.target.checked)}
        />
        <span>Kom ihåg mig</span>
      </label>
    </div>
  </div>
);

const FormActions = ({ isValid, isEditing, onCancel, onSave, onDelete }) => (
  <div className="flex items-center justify-end gap-4 mt-4">
    {isEditing && (
      <a
        type="button"
        className="text-red-600 hover:text-red-800 underline  hover:cursor-pointer"
        onClick={onDelete}
      >
        Ta bort
      </a>
    )}
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
        isValid
          ? "bg-isof hover:bg-darker-isof hover:cursor-pointer"
          : "bg-gray-400 hover:cursor-not-allowed"
      }`}
      onClick={onSave}
      disabled={!isValid}
    >
      {isEditing ? "Spara ändringar" : "Spara"}
    </a>
  </div>
);

DescriptionForm.propTypes = {
  source: PropTypes.string.isRequired,
  editingDesc: PropTypes.object,
  formData: PropTypes.object.isRequired,
  setFormData: PropTypes.func.isRequired,
  setInitialFormData: PropTypes.func.isRequired,
  isLocked: PropTypes.bool,
  hasSession: PropTypes.bool,
  onSave: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  hasUnsavedChanges: PropTypes.bool,
  setHasUnsavedChanges: PropTypes.func,
  onDelete: PropTypes.func,
  savedUserInfo: PropTypes.object,
};

export default DescriptionForm;
