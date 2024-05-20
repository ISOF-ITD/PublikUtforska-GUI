import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faAsterisk, faCheck, faLock } from '@fortawesome/free-solid-svg-icons';
import config from '../../../config';

export default function TranscriptionThumbnails({ thumbnailContainerRef, pages, navigatePages, currentPageIndex }) {
  const isDisabled = (page) => {
    if (
      page.isSent || page.transcriptionstatus === 'reviewing' || page.transcriptionstatus === ' published'
    ) {
      return true;
    }
    return false;
  }
  return (
    <div className="image-thumbnails" ref={thumbnailContainerRef}>
      {pages.map((page, index) => (
        page.source && page.source.indexOf('.pdf') === -1 && (
          <div
            className={`thumbnail-container ${isDisabled(page) ? 'disabled' : ''}`}
            key={index}
            onClick={() => navigatePages(index)}
            title={`${!page.isSent ? 'OSPARADE ÄNDRINGAR' : ''}\n${JSON.stringify(page, null, 2)}`}
          >
            <img
              className={`thumbnail ${index === currentPageIndex ? 'active' : ''} ${!page.isSent ? 'unsaved' : ''} ${page.isSent ? 'sent' : ''} ${page.isReviewing ? 'reviewing' : ''}`}
              src={`${config.imageUrl}${page.source}`}
              alt={`Thumbnail ${index + 1}`}
            />
            {!page.isSent && page.unsavedChanges && (
              <div className="thumbnail-indicator unsaved-indicator">
                <FontAwesomeIcon icon={faAsterisk} />
              </div>
            )}
            {page.isSent && (
              <div className="thumbnail-indicatorsent-indicator">
                <FontAwesomeIcon icon={faCheck} />
              </div>
            )}
            {page.transcriptionstatus === 'reviewing' && (
              <div className="thumbnail-indicator reviewing-indicator">
                <FontAwesomeIcon icon={faLock} />
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
