import React, { useState, useContext } from 'react';
import PropTypes from 'prop-types';
import { useParams, useOutletContext } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCheck,
  faTimes,
  faEdit,
  faPlay,
} from '@fortawesome/free-solid-svg-icons';
import { getAudioTitle } from '../../utils/helpers';
import { AudioContext } from '../../contexts/AudioContext';

function TranscribePage() {
  const { source } = useParams();
  const { data } = useOutletContext();
  const [editingUtterance, setEditingUtterance] = useState(null);
  const [editedText, setEditedText] = useState('');
  const { playAudio } = useContext(AudioContext);

  // Get the audio item and its utterances from the record data
  const audioItem = data?.media?.find(
    (item) => item.source === decodeURIComponent(source)
  );

  const audioTitle = audioItem ? getAudioTitle(
    audioItem.title,
    data?.contents,
    data?.archive?.arhive_org,
    data?.archive?.archive,
    audioItem.source,
    data?.year,
    data?.persons
  ) : '';

  const utterances = audioItem?.utterances || [];

  const handleEdit = (utterance) => {
    setEditingUtterance(utterance);
    setEditedText(utterance.text);
  };

  const handleSave = (utterance) => {
    // TODO: Implement API call to save changes
    // The API endpoint would be something like:
    // POST /api/transcribe/update
    // Payload:
    // {
    //   recordId,
    //   source,
    //   utteranceId: utterance.id,
    //   text: editedText,
    //   speaker: utterance.speaker,
    //   start: utterance.start,
    //   end: utterance.end
    // }
    setEditingUtterance(null);
  };

  const handleDiscard = () => {
    setEditingUtterance(null);
  };

  const formatTimestamp = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handlePlay = (startTime) => {
    playAudio({
      record: {
        id: data?.id,
        title: audioTitle,
      },
      audio: audioItem,
      time: startTime,
    });
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-white shadow-sm rounded-lg p-6 mb-6">
        <h1 className="text-2xl font-semibold text-gray-900 mb-2">
          Transkribering
        </h1>
        <p className="text-gray-600">
          {audioTitle}
        </p>
      </div>

      {/* Utterances List */}
      <div className="bg-white shadow-sm rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tidpunkt
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Talare
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Spela
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Text
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Åtgärder
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {utterances.map((utterance) => (
              <tr key={`${utterance.start}-${utterance.end}`} className="odd:bg-gray-50 even:bg-white hover:bg-gray-100">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatTimestamp(utterance.start)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {utterance.speaker}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <button
                    className="text-isof hover:text-darker-isof transition-colors duration-200"
                    onClick={() => handlePlay(utterance.start)}
                  >
                    <FontAwesomeIcon icon={faPlay} className="w-3 h-3 text-darker-isof" />
                  </button>
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">
                  {editingUtterance === utterance ? (
                    <textarea
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-isof focus:border-isof"
                      value={editedText}
                      onChange={(e) => setEditedText(e.target.value)}
                      rows={2}
                    />
                  ) : (
                    utterance.text
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  {editingUtterance === utterance ? (
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => handleSave(utterance)}
                        className="text-green-600 hover:text-green-900"
                      >
                        <FontAwesomeIcon icon={faCheck} />
                      </button>
                      <button
                        onClick={handleDiscard}
                        className="text-red-600 hover:text-red-900"
                      >
                        <FontAwesomeIcon icon={faTimes} />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleEdit(utterance)}
                      className="text-isof hover:text-darker-isof"
                    >
                      <FontAwesomeIcon icon={faEdit} />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default TranscribePage; 