/* eslint-disable react/require-default-props */
import PropTypes from 'prop-types';
import { useState, useMemo, useCallback } from 'react';
import config from '../../../config';
import HighlightSwitcher from './HighlightSwitcher';

function TextElement({ data, highlightData = null, mediaImageClickHandler }) {
  const {
    text,
    transcriptiontype,
    transcriptionstatus,
    media,
    recordtype,
  } = data;
  const { imageUrl } = config;
  const [highlight, setHighlight] = useState(true);

  // Händelsehanterare för bildklick
  const handleMediaClick = useCallback(
    (mediaItem) => {
      mediaImageClickHandler(mediaItem);
    },
    [mediaImageClickHandler],
  );

  // Händelsehanterare för keydown
  const handleKeyDown = useCallback(
    (e, mediaItem) => {
      if (e.key === 'Enter' || e.key === ' ') {
        mediaImageClickHandler(mediaItem);
      }
    },
    [mediaImageClickHandler],
  );

  const renderMedia = (mediaItem) => (
    <div className="four columns">
      <div
        data-type="image"
        data-image={mediaItem.source}
        onClick={() => handleMediaClick(mediaItem)}
        onKeyDown={(e) => handleKeyDown(e, mediaItem)}
        className="archive-image"
        role="button"
        tabIndex="0"
      >
        <img
          src={imageUrl + mediaItem.source}
          alt={mediaItem.title || mediaItem.source.split('/').pop()}
                  // lazy loading for long texts with many images
          loading="lazy"
        />

        <div className="media-title sv-portlet-image-caption">
          {mediaItem.title || mediaItem.source.split('/').pop()}
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

  if (recordtype === 'accession_row' || transcriptionstatus !== 'published') {
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
      <>
        {
          innerHits.length > 0
          && <HighlightSwitcher highlight={highlight} setHighlight={setHighlight} />
        }
        {media.map((mediaItem, index) => (
          <div className="row record-text-and-image" key={mediaItem.source || index}>
            <div className="eight columns">
              <div
                className="display-line-breaks"
                dangerouslySetInnerHTML={{
                  __html: (highlight && highlightedMediaTexts[`${index}`]) || mediaItem.text,
                }}
              />
            </div>
            { renderMedia(mediaItem) }
          </div>
        ))}
      </>
    );
  }

  // if transcriptiontype !== 'sida'
  const highlightedText = highlightData?.data?.[0]?.highlight?.text?.[0] || '';
  const textParts = highlightedText && highlight ? highlightedText.split(/\/\s*$/m) : text.split(/\/\s*$/m);
  return (
    <>
      {
        highlightedText
        && <HighlightSwitcher highlight={highlight} setHighlight={setHighlight} />
      }
      {media.map((mediaItem, index) => (
        <div className="row record-text-and-image" key={mediaItem.source || index}>
          <div className="eight columns">
            <div
              className="display-line-breaks"
              dangerouslySetInnerHTML={{
                __html: textParts[index],
              }}
            />
          </div>
          { renderMedia(mediaItem) }
        </div>
      ))}
    </>
  );
}

export default TextElement;

TextElement.propTypes = {
  data: PropTypes.object.isRequired,
  highlightData: PropTypes.object,
  mediaImageClickHandler: PropTypes.func.isRequired,
};
