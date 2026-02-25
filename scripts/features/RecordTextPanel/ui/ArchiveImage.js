/* eslint-disable react/require-default-props */
import { useEffect, useRef, useState } from "react";
import PropTypes from "prop-types";
import classNames from "classnames";
import { l } from "../../../lang/Lang";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCommentDots } from "@fortawesome/free-solid-svg-icons";

/**
 * ArchiveImage component to display an image from the archive with optional
 * magnifying glass effect and status indicator.
 *
 * Props:
 * - imageUrl: Full path to file storage of images
 * - mediaItem: Media item object containing source with relative path to image file, title, comment, etc.
 */
function ArchiveImage({
  mediaItem,
  index,
  onMediaClick,
  imageUrl,
  renderIndicator = null,
  renderMagnifyingGlass = false,
  variant = "default",
  className = "",
  imgClassName = "",
  showCaption = true,
  imgProps = {},
}) {
  const containerRef = useRef(null);
  const imageRef = useRef(null);
  const glassRef = useRef(null);
  const rafRef = useRef(null);

  const [dimensions, setDimensions] = useState({ subWidth: 0, subHeight: 0 });
  const isThumb = variant === "thumbnail";

  // Prepare magnifier background
  useEffect(() => {
    if (!renderMagnifyingGlass) return;
    if (glassRef.current) {
      glassRef.current.style.background = `url(${
        imageUrl + mediaItem.source
      }) no-repeat`;
      glassRef.current.style.backgroundSize = "cover";
    }
  }, [mediaItem.source, imageUrl, renderMagnifyingGlass, isThumb]);

  // Get natural image size
  useEffect(() => {
    const img = new Image();
    img.src = imageUrl + mediaItem.source;
    img
      .decode?.()
      .catch(() => {})
      ?.finally?.(() => {}); // best-effort
    img.onload = () => {
      setDimensions({ subWidth: img.width, subHeight: img.height });
    };
  }, [mediaItem.source, imageUrl]);

  useEffect(() => {
    if (!renderMagnifyingGlass || isThumb) return;
    if (glassRef.current && dimensions.subWidth && dimensions.subHeight) {
      const zoomFactor = 1; // tweak if you want more zoom
      glassRef.current.style.backgroundSize = `${
        dimensions.subWidth * zoomFactor
      }px ${dimensions.subHeight * zoomFactor}px`;
    }
  }, [dimensions, renderMagnifyingGlass, isThumb]);

  const updateLens = (e) => {
    if (!renderMagnifyingGlass) return;
    const container = containerRef.current;
    const glass = glassRef.current;
    const imgEl = imageRef.current;
    if (!container || !glass || !imgEl) return;

    const rect = container.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    // Hide if outside bounds
    if (mx < 0 || my < 0 || mx > rect.width || my > rect.height) {
      glass.style.display = "none";
      return;
    }
    glass.style.display = "block";

    const imgWidth = imgEl.offsetWidth;
    const imgHeight = imgEl.offsetHeight;
    const glassWidth = glass.offsetWidth;
    const glassHeight = glass.offsetHeight;
    const { subWidth, subHeight } = dimensions;

    const rx = Math.round((mx / imgWidth) * subWidth - glassWidth / 3) * -1;
    const ry = Math.round((my / imgHeight) * subHeight - glassHeight / 3) * -1;

    const px = mx - glassWidth / 2.5;
    const py = my - glassHeight / 2.5;

    glass.style.left = `${px}px`;
    glass.style.top = `${py}px`;
    // Set size of magnifying glass here 
    // (Seems not to work to set in renderMagnifyingGlass-div below: class w- and h-)
    // Corner shape is set at renderMagnifyingGlass-div below with tailwind rounded-..
    glass.style.width = `400px`;
    glass.style.height = `200px`;
    glass.style.backgroundPosition = `${rx}px ${ry}px`;
  };

  // Throttle with rAF
  const handleMouseMove = (e) => {
    if (!renderMagnifyingGlass || isThumb) return;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => updateLens(e));
  };

  const handleMouseLeave = () => {
    if (!renderMagnifyingGlass) return;
    if (glassRef.current) glassRef.current.style.display = "none";
  };

  const handleClick = () => onMediaClick(mediaItem, index);

  const containerClasses = classNames(
    "group relative flex gap-3 overflow-hidden rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-isof focus-visible:ring-offset-2 focus-visible:ring-offset-white cursor-zoom-in appearance-none block w-full h-auto m-0 p-0 border-0 bg-transparent text-left align-top leading-none",
    isThumb ? "w-28 sm:w-32 md:w-36 shrink-0" : "w-full",
    className
  );

  const imageClasses = classNames(
    isThumb
      ? "block w-full h-28 sm:h-32 md:h-36 object-contain bg-neutral-50 bg-neutral-200"
      : "block w-full max-w-[640px] h-auto bg-neutral-50/40 bg-neutral-200/40",
    "select-none pointer-events-none rounded-md",
    imgClassName
  );

  return (
    <div className="relative">
      {/* Click target: use a real button for semantics */}
      <button
        type="button"
        className={containerClasses}
        aria-label={mediaItem.title || 'Visa bild'}
        onClick={handleClick}
        onMouseMove={isThumb ? undefined : handleMouseMove}
        onMouseLeave={isThumb ? undefined : handleMouseLeave}
        ref={containerRef}
      >
        <img
          ref={imageRef}
          src={imageUrl + mediaItem.source}
          alt={mediaItem.title?.trim() || mediaItem.comment?.trim() || 'Arkivbild'}
          className={imageClasses}
          {...imgProps}
        />

        {/* Status indicator container */}
        <div className="absolute inset-0">
          {renderIndicator && renderIndicator(mediaItem)}
        </div>

        {renderMagnifyingGlass && !isThumb && (
          <div
            ref={glassRef}
            aria-hidden="true"
            className="absolute hidden rounded-3xl border-2 border-solid border-white border-offset-2 border-offset-black/30 shadow-xl w-52 h-52 pointer-events-none"
          />
        )}
      </button>

      {/* Caption (visible) */}
      {showCaption && (mediaItem.title || mediaItem.comment) && (
        <div className="mt-2 text-sm text-gray-700">
          {/* title is already shown in the segment header, 
          can be used later if we add support for single page titles
          <div className="font-medium">{mediaItem.title || ""}</div>
          
          Comments are shown here, although they often come from transcriber, but there's no garantee they do.
          */}
          {mediaItem.comment &&
            mediaItem.comment.trim() !== "" &&
            mediaItem.comment.trim() !== "None" && (
              <div className="text-gray-600 flex items-center gap-2">
                 <FontAwesomeIcon icon={faCommentDots} />
                {l("Kommentarer: ")}
                {mediaItem.comment}
              </div>
            )}
        </div>
      )}
    </div>
  );
}

ArchiveImage.propTypes = {
  mediaItem: PropTypes.object.isRequired,
  index: PropTypes.number.isRequired,
  onMediaClick: PropTypes.func.isRequired,
  imageUrl: PropTypes.string.isRequired,
  renderIndicator: PropTypes.func,
  renderMagnifyingGlass: PropTypes.bool,
  variant: PropTypes.oneOf(["default", "thumbnail"]),
  className: PropTypes.string,
  imgClassName: PropTypes.string,
  showCaption: PropTypes.bool,
  imgProps: PropTypes.object,
};

export default ArchiveImage;
