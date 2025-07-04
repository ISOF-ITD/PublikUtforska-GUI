/* eslint-disable react/require-default-props */
import PropTypes from 'prop-types';
import { useState, useMemo, useCallback } from 'react';
import config from '../../../config';
import HighlightSwitcher from './HighlightSwitcher';
import { l } from '../../../lang/Lang';
import TranscribeButton from '../transcribe/TranscribeButton';
import ArchiveImage from './ArchiveImage';
import ContributorInfo from './ContributorInfo';

function TextElement({ data, highlightData = null, mediaImageClickHandler }) {
  const {
    id: recordId,
    title,
    archive,
    places,
    text,
    transcribedby,
    transcriptiontype,
    transcriptionstatus,
    media,
    recordtype,
  } = data;
  const { imageUrl } = config;
  const [highlight, setHighlight] = useState(true);

  // Händelsehanterare för bildklick
  const handleMediaClick = useCallback(
    (mediaItem, index) => {
      mediaImageClickHandler(mediaItem, media, index);
    },
    [mediaImageClickHandler, media],
  );

  // Händelsehanterare för keydown
  const handleKeyDown = useCallback(
    (e, mediaItem, index) => {
      if (e.key === 'Enter' || e.key === ' ') {
        mediaImageClickHandler(mediaItem, media, index);
      }
    },
    [mediaImageClickHandler, media],
  );

  const renderMedia = (mediaItem, index) => (
    <div className="four columns" key={mediaItem.source || index}>
      <ArchiveImage
        mediaItem={mediaItem}
        index={index}
        onMediaClick={handleMediaClick}
        onKeyDown={handleKeyDown}
        imageUrl={imageUrl}
        renderMagnifyingGlass
      />
    </div>
  );

  // RETURN null if
  // Also for: mediaItem.type === 'audio'?
  if (recordtype === 'accession_row' || (transcriptionstatus !== 'published' && transcriptiontype !== 'sida')) {
    return null;
  }

  if (transcriptiontype === 'sida') {
    const innerHits = highlightData?.data?.[0]?.inner_hits?.media?.hits?.hits || [];
    const highlightedMediaTexts = useMemo(() => innerHits.reduce((acc, hit) => {
      const innerHitHighlightedText = hit?.highlight?.['media.text']?.[0];

      if (innerHitHighlightedText) {
        // eslint-disable-next-line no-underscore-dangle
        acc[`${hit?._nested?.offset}`] = innerHitHighlightedText;
      }

      return acc;
    }, {}), [innerHits]);
    // RETURN if transcriptiontype = 'sida'
    return (
      <main>
        {
      innerHits.length > 0
      && <HighlightSwitcher highlight={highlight} setHighlight={setHighlight} />
      }
        {media.map((mediaItem, index) => (
          // Only show if type is 'image'
          mediaItem.type === 'image' && (
          <div
            className="row record-text-and-image"
            key={mediaItem.source || index}
          >
            <div className="eight columns">
              {(() => {
                // Visa text den finns och om transcriptionstatus är readytotranscribe annars transcribe-knapp
                if (mediaItem.text && mediaItem.transcriptionstatus !== 'readytotranscribe') {
                  return (
                    <p
                      className="display-line-breaks"
                      dangerouslySetInnerHTML={{
                        __html: (highlight && highlightedMediaTexts[`${index}`])
                          ? highlightedMediaTexts[`${index}`]
                          : mediaItem.text,
                      }}
                    />
                  );
                } if (transcriptionstatus === 'readytotranscribe') {
                  return (
                    <TranscribeButton
                      className="button button-primary"
                      label={l('Skriv av')}
                      title={title}
                      recordId={recordId}
                      archiveId={archive.archive_id}
                      places={places}
                      images={media}
                      transcriptionType={transcriptiontype}
                      random={false}
                    />
                  );
                }
                // Visa tomt fält:
                // return <div style={{ height: '0px' }} className="button button-primary" />;
                return <p>{l('Denna text håller på att skrivas av, av en användare eller är under behandling.')}</p>;
              })()}
            </div>
            {renderMedia(mediaItem, index)}
          </div>
          )
        ))}
      </main>
    );
  }

  // if transcriptiontype !== 'sida'
  const highlightedText = highlightData?.data?.[0]?.highlight?.text?.[0] || '';

  // Use highlighted text if active, otherwise fallback to the original text
  const sourceText = highlight && highlightedText ? highlightedText : text;

  // Split the text by '/' and remove leading newlines from each part
  const textParts = sourceText?.split(/\/\s*$/m).map((part) => part.replace(/^\n+/, ''));

  // RETURN if transcriptiontype !== 'sida'
  return (
    <main>
      {
        highlightedText
        && <HighlightSwitcher highlight={highlight} setHighlight={setHighlight} />
      }
      {media.map((mediaItem, index) => (
        mediaItem.type === 'image' && (
        <div className="row record-text-and-image" key={mediaItem.source || index}>
          <div className="eight columns">
            <p
              className="display-line-breaks"
              dangerouslySetInnerHTML={{
                __html: textParts ? textParts[index] : '&nbsp;',
              }}
            />
          </div>
          {renderMedia(mediaItem, index)}
        </div>
        )))}
      <ContributorInfo
        transcribedby={transcribedby}
        comment={data.comment}
        transcriptiondate={data.transcriptiondate}
      />
    </main>
  );
}

export default TextElement;

TextElement.propTypes = {
  data: PropTypes.object.isRequired,
  highlightData: PropTypes.object,
  mediaImageClickHandler: PropTypes.func.isRequired,
};
