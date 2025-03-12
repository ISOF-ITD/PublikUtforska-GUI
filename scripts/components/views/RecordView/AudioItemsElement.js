import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faDownload,
  faCaretDown,
  faCaretUp,
  faPenToSquare,
  faCirclePlus,
  faTimes,
  faCheck,
} from "@fortawesome/free-solid-svg-icons";
import config from "../../../config";
import { getAudioTitle } from "../../../utils/helpers";
import ListPlayButton from "../ListPlayButton";
import { TermList, TermNode } from "./TermList";

// Helper to convert "MM:SS" to seconds
function parseTimeString(timeString = "00:00") {
  const parts = timeString.split(":").map(Number).reverse();
  let seconds = 0;
  if (parts[0]) seconds += parts[0]; // seconds
  if (parts[1]) seconds += parts[1] * 60; // minutes
  if (parts[2]) seconds += parts[2] * 3600; // hours
  return seconds;
}

function AudioItems({ data }) {
  const {
    id,
    media,
    contents,
    archive: { arhive_org: archiveOrg, archive },
    year,
    persons,
  } = data;

  // Track which items are "open"
  const [openItems, setOpenItems] = useState({});
  // Track whether the "add content" form is shown for a given source
  const [showAddForm, setShowAddForm] = useState({});
  // Track form data for each source
  const [formData, setFormData] = useState({});

  const [showTermNode, setShowTermNode] = useState({});

  const handleToggleTermNode = (source) => {
    setShowTermNode((prevState) => ({
      ...prevState,
      [source]: !prevState[source],
    }));
  };

  // Load saved name and email from local storage
  const [savedUserInfo, setSavedUserInfo] = useState(() => {
    const savedInfo = localStorage.getItem("userInfo");
    return savedInfo
      ? JSON.parse(savedInfo)
      : { name: "", email: "", rememberMe: false };
  });

  // Save name and email to local storage
  const saveUserInfo = () => {
    localStorage.setItem("userInfo", JSON.stringify(savedUserInfo));
  };

  // Handle changes to the saved name and email fields
  const handleUserInfoChange = (field, value) => {
    setSavedUserInfo((prevInfo) => ({
      ...prevInfo,
      [field]: value,
    }));
  };

  // A predefined list of tags
  const availableTags = ["Musik", "Intervju", "Historia", "Plats", "Tradition"];

  // Toggle sub-list of descriptions for a single audio file
  const handleToggle = (source) => {
    setOpenItems((prevState) => ({
      ...prevState,
      [source]: !prevState[source],
    }));
  };

  // Toggle "add content" form
  const handleToggleAddForm = (source) => {
    setShowAddForm((prevState) => ({
      ...prevState,
      [source]: !prevState[source],
    }));
    // If toggling "on," initialize blank form data
    if (!showAddForm[source]) {
      setFormData((prevState) => ({
        ...prevState,
        [source]: {
          name: savedUserInfo.name,
          email: savedUserInfo.email,
          rememberMe: savedUserInfo.rememberMe,
          start: "",
          descriptionText: "",
          typedTag: "",
          selectedTags: [],
        },
      }));
    }
  };

  // Handle changes to the add-content form fields
  const handleChangeField = (source, field, value) => {
    setFormData((prevData) => ({
      ...prevData,
      [source]: {
        ...prevData[source],
        [field]: value,
      },
    }));
  };

  // Add or remove term
  const handleToggleTerm = (source, termObj) => {
    setFormData((prevData) => {
      const currentTags = prevData[source].selectedTags || [];
      // Check if that termid is already selected
      const index = currentTags.findIndex((t) => t.termid === termObj.termid);

      let newTags;
      if (index > -1) {
        // Remove it
        newTags = [
          ...currentTags.slice(0, index),
          ...currentTags.slice(index + 1),
        ];
      } else {
        // Add it
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
  };

  // Add typed tag manually (user typed their own)
  const handleAddTypedTag = (source) => {
    const typedTag = formData[source]?.typedTag?.trim();
    if (!typedTag) return;
    setFormData((prevData) => {
      const currentTags = prevData[source].selectedTags || [];
      // ensure no duplicates
      if (currentTags.includes(typedTag)) {
        return prevData; // do nothing if it already exists
      }
      return {
        ...prevData,
        [source]: {
          ...prevData[source],
          selectedTags: [...currentTags, typedTag],
          typedTag: "", // reset typed tag
        },
      };
    });
  };

  function flattenTermList(termNodes) {
    const result = [];

    function traverse(node) {
      // Add this node
      result.push({ termid: node.termid, term: node.term });
      // Recurse on children
      if (Array.isArray(node.children)) {
        node.children.forEach((child) => traverse(child));
      }
    }

    termNodes.forEach((rootNode) => traverse(rootNode));
    return result;
  }

  const allTerms = flattenTermList(TermList);

  // Save the new content
  const handleSave = (source) => {
    const form = formData[source];

    // If "remember me" is checked, store name + email + checkbox in localStorage
    if (form.rememberMe) {
      const newUserInfo = {
        name: form.name,
        email: form.email,
        rememberMe: form.rememberMe,
      };
      setSavedUserInfo(newUserInfo);
      localStorage.setItem("userInfo", JSON.stringify(newUserInfo));
    } else {
      // If user unchecks, you can remove from localStorage or keep the last saved info—
      // depends on how you want it to behave. For example:
      localStorage.removeItem("userInfo");
      setSavedUserInfo({ name: "", email: "", rememberMe: false });
    }

    // Post
    console.log("Saving new content for:", source, form);

    // then hide the form
    setShowAddForm((prev) => ({ ...prev, [source]: false }));
  };

  // Filter only audio items
  const audioDataItems = media.filter((item) => item.type === "audio");

  // Prepare table rows
  const audioItems = audioDataItems.map((item) => {
    const audioTitle = getAudioTitle(
      item.title,
      contents,
      archiveOrg,
      archive,
      item.source,
      year,
      persons
    );

    const descriptions = item.description || [];
    const sortedDescriptions = [...descriptions].sort(
      (a, b) => parseTimeString(a.start) - parseTimeString(b.start)
    );

    return (
      <React.Fragment key={item.source}>
        {/* Main row for the audio item */}
        <tr className="odd:bg-gray-50 even:bg-white border-b last:border-b-0 border-gray-200">
          <td className="py-2 px-4">
            <ListPlayButton
              media={item}
              recordId={id}
              recordTitle={audioTitle}
            />
          </td>
          <td className="py-2 px-4">{audioTitle}</td>
          <td className="py-2 px-4 flex gap-2 items-center">
            <a
              className="text-isof hover:text-darker-isof transition-colors duration-200 flex hover:cursor-pointer px-2 py-2"
              aria-expanded={openItems[item.source] ? "true" : "false"}
              aria-controls={`descriptions-${item.source}`}
              onClick={() => handleToggle(item.source)}
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
              <span className="px-1 underline underline-offset-2">
                Ladda ner
              </span>{" "}
              <FontAwesomeIcon icon={faDownload} />
            </a>
          </td>
        </tr>

        {/* If open, show descriptions + "add content" button */}
        {openItems[item.source] && (
          <tr
            id={`descriptions-${item.source}`}
            aria-hidden={!openItems[item.source]}
          >
            <td colSpan={3} className="py-4 px-4 border-isof">
              {descriptions.length > 0 ? (
                <table className="w-full table-auto border-collapse text-xs mb-2">
                  <thead>
                    <tr>
                      <th
                        colSpan="5"
                        className="text-left bg-gray-200 py-2 px-4 font-semibold"
                      >
                        Innehållsbeskrivningar
                      </th>
                    </tr>
                    <tr className="border-b border-gray-300">
                      <th className="py-2 px-4">Starttid</th>
                      <th className="py-2 px-4">Beskrivning</th>
                      <th className="py-2 px-4">Termer</th>
                      <th className="py-2 px-4 text-right"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedDescriptions.map((desc, index) => (
                      <tr
                        key={index}
                        className="odd:bg-white even:bg-gray-100 border-b last:border-b-0 border-gray-200"
                      >
                        <td className="py-2 px-4">
                          {/* Play button + start time */}
                          <div className="flex items-center">
                            <ListPlayButton
                              media={item}
                              recordId={id}
                              recordTitle={audioTitle}
                              startTime={parseTimeString(desc.start)}
                              isSubList // indicates sub list
                            />
                            <span className="ml-2 font-mono">{desc.start}</span>
                          </div>
                        </td>
                        <td className="py-2 px-4">{desc.text}</td>
                        <td className="py-2 px-4 flex gap-2 flex-wrap">
                          {desc.terms?.map((termObj) => (
                            <div key={termObj?.termid}>
                              <span className="bg-isof text-white rounded-xl px-2 py-1">
                                #{termObj.term}
                              </span>
                            </div>
                          ))}
                        </td>
                        <td className="py-2 px-4 text-right">
                          <a
                            type="button"
                            className="text-isof hover:text-darker-isof hover:cursor-pointer flex gap-1 items-center justify-end"
                            onClick={() => {
                              // TODO: handle "Ändra" logic
                            }}
                          >
                            <FontAwesomeIcon icon={faPenToSquare} />
                            <span className="underline">Ändra</span>
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="italic py-4 px-2">
                  Inga innehållsbeskrivningar att visa.
                </p>
              )}

              {/* Button to toggle add-form */}
              <div className="flex justify-center my-4">
                <a
                  type="button"
                  className={`transition-all duration-300 ease-in-out flex gap-2 justify-center items-center rounded hover:cursor-pointer w-full px-4 py-2 ${
                    showAddForm[item.source]
                      ? "bg-gray-200 hover:bg-gray-300 text-gray-700"
                      : "bg-isof hover:bg-darker-isof text-white"
                  }`}
                  onClick={() => handleToggleAddForm(item.source)}
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

              {/* The form for adding new content */}
              {showAddForm[item.source] && (
                <div className="border border-gray-300 p-4 my-4 bg-white text-sm relative">
                  {/* 1. name + email + checkbox */}
                  <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-semibold mb-1">
                        Ditt namn (ej obligatoriskt)
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Ange ditt namn"
                          className="border p-2 w-full"
                          value={formData[item.source]?.name || ""}
                          onChange={(e) =>
                            handleChangeField(
                              item.source,
                              "name",
                              e.target.value
                            )
                          }
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block font-semibold mb-1">
                        Din e-post (ej obligatoriskt)
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="email"
                          className="border p-2 w-full"
                          placeholder="Ange din e-post"
                          value={formData[item.source]?.email || ""}
                          onChange={(e) =>
                            handleChangeField(
                              item.source,
                              "email",
                              e.target.value
                            )
                          }
                        />
                      </div>
                    </div>
                  </div>

                  {/* 1b. The "Remember me" checkbox */}
                  <div className="mb-4">
                    <label className="inline-flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData[item.source]?.rememberMe || false}
                        onChange={(e) =>
                          handleChangeField(
                            item.source,
                            "rememberMe",
                            e.target.checked
                          )
                        }
                      />
                      <span>Kom ihåg mig</span>
                    </label>
                  </div>

                  {/* 2. start time */}
                  <div className="mb-4">
                    <label className="block font-semibold mb-1">
                      Starttid (MM:SS)
                    </label>
                    <p className="text-xs text-gray-500 ">
                      Ange minuter och sekunder, t.ex. 01:23
                    </p>
                    <input
                      type="text"
                      className={`border p-2 w-32 mt-1 ${
                        !/^\d{2}:\d{2}$/.test(
                          formData[item.source]?.start || ""
                        ) && formData[item.source]?.start
                          ? "border-red-500"
                          : ""
                      }`}
                      placeholder="00:00"
                      value={formData[item.source]?.start || ""}
                      onChange={(e) =>
                        handleChangeField(item.source, "start", e.target.value)
                      }
                    />
                    {!/^\d{2}:\d{2}$/.test(
                      formData[item.source]?.start || ""
                    ) &&
                      formData[item.source]?.start && (
                        <p className="text-xs text-red-500 mt-1">
                          Ogiltigt format. Ange MM:SS.
                        </p>
                      )}
                  </div>

                  {/* 3. verbose description */}
                  <div className="">
                    <label className="block font-semibold mb-1">
                      Beskrivning / Annotation
                    </label>
                    <textarea
                      className="border p-2 w-full"
                      rows="4"
                      placeholder="Beskriv gärna kortfattat vad som sägs i ljudintervallet."
                      value={formData[item.source]?.descriptionText || ""}
                      onChange={(e) =>
                        handleChangeField(
                          item.source,
                          "descriptionText",
                          e.target.value
                        )
                      }
                    />
                  </div>

                  {/* 4. tags (hierarchical term selection) */}
                  <div className="mb-4">
                    <label className="block font-semibold">
                      Termer/Ämnesord
                    </label>
                    <span className="text-xs text-gray-500 my-1">
                      Ange ett ämnesord eller markera ett eller flera från
                      listan.
                    </span>
                    {/* Typed input */}
                    <div className="relative">
                      <input
                        type="text"
                        className="border p-1 w-full"
                        placeholder="Skriv t.ex. 'Musik' eller 'Mat'"
                        value={formData[item.source]?.typedTag || ""}
                        onChange={(e) =>
                          handleChangeField(
                            item.source,
                            "typedTag",
                            e.target.value
                          )
                        }
                        onKeyDown={(e) => {
                          if (
                            e.key === "Enter" &&
                            formData[item.source]?.typedTag?.trim()
                          ) {
                            handleAddTypedTag(item.source);
                          }
                        }}
                      />
                      {formData[item.source]?.typedTag?.length > 0 && (
                        <div className="absolute z-10 bg-white border border-gray-300 mt-1 w-full max-h-48 overflow-y-auto">
                          {allTerms
                            .filter((t) =>
                              t.term
                                .toLowerCase()
                                .includes(
                                  formData[item.source].typedTag.toLowerCase()
                                )
                            )
                            .slice(0, 15) // Limit to first 15 results
                            .map((match) => (
                              <div
                                key={match.termid}
                                className="px-2 py-1 hover:bg-gray-100 hover:cursor-pointer"
                                onClick={() => {
                                  handleToggleTerm(item.source, match);
                                  handleChangeField(
                                    item.source,
                                    "typedTag",
                                    ""
                                  );
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
                      className="mt-4 text-sm text-white focus:text-white hover:text-white bg-isof hover:bg-darker-isof"
                      onClick={() => handleToggleTermNode(item.source)}
                    >
                      {showTermNode[item.source]
                        ? "Dölj termlista ▲"
                        : "Visa termlista ▼"}
                    </button>
                    {showTermNode[item.source] && (
                      <div className="border p-2">
                        {TermList.map((rootNode) => (
                          <TermNode
                            key={rootNode.termid}
                            node={rootNode}
                            selectedTags={formData[item.source]?.selectedTags}
                            onToggle={handleToggleTerm}
                            source={item.source}
                          />
                        ))}
                      </div>
                    )}
                    {formData[item.source]?.selectedTags.length > 0 && (
                      <span className="block">Valda ämnesord:</span>
                    )}
                    <div className="flex flex-wrap gap-2 mt-2">
                      {(formData[item.source]?.selectedTags || []).map(
                        (tagObj) => (
                          <span
                            key={tagObj.termid}
                            className="flex items-center gap-1 bg-isof text-white px-2 py-1 rounded"
                          >
                            {tagObj.term}
                            <span
                              className="hover:cursor-pointer"
                              onClick={() =>
                                handleToggleTerm(item.source, tagObj)
                              }
                            >
                              ×
                            </span>
                          </span>
                        )
                      )}
                    </div>
                  </div>

                  {/* 5. Save and Cancel buttons */}
                  <div className="flex items-center justify-end gap-4">
                    <a
                      type="button"
                      className="underline text-gray-600 hover:text-gray-900 hover:cursor-pointer"
                      onClick={() => handleToggleAddForm(item.source)}
                    >
                      Avbryt
                    </a>
                    <a
                      type="button"
                      className="px-4 py-2 bg-isof hover:bg-darker-isof text-white rounded hover:cursor-pointer"
                      onClick={() => handleSave(item.source)}
                    >
                      Spara
                    </a>
                  </div>
                </div>
              )}
            </td>
          </tr>
        )}
      </React.Fragment>
    );
  });

  return (
    <div className="mx-auto border-none">
      <div className="overflow-x-auto mb-4 rounded">
        <table className="w-full table-auto border-collapse lg:text-sm text-xs">
          <tbody>{audioItems}</tbody>
        </table>
      </div>
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
  }).isRequired,
};

export default AudioItems;
