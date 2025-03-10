import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faDownload,
  faCaretDown,
  faCaretUp,
  faPenToSquare,
  faCirclePlus,
  faTimes,
  faCheck,
} from '@fortawesome/free-solid-svg-icons';
import config from '../../../config';
import { getAudioTitle } from '../../../utils/helpers';
import ListPlayButton from '../ListPlayButton';

// Helper to convert "MM:SS" to seconds
function parseTimeString(timeString = '00:00') {
  const parts = timeString.split(':').map(Number).reverse();
  let seconds = 0;
  if (parts[0]) seconds += parts[0];       // seconds
  if (parts[1]) seconds += parts[1] * 60;  // minutes
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

  // Load saved name and email from local storage
  const [savedUserInfo, setSavedUserInfo] = useState(() => {
    const savedInfo = localStorage.getItem('userInfo');
    return savedInfo ? JSON.parse(savedInfo) : { name: '', email: '' };
  });

  // Save name and email to local storage
  const saveUserInfo = () => {
    localStorage.setItem('userInfo', JSON.stringify(savedUserInfo));
  };

  // Handle changes to the saved name and email fields
  const handleUserInfoChange = (field, value) => {
    setSavedUserInfo((prevInfo) => ({
      ...prevInfo,
      [field]: value,
    }));
  };

  // A predefined list of tags
  const availableTags = ['Musik', 'Intervju', 'Historia', 'Plats', 'Tradition'];

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
          // prefill with name/email from savedUserInfo:
          name: savedUserInfo.name,
          email: savedUserInfo.email,
          start: '', // "MM:SS"
          descriptionText: '',
          typedTag: '',
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

  // Add or remove tag from selectedTags
  const handleToggleTag = (source, tag) => {
    setFormData((prevData) => {
      const currentTags = prevData[source].selectedTags || [];
      const alreadySelected = currentTags.includes(tag);
      let newTags;
      if (alreadySelected) {
        // remove
        newTags = currentTags.filter((t) => t !== tag);
      } else {
        // add
        newTags = [...currentTags, tag];
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
          typedTag: '', // reset typed tag
        },
      };
    });
  };

  // Save the new content
  const handleSave = (source) => {
    const form = formData[source];

    // If "remember me" is checked, store the user info
    if (form.rememberMe) {
      const newUserInfo = { name: form.name, email: form.email };
      setSavedUserInfo(newUserInfo);
      localStorage.setItem('userInfo', JSON.stringify(newUserInfo));
    }

    // Post
    console.log('Saving new content for:', source, form);

    // then hide the form
    setShowAddForm((prev) => ({ ...prev, [source]: false }));
  };

  // Filter only audio items
  const audioDataItems = media.filter((item) => item.type === 'audio');

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
        <tr
          className="odd:bg-gray-50 even:bg-white border-b last:border-b-0 border-gray-200"
        >
          <td className="py-2 px-4">
            <ListPlayButton media={item} recordId={id} recordTitle={audioTitle} />
          </td>
          <td className="py-2 px-4">{audioTitle}</td>
          <td className="py-2 px-4 flex gap-2 items-center">
            <a
              className="text-isof hover:text-darker-isof flex hover:cursor-pointer px-2 py-2"
              aria-expanded={openItems[item.source] ? 'true' : 'false'}
              aria-controls={`descriptions-${item.source}`}
              onClick={() => handleToggle(item.source)}
            >
              {openItems[item.source] ? (
                <span className="whitespace-nowrap">
                  <span className="px-1">Stäng</span>{' '}
                  <FontAwesomeIcon icon={faCaretUp} />
                </span>
              ) : (
                <span className="whitespace-nowrap">
                  <span className="px-1">Visa Innehåll</span>{' '}
                  <FontAwesomeIcon icon={faCaretDown} />
                </span>
              )}
            </a>
            <a
              href={`${config.audioUrl}${item.source}`}
              download
              title="Ladda ner ljudfilen"
              className="text-isof hover:text-darker-isof no-underline"
            >
              <span className="px-1 underline underline-offset-2">Ladda ner</span>{' '}
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
                  className={`flex gap-2 justify-center items-center rounded hover:cursor-pointer w-full px-4 py-2 ${showAddForm[item.source]
                    ? 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                    : 'bg-isof hover:bg-darker-isof text-white'
                    }`}
                  onClick={() => handleToggleAddForm(item.source)}
                >
                  {showAddForm[item.source] ? (
                    <>
                      <span className="flex-grow text-left">Lägg till ny beskrivning</span>
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
                          className="border p-2 w-full"
                          value={formData[item.source]?.name || ''}
                          onChange={(e) =>
                            handleChangeField(item.source, 'name', e.target.value)
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
                          value={formData[item.source]?.email || ''}
                          onChange={(e) =>
                            handleChangeField(item.source, 'email', e.target.value)
                          }
                        />
                      </div>
                    </div>
                  </div>

                  {/* 1b. The "Remember me" / "Spara mina uppgifter" checkbox */}
                  <div className="mb-4">
                    <label className="inline-flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData[item.source]?.rememberMe || false}
                        onChange={(e) =>
                          handleChangeField(item.source, 'rememberMe', e.target.checked)
                        }
                      />
                      <span>Spara mina uppgifter</span>
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
                      className="border p-2 w-32 mt-1"
                      placeholder="00:00"
                      value={formData[item.source]?.start || ''}
                      onChange={(e) =>
                        handleChangeField(item.source, 'start', e.target.value)
                      }
                    />
                  </div>

                  {/* 3. verbose description */}
                  <div className="mb-4">
                    <label className="block font-semibold mb-1">
                      Beskrivning / Annotation
                    </label>
                    <textarea
                      className="border p-2 w-full"
                      rows="4"
                      value={formData[item.source]?.descriptionText || ''}
                      onChange={(e) =>
                        handleChangeField(item.source, 'descriptionText', e.target.value)
                      }
                    />
                  </div>

                  {/* 4. tags (checkbox list + typed input) */}
                  <div className="mb-4">
                    <label className="block font-semibold mb-1">Termer</label>
                    <p className="text-xs text-gray-500">
                      Bocka i en eller flera av nedanstående termer eller skriv en egen.
                    </p>
                    {/* typed input for new tag */}
                    <div className="flex items-center gap-2 mb-2 mt-1">
                      <input
                        type="text"
                        className="border p-1"
                        placeholder="Skriv en ny tagg..."
                        value={formData[item.source]?.typedTag || ''}
                        onChange={(e) =>
                          handleChangeField(item.source, 'typedTag', e.target.value)
                        }
                      />
                      <a
                        type="button"
                        className="bg-gray-300 px-2 py-1 rounded text-sm"
                        onClick={() => handleAddTypedTag(item.source)}
                      >
                        Lägg till
                      </a>
                    </div>
                    <div className="flex flex-wrap gap-4 mb-2">
                      {availableTags.map((tag) => (
                        <label key={tag} className="flex items-center gap-1">
                          <input
                            type="checkbox"
                            checked={
                              formData[item.source]?.selectedTags?.includes(tag) || false
                            }
                            onChange={() => handleToggleTag(item.source, tag)}
                          />
                          <span>{tag}</span>
                        </label>
                      ))}
                    </div>

                    {/* Display chosen tags with remove-button */}
                    <div className="flex flex-wrap gap-2 mt-2">
                      {(formData[item.source]?.selectedTags || []).map((tag) => (
                        <span
                          key={tag}
                          className="flex items-center gap-1 bg-isof text-white px-2 py-1 rounded"
                        >
                          {tag}
                          <a
                            type="button"
                            onClick={() => handleToggleTag(item.source, tag)}
                            className="text-white"
                          >
                            <FontAwesomeIcon icon={faTimes} />
                          </a>
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* 5. Save and Cancel buttons */}
                  <div className="flex items-center justify-end gap-4">
                    <a
                      type="button"
                      className="underline text-gray-600 hover:text-gray-900"
                      onClick={() => handleToggleAddForm(item.source)}
                    >
                      Avbryt
                    </a>
                    <a
                      type="button"
                      className="px-4 py-2 bg-isof hover:bg-darker-isof text-white rounded"
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
