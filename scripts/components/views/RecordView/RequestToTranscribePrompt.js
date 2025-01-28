import PropTypes from 'prop-types';
import React, { useMemo } from 'react';
import RequestToTranscribeButton from '../RequestToTranscribeButton';
import { l } from '../../../lang/Lang';

// Definiera konstanter för strängar
const STRINGS = {
  underTranscription: 'Den här uppteckningen håller på att transkriberas av annan användare.',
  underReview: 'Den här uppteckningen är avskriven och granskas.',
  notTranscribed: 'Den här uppteckningen är inte avskriven.',
  invitation: 'Vill du vara med och tillgängliggöra samlingarna för fler? Vill du kunna skriva av denna berättelse!',
  transcribe: 'Skriv av',
  perPage: 'sida för sida',
  of: 'av',
  pagesTranscribed: 'sidor avskrivna',
};

export default function RequestToTranscribePrompt({ data }) {
  const {
    numberofonerecord,
    transcriptiontype = null,
    transcriptionstatus,
    media = [],
    title = '',
    id,
    archive,
    places = [],
    recordtype,
  } = data;

  // Returnera tidigt om recordtype inte är 'one_accession_row'
  // Alltså: Visa bara knapp om recordtype === 'one_accesion_row' OCH den inte har några onerecords
  if (!(recordtype === 'one_accession_row' && transcriptionstatus === 'accession' && numberofonerecord === 0)) {
    return null;
  }

  // Använd useMemo för att optimera beräkningar
  const {
    numberOfMedia,
    numberOfTranscribedMedia,
    isUnderReview,
  } = useMemo(() => {
    let transcribedCount = 0;
    media.forEach((page) => {
      if (page.transcriptionstatus === 'transcribed' || page.transcriptionstatus === 'published') {
        transcribedCount += 1;
      }
    });

    return {
      numberOfMedia: media.length,
      numberOfTranscribedMedia: transcribedCount,
      isUnderReview: [
        'undertranscription',
        'transcribed',
        'reviewing',
        'needsimprovement',
        'approved',
      ].includes(transcriptionstatus),
    };
  }, [media, transcriptiontype, transcriptionstatus]);

  // Hantera olika renderingsfall
  if (transcriptionstatus === 'undertranscription') {
    return <p>{l(STRINGS.underTranscription)}</p>;
  } if (isUnderReview) {
    return <p>{l(STRINGS.underReview)}</p>;
  }

  const transcribedText = l(STRINGS.notTranscribed);

  return (
    <div>
      <p>
        <strong>{transcribedText}</strong>
        <br />
        <br />
        {l(STRINGS.invitation)}
      </p>
      <RequestToTranscribeButton
        className="button button-primary"
        label={`${l(STRINGS.transcribe)} ${
          transcriptiontype === 'sida' ? l(STRINGS.perPage) : ''
        }`}
        title={title}
        id={id}
      />
    </div>
  );
}

RequestToTranscribePrompt.propTypes = {
  data: PropTypes.shape({
    numberofonerecord: PropTypes.number,
    transcriptiontype: PropTypes.string,
    transcriptionstatus: PropTypes.string.isRequired,
    media: PropTypes.arrayOf(
      PropTypes.shape({
        transcriptionstatus: PropTypes.string.isRequired,
      }),
    ),
    title: PropTypes.string,
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    archive: PropTypes.shape({
      archive_id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    }).isRequired,
    places: PropTypes.arrayOf(PropTypes.object),
    recordtype: PropTypes.string.isRequired,
  }).isRequired,
};
