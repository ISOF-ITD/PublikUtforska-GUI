import PropTypes from 'prop-types';
import React, { useMemo } from 'react';
import TranscribeButton from '../transcribe/TranscribeButton';
import { l } from '../../../lang/Lang';

// Definiera konstanter för strängar
const STRINGS = {
  underTranscription: 'Den här uppteckningen håller på att transkriberas av annan användare.',
  underReview: 'Den här uppteckningen är avskriven och granskas.',
  notTranscribed: 'Den här uppteckningen är inte avskriven.',
  invitation: 'Vill du vara med och tillgängliggöra samlingarna för fler? Hjälp oss att skriva av berättelser!',
  transcribe: 'Skriv av',
  perPage: 'sida för sida',
  of: 'av',
  pagesTranscribed: 'sidor avskrivna',
};

export default function TranscriptionPrompt({ data }) {
  const {
    transcriptiontype,
    transcriptionstatus,
    media = [],
    title,
    id,
    archive,
    places = [],
    recordtype,
  } = data;

  // Returnera tidigt om recordtype är 'one_accession_row'
  if (recordtype === 'one_accession_row' || transcriptionstatus === 'published') {
    return null;
  }

  // Använd useMemo för att optimera beräkningar
  const {
    numberOfSubrecordsMedia,
    numberOfTranscribedSubrecordsMedia,
    isUnderReview,
  } = useMemo(() => {
    let transcribedCount = 0;
    media.forEach((page) => {
      if (page.transcriptionstatus === 'transcribed') transcribedCount += 1;
    });
    const allReviewed = transcriptiontype === 'sida'
      && media.length > 0
      && media.every((page) => page.transcriptionstatus !== 'readytotranscribe');

    return {
      numberOfSubrecordsMedia: media.length,
      numberOfTranscribedSubrecordsMedia: transcribedCount,
      isUnderReview: !allReviewed,
    };
  }, [media, transcriptiontype]);

  // Hantera olika renderingsfall
  if (transcriptionstatus === 'undertranscription') {
    return <p>{l(STRINGS.underTranscription)}</p>;
  } if (isUnderReview) {
    return <p>{l(STRINGS.underReview)}</p>;
  }

  const transcribedText = transcriptiontype === 'sida' && numberOfSubrecordsMedia > 0
    ? `${numberOfTranscribedSubrecordsMedia} ${l(STRINGS.of)} ${numberOfSubrecordsMedia} ${l(STRINGS.pagesTranscribed)}`
    : l(STRINGS.notTranscribed);

  return (
    <div>
      <p>
        <strong>{transcribedText}</strong>
        <br />
        <br />
        {l(STRINGS.invitation)}
      </p>
      <TranscribeButton
        className="button button-primary"
        label={`${l(STRINGS.transcribe)} ${
          transcriptiontype === 'sida' ? l(STRINGS.perPage) : ''
        }`}
        title={title}
        recordId={id}
        archiveId={archive.archive_id}
        places={places}
        images={media}
        transcriptionType={transcriptiontype}
        random={false}
      />
    </div>
  );
}

TranscriptionPrompt.propTypes = {
  data: PropTypes.shape({
    transcriptiontype: PropTypes.string.isRequired,
    transcriptionstatus: PropTypes.string.isRequired,
    media: PropTypes.arrayOf(
      PropTypes.shape({
        transcriptionstatus: PropTypes.string.isRequired,
      }),
    ),
    title: PropTypes.string.isRequired,
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    archive: PropTypes.shape({
      archive_id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    }).isRequired,
    places: PropTypes.arrayOf(PropTypes.string),
    recordtype: PropTypes.string.isRequired,
  }).isRequired,
};
