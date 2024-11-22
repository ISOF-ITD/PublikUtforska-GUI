import { useState, useContext } from 'react';
import PropTypes from 'prop-types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronDown, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { AudioContext } from '../../../contexts/AudioContext';
import { getAudioTitle } from '../../../utils/helpers';

export default function ContentsElement({ data }) {
  const {
    contents,
    id,
    media,
    title,
    archive: {
      archive_org: archiveOrg,
      archive,
    },
    year,
    persons,
  } = data;
  const [expanded, setExpanded] = useState(false);

  if (!contents) return null;

  const {
    playAudio,
  } = useContext(AudioContext);

  const timeslotClickHandler = (e, time) => {
    e.preventDefault();
    playAudio({
      record: {
        id,
        title: getAudioTitle(
          title,
          contents,
          archiveOrg,
          archive,
          media[0].source,
          year,
          persons,
        ),
      },
      audio: media[0],
      time,
    });
  };

  // Helper function to convert "MM:SS" to seconds
  const timeToSeconds = (timeString) => {
    const [minutes, seconds] = timeString.split(':').map(Number);
    return minutes * 60 + seconds;
  };

  // Replace timestamps in contents with clickable buttons
  const parseContentWithClickableTimeslots = (text) => {
    const timestampRegex = /\((\d{2}:\d{2})\)/g; // Matchar tidsangivelser med parenteser
    return text.split(timestampRegex).map((part, index) => {
      if (timestampRegex.test(`(${part})`)) {
        const seconds = timeToSeconds(part);
        const uniqueKey = `timeslot-${seconds}-${text.slice(index, index + 5)}`;

        return (
          <button
            className="button-small"
            key={uniqueKey}
            onClick={(e) => timeslotClickHandler(e, seconds)}
            style={{ cursor: 'pointer' }}
            type="button"
          >
            {part} {/* Renderar tidsangivelsen utan parentes */}
          </button>
        );
      }
      return part;
    });
  };
  

  return (
    <div className="row">
      <div className="twelve columns">
        <button
          aria-expanded={expanded}
          className="headwords-toggle"
          type="button"
          tabIndex={0}
          style={{
            textDecoration: 'underline',
            cursor: 'pointer',
            background: 'none',
            border: 'none',
            padding: 0,
            font: 'inherit',
          }}
          onClick={() => setExpanded(!expanded)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setExpanded(!expanded);
            }
          }}
        >
          <FontAwesomeIcon icon={expanded ? faChevronDown : faChevronRight} />
          {' '}
          <span>Innehåll</span>
        </button>
        <div className={`record-text realkatalog-content display-line-breaks ${expanded ? 'show' : 'hide'}`}>
          {parseContentWithClickableTimeslots(contents)}
        </div>
      </div>
    </div>
  );
}

ContentsElement.propTypes = {
  data: PropTypes.shape({
    contents: PropTypes.string,
  }).isRequired,
};
