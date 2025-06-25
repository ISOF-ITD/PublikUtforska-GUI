/* eslint-disable react/require-default-props */
import { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';

function ArchiveImage({
  mediaItem,
  index,
  onMediaClick,
  onKeyDown,
  imageUrl,
  renderIndicator = null,
  renderMagnifyingGlass = false,
}) {
  const containerRef = useRef(null);
  const imageRef = useRef(null);
  const glassRef = useRef(null);
  const [dimensions, setDimensions] = useState({ subWidth: 0, subHeight: 0 });

  // Sätt bakgrundsbild och storlek på förstoringsglaset om det ska renderas
  useEffect(() => {
    if (!renderMagnifyingGlass) return;
    if (glassRef.current) {
      glassRef.current.style.background = `url(${imageUrl + mediaItem.source}) no-repeat`;
      glassRef.current.style.backgroundSize = 'cover';
    }
  }, [mediaItem.source, imageUrl, renderMagnifyingGlass]);

  // Hämta bildens ursprungliga dimensioner
  useEffect(() => {
    const img = new Image();
    img.src = imageUrl + mediaItem.source;
    img.onload = () => {
      setDimensions({ subWidth: img.width, subHeight: img.height });
    };
  }, [mediaItem.source, imageUrl]);

  useEffect(() => {
    if (!renderMagnifyingGlass) return;
    if (glassRef.current && dimensions.subWidth && dimensions.subHeight) {
      const zoomFactor = 1; // zoom level
      glassRef.current.style.backgroundSize = `${dimensions.subWidth * zoomFactor}px ${dimensions.subHeight * zoomFactor}px`;
    }
  }, [dimensions, renderMagnifyingGlass]);

  // Eventhandler för musrörelse
  const handleMouseMove = (e) => {
    if (!renderMagnifyingGlass) return; // Avsluta om förstoringsglas inte ska användas
    const container = containerRef.current;
    const glass = glassRef.current;
    const imgEl = imageRef.current;
    if (!container || !glass || !imgEl) return;

    const rect = container.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    // Om musen är utanför bilden – göm förstoringsglaset
    if (mx < 0 || my < 0 || mx > rect.width || my > rect.height) {
      glass.style.display = 'none';
      return;
    }
    glass.style.display = 'block';

    const imgWidth = imgEl.offsetWidth;
    const imgHeight = imgEl.offsetHeight;
    const glassWidth = glass.offsetWidth;
    const glassHeight = glass.offsetHeight;
    const { subWidth, subHeight } = dimensions;

    const rx = Math.round((mx / imgWidth) * subWidth - glassWidth / 3) * -1;
    const ry = Math.round((my / imgHeight) * subHeight - glassHeight / 3) * -1;
    const bgp = `${rx}px ${ry}px`;

    const px = mx - glassWidth / 2.5;
    const py = my - glassHeight / 2.5;

    glass.style.left = `${px}px`;
    glass.style.top = `${py}px`;
    glass.style.backgroundPosition = bgp;
  };

  const handleMouseLeave = () => {
    if (!renderMagnifyingGlass) return;
    if (glassRef.current) {
      glassRef.current.style.display = 'none';
    }
  };

  return (
    <div
      className="archive-image"
      role="button"
      tabIndex="0"
      data-type="image"
      data-image={mediaItem.source}
      onClick={() => onMediaClick(mediaItem, index)}
      onKeyDown={(e) => onKeyDown(e, mediaItem, index)}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      ref={containerRef}
      style={{ position: 'relative', cursor: 'pointer' }}
    >
      <img
        ref={imageRef}
        src={imageUrl + mediaItem.source}
        alt={mediaItem.title || ''}
        loading="lazy"
        style={{
          userSelect: 'none',
          pointerEvents: 'none',
          display: 'block',
          width: '100%',
        }}
      />

      {/* Container för indikatorer */}
      <div className="indicator-container">
        {renderIndicator && renderIndicator(mediaItem)}
      </div>

      {/* Rendera förstoringsglaset endast om renderMagnifyingGlass är true */}
      {renderMagnifyingGlass && (
        <div
          className="magnifying-glass"
          ref={glassRef}
          style={{
            position: 'absolute',
            display: 'none',
            height: '220px',
            width: '220px',
            borderRadius: '50%',
            pointerEvents: 'none',
          }}
        />
      )}

      <div className="media-title sv-portlet-image-caption">
        {mediaItem.title || ''}
        {mediaItem.comment && mediaItem.comment.trim() !== '' && mediaItem.comment.trim() !== 'None' && (
          <div>
            <br />
            <strong>Kommentar:</strong>
            <br />
            {mediaItem.comment}
          </div>
        )}
      </div>
    </div>
  );
}

ArchiveImage.propTypes = {
  mediaItem: PropTypes.object.isRequired,
  index: PropTypes.number.isRequired,
  onMediaClick: PropTypes.func.isRequired,
  onKeyDown: PropTypes.func.isRequired,
  imageUrl: PropTypes.string.isRequired,
  renderIndicator: PropTypes.func,
  renderMagnifyingGlass: PropTypes.bool,
};

export default ArchiveImage;
