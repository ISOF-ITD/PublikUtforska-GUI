import { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faLock, faNewspaper, faChevronDown, faChevronRight, faTh,
} from '@fortawesome/free-solid-svg-icons';
import PropTypes from 'prop-types';
import config from '../../../config';

const getIndicator = (item) => {
  if (item.transcriptionstatus === 'transcribed') {
    return (
      <div className="thumbnail-indicator transcribed-indicator">
        <FontAwesomeIcon icon={faLock} />
      </div>
    );
  }

  if (item.transcriptionstatus === 'published') {
    return (
      <div className="thumbnail-indicator published-indicator">
        <FontAwesomeIcon icon={faNewspaper} />
      </div>
    );
  }

  return null;
};

function getImageItems(data, mediaImageClickHandler) {
  const imageDataItems = data?.media?.filter((dataItem) => dataItem.type === 'image');
  return imageDataItems.map((mediaItem, index) => (
    <div
      key={mediaItem.source}
      data-type="image"
      data-image={mediaItem.source}
      onClick={() => mediaImageClickHandler(mediaItem, imageDataItems, index)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          mediaImageClickHandler(mediaItem, imageDataItems, index);
        }
      }}
      className="archive-image"
      role="button"
      tabIndex={0}
      style={{ position: 'relative' }}
    >
      <img src={config.imageUrl + mediaItem.source} alt="" />
      {getIndicator(mediaItem)}
      {mediaItem.title && (
      <div className="media-title sv-portlet-image-caption">
        {mediaItem.title}
      </div>
      )}
    </div>
  ));
}

function RecordViewThumbnails({ data, mediaImageClickHandler }) {
  const [expanded, setExpanded] = useState(false);
  const [hasLoadedImages, setHasLoadedImages] = useState(false);

  const toggleExpand = () => {
    if (!hasLoadedImages) {
      setHasLoadedImages(true);
    }
    setExpanded(!expanded);
  };

  useEffect(() => {
    // expandera översikten direkt om record är readytotranscribe
    // eftersom det är det enda stället bilderna visas
    setExpanded(data.transcriptionstatus === 'readytotranscribe' && data.transcriptiontype !== 'sida');
    setHasLoadedImages(data.transcriptionstatus === 'readytotranscribe' && data.transcriptiontype !== 'sida');
  }, [data.transcriptionstatus, data.transcriptiontype]);

  const handleKeyDownToggle = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      toggleExpand();
    }
  };

  const imageItems = getImageItems(data, mediaImageClickHandler);

  // Kontrollera om det finns några bilder
  if (imageItems.length === 0) {
    return null;
  }

  return (
    <div>
      <button
        className="headwords-toggle"
        type="button"
        tabIndex={0}
        style={{
          textDecoration: 'underline',
          cursor: 'pointer',
        }}
        onClick={toggleExpand}
        onKeyDown={handleKeyDownToggle}
      >
        <FontAwesomeIcon icon={expanded ? faChevronDown : faChevronRight} />
        &nbsp;
        Visa översikt
        &nbsp;
        <FontAwesomeIcon icon={faTh} />
      </button>
      {hasLoadedImages && (
        <div
          className="record-view-thumbnails"
          style={{ display: expanded ? 'block' : 'none' }}
        >
          {imageItems}
        </div>
      )}
    </div>
  );
}

export default RecordViewThumbnails;

RecordViewThumbnails.propTypes = {
  data: PropTypes.object.isRequired,
  mediaImageClickHandler: PropTypes.func.isRequired,
};
