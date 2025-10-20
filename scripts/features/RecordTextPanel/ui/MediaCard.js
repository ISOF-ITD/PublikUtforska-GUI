import PropTypes from "prop-types";
import { memo } from "react";
import Card from "./Card";
import ArchiveImage from "./ArchiveImage";
import { l } from "../../../lang/Lang";

const MediaCard = memo(function MediaCard({
  mediaItem,
  index,
  imageUrl,
  renderIndicator,
  onMediaClick,
  onKeyDown,
  right,
}) {
  return (
    <Card>
      <div className="md:grid items-start md:gap-6 md:[grid-template-columns:minmax(18rem,1.15fr)_minmax(18rem,1fr)]">
        <figure className="relative md:sticky md:top-2 md:self-start">
          {/* Cap figure height and scroll the image inside if it’s very tall */}
          <div className="md:max-h-[calc(100vh-1rem)] md:overflow-auto md:pr-1">
            <ArchiveImage
              mediaItem={mediaItem}
              index={index}
              onMediaClick={onMediaClick}
              onKeyDown={onKeyDown}
              imageUrl={imageUrl}
              renderIndicator={renderIndicator}
              renderMagnifyingGlass
              // Make the image fit width but never exceed viewport height
              imgClassName="w-full h-auto max-h-[80vh] object-contain"
              imgProps={{
                loading: "lazy",
                decoding: "async",
                sizes:
                  "(min-width:1280px) 640px, (min-width:1024px) 55vw, (min-width:768px) 60vw, 100vw",
              }}
            />
          </div>

          <figcaption className="sr-only">
            {(mediaItem.title || l("Sida")) + " " + (index + 1)}
          </figcaption>
        </figure>

        {/* Ensure the text column never collapses to something unreadable */}
        <div className="min-w-[18rem] self-center">{right}</div>
      </div>
    </Card>
  );
});

MediaCard.propTypes = {
  mediaItem: PropTypes.object.isRequired,
  index: PropTypes.number.isRequired,
  imageUrl: PropTypes.string.isRequired,
  renderIndicator: PropTypes.func.isRequired,
  onMediaClick: PropTypes.func.isRequired,
  onKeyDown: PropTypes.func.isRequired,
  right: PropTypes.node.isRequired,
};
export default MediaCard;
