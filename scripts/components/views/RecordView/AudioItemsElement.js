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
            <td colSpan={3} className="py-2 px-4 bg-gray-100 w-full">
              {descriptions.length > 0 ? (
                <div className="space-y-2">
                  {descriptions.map((desc, index) => (
                    <div
                      key={index}
                      className="flex flex-row items-center gap-2 border-b border-gray-300 pb-2 w-full justify-between"
                    >
                      <div className="flex lg:gap-4 gap-2 items-center">
                        <ListPlayButton
                          media={item}
                          recordId={id}
                          recordTitle={audioTitle}
                        // e.g. startTime={desc.start}
                        />
                        <span className="font-mono">{desc.start}</span>
                        <span>{desc.text}</span>
                      </div>
                      {desc.terms && desc.terms.map((termObj, index) => (
                        <span key={index}>
                          {termObj.term} — {termObj.termid}
                        </span>
                      ))}
                      <a
                        type="button"
                        className="text-isof hover:text-darker-isof hover:cursor-pointer flex gap-1 items-center"
                        onClick={() => {
                          // TODO: handle "Ändra" logic here
                        }}
                      >
                        <FontAwesomeIcon icon={faPenToSquare} />
                        <span className="underline">Ändra</span>
                      </a>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="italic py-4">
                  Inga innehållsbeskrivningar att visa.
                </p>
              )}
              <a
                type="button"
                className="block w-full flex gap-2 justify-center items-center rounded hover:cursor-pointer p-2 my-2 bg-isof hover:bg-darker-isof text-white text-center"
                onClick={() => {
                  // TODO: handle "Lägg till innehåll" logic
                }}
              >
                <FontAwesomeIcon icon={faCirclePlus} />
                <span>Lägg till innehåll</span>
              </a>
            </td>
          </tr>
        )}
      </React.Fragment>
    );
  });

  return (
    <div className="container mx-auto px-4 border-none">
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
