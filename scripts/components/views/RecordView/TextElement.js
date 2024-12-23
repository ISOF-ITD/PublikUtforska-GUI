/* eslint-disable react/require-default-props */
import PropTypes from 'prop-types';
import { useState, useMemo, useCallback } from 'react';
import config from '../../../config';
import HighlightSwitcher from './HighlightSwitcher';
import { l } from '../../../lang/Lang';
import TranscribeButton from '../transcribe/TranscribeButton';

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
    <div className="four columns">
      <div
        data-type="image"
        data-image={mediaItem.source}
        onClick={() => handleMediaClick(mediaItem, index)}
        onKeyDown={(e) => handleKeyDown(e, mediaItem, index)}
        className="archive-image"
        role="button"
        tabIndex="0"
      >
        <img
          src={imageUrl + mediaItem.source}
          alt={mediaItem.title || ''}
          // lazy loading for long texts with many images
          loading="lazy"
          style={{
            // Förhindrar att bilden blir markerad
            // när man markerar texten
            userSelect: 'none',
            pointerEvents: 'none',
          }}
        />

        <div className="media-title sv-portlet-image-caption">
          {mediaItem.title || ''}
          {mediaItem.comment && mediaItem.comment.trim() !== '' && (
            <div>
              <br />
              <strong>Kommentar:</strong>
              <br />
              {mediaItem.comment}
            </div>
          )}
        </div>
      </div>
    </div>
  );

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
    return (
      <main>
        {
          innerHits.length > 0
          && <HighlightSwitcher highlight={highlight} setHighlight={setHighlight} />
        }
        {media.map((mediaItem, index) => (
          <div className="row record-text-and-image" key={mediaItem.source || index}>
            <div className="eight columns">
              { mediaItem.text ? (
                <p
                  className="display-line-breaks"
                  dangerouslySetInnerHTML={{
                    __html: (highlight && highlightedMediaTexts[`${index}`]) || mediaItem.text,
                  }}
                />
              ) : (
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
              )}
            </div>
            {renderMedia(mediaItem, index)}
          </div>
        ))}
      </main>
    );
  }

  // if transcriptiontype !== 'sida'
  const highlightedText = highlightData?.data?.[0]?.highlight?.text?.[0] || '';
  const textParts = highlightedText && highlight ? highlightedText.split(/\/\s*$/m) : text.split(/\/\s*$/m);
  return (
    <main>
      {
        highlightedText
        && <HighlightSwitcher highlight={highlight} setHighlight={setHighlight} />
      }
      {media.map((mediaItem, index) => (
        <div className="row record-text-and-image" key={mediaItem.source || index}>
          <div className="eight columns">
            <p
              className="display-line-breaks"
              dangerouslySetInnerHTML={{
                __html: textParts[index] || '&nbsp;',
              }}
            />
          </div>
          {renderMedia(mediaItem)}
        </div>
      ))}
      {transcribedby && (
        <p className="text-small">
          <strong>{`${l('Transkriberad av')}: `}</strong>
          <span>
            {transcribedby}
          </span>
        </p>
      )}
    </main>
  );
}

export default TextElement;

TextElement.propTypes = {
  data: PropTypes.object.isRequired,
  highlightData: PropTypes.object,
  mediaImageClickHandler: PropTypes.func.isRequired,
};
