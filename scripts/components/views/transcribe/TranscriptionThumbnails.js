import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faAsterisk, faCheck, faLock, faNewspaper,
} from '@fortawesome/free-solid-svg-icons'; // Importera faNewspaper ikonen
import config from '../../../config';

export default function TranscriptionThumbnails({
  thumbnailContainerRef,
  pages,
  navigatePages,
  currentPageIndex,
}) {
  const thumbnailTitleAttribute = (page) => {
    if (!page.isSent && page.unsavedChanges) {
      return 'Sidan har redigerats';
    }

    if (page.isSent) {
      return 'Sidan har skickats';
    }

    if (page.transcriptionstatus === 'transcribed') {
      return 'Sidan kontrolleras';
    }

    if (page.transcriptionstatus === 'published') {
      return 'Sidan har publicerats';
    }
    if (page.transcriptionstatus === 'readytotranscribe') {
      return 'Sidan kan skrivas av';
    }
    return null;
  };

  return (
    <div className="image-thumbnails" ref={thumbnailContainerRef}>
      {pages.map((page, index) => (
        page.source && page.source.indexOf('.pdf') === -1 && (
          <div
            className="thumbnail-container"
            key={index}
            onClick={() => navigatePages(index)}
            title={thumbnailTitleAttribute(page)}
          // title={`${JSON.stringify(page, null, 2)}`}
          >
            <img
              className={`thumbnail ${index === currentPageIndex ? 'active' : ''}`}
              src={`${config.imageUrl}${page.source}`}
              alt={`Thumbnail ${index + 1}`}
            />
            {!page.isSent && page.unsavedChanges && (
              <div className="thumbnail-indicator unsaved-indicator">
                <FontAwesomeIcon icon={faAsterisk} />
              </div>
            )}
            {page.isSent && (
              <div className="thumbnail-indicator sent-indicator">
                <FontAwesomeIcon icon={faCheck} />
              </div>
            )}
            {!page.isSent && ['transcribed'].includes(page.transcriptionstatus) && (
              <div className="thumbnail-indicator transcribed-indicator">
                <FontAwesomeIcon icon={faLock} />
              </div>
            )}
            {!page.isSent && ['published'].includes(page.transcriptionstatus) && (
              <div className="thumbnail-indicator published-indicator">
                <FontAwesomeIcon icon={faNewspaper} />
              </div>
            )}
            <div className="page-number">
              {`${index + 1} av ${pages.length}`}
            </div>
          </div>
        )
      ))}
    </div>
  );
}
