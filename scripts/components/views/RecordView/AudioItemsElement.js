import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faDownload,
  faCaretDown,
  faCaretUp,
  faPenToSquare,
  faCirclePlus,
} from '@fortawesome/free-solid-svg-icons';
import config from '../../../config';
import { getAudioTitle } from '../../../utils/helpers';
import ListPlayButton from '../ListPlayButton';

function AudioItems({ data }) {
  const {
    id,
    media,
    contents,
    archive: { arhive_org: archiveOrg, archive },
    year,
    persons,
  } = data;

  const [openItems, setOpenItems] = useState({});

  // Toggle a sub-list of descriptions for a single audio file
  const handleToggle = (source) => {
    setOpenItems((prevState) => ({
      ...prevState,
      [source]: !prevState[source],
    }));
  };

  // Filter out only audio items
  const audioDataItems = media.filter((item) => item.type === 'audio');

  // Create table rows for each audio item
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

    // Fallback to an empty array so that .map won’t break if undefined/null
    const descriptions = item.description || [];

    // Helper function to convert "MM:SS" to total seconds
    function parseTimeString(timeString = '00:00') {
      // "mm:ss" -> total seconds
      const parts = timeString.split(':').map(Number).reverse();
      let seconds = 0;
      if (parts[0]) seconds += parts[0];         // ss
      if (parts[1]) seconds += parts[1] * 60;    // mm
      if (parts[2]) seconds += parts[2] * 3600;  // hh
      return seconds;
    }
    

    // Sort the descriptions array based on the start time
    const sortedDescriptions = [...descriptions].sort(
      (a, b) => parseTimeString(a.start) - parseTimeString(b.start)
    );


    return (
      <React.Fragment key={item.source}>
        <tr className="odd:bg-gray-50 even:bg-white border-b last:border-b-0 border-gray-200">
          <td className="py-2 px-4">
            <ListPlayButton media={item} recordId={id} recordTitle={audioTitle} />
          </td>
          <td className="py-2 px-4">{audioTitle}</td>
          <td className="py-2 px-4 flex gap-2 items-center">
            <a
              className="text-isof hover:text-darker-isof flex hover:cursor-pointer px-2 py-2"
              onClick={() => handleToggle(item.source)}
            >
              {openItems[item.source] ? (
                <span className='whitespace-nowrap'>
                  <span className="px-1">Stäng</span>{' '}
                  <FontAwesomeIcon icon={faCaretUp} />
                </span>
              ) : (
                <span className='whitespace-nowrap'>
                  <span className="px-1">Visa Innehåll</span>{' '}
                  <FontAwesomeIcon icon={faCaretDown} />
                </span>
              )}
            </a>
            <a
              href={`${config.audioUrl}${item.source}`}
              download
              title="Ladda ner ljudfilen"
              className="text-isof hover:text-darker-isof"
            >
              <FontAwesomeIcon icon={faDownload} />
            </a>
          </td>
        </tr>

        {/* Conditionally render a sub-row for content descriptions */}
        {openItems[item.source] && (
          <tr>
            <td colSpan={3} className="py-2 px-4 bg-gray-100">
              {descriptions.length > 0 ? (
                <table className="w-full table-auto border-collapse text-sm mb-2">
                  <thead>
                    <tr className="border-b border-gray-300">
                      <th className="py-2 px-4">Spela</th>
                      <th className="py-2 px-4">Starttid</th>
                      <th className="py-2 px-4">Beskrivning</th>
                      <th className="py-2 px-4">Termer</th>
                      <th className="py-2 px-4 text-right">Åtgärder</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedDescriptions.map((desc, index) => (
                      <tr
                        key={index}
                        className="odd:bg-white even:bg-gray-50 border-b last:border-b-0 border-gray-200"
                      >
                        {/* Play Button */}
                        <td>
                          <ListPlayButton
                            media={item}
                            recordId={id}
                            recordTitle={audioTitle}
                            startTime={parseTimeString(desc.start)}
                          />
                        </td>

                        {/* Start time (or timestamp) */}
                        <td className="py-2 px-4 font-mono">{desc.start}</td>

                        {/* Description text */}
                        <td className="py-2 px-4">{desc.text}</td>

                        {/* Terms */}
                        <td className="py-2 px-4">
                          {desc.terms?.map((termObj, termIndex) => (
                            <div key={termIndex}>
                              {termObj.term} — {termObj.termid}
                            </div>
                          ))}
                        </td>

                        {/* Actions (e.g., "Ändra") */}
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
                <p className="italic py-4">
                  Inga innehållsbeskrivningar att visa.
                </p>
              )}

              {/* Button to add new content descriptions */}
              <div className="flex justify-center">
                <a
                  type="button"
                  className="flex gap-2 justify-center items-center rounded hover:cursor-pointer px-4 py-2 bg-isof hover:bg-darker-isof text-white"
                  onClick={() => {
                    // TODO: handle "Lägg till innehåll" logic
                  }}
                >
                  <FontAwesomeIcon icon={faCirclePlus} />
                  <span>Lägg till innehåll</span>
                </a>
              </div>
            </td>
          </tr>
        )}

      </React.Fragment>
    );
  });

  return (
    <div className="container mx-auto border-none">
      <div className="overflow-x-auto mb-4 rounded">
        <table className="w-full table-auto border-collapse text-sm">
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
            description: PropTypes.arrayOf(
              PropTypes.shape({
                term: PropTypes.string,
                termid: PropTypes.string,
              })
            )
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
