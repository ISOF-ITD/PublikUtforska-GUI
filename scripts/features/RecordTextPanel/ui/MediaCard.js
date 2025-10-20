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
      <div className="md:grid md:grid-cols-5 md:gap-1 items-center">
        <figure className="relative col-span-3 md:sticky md:top-2">
          <ArchiveImage
            mediaItem={mediaItem}
            index={index}
            onMediaClick={onMediaClick}
            onKeyDown={onKeyDown}
            imageUrl={imageUrl}
            renderIndicator={renderIndicator}
            renderMagnifyingGlass
            imgClassName="w-full"
            imgProps={{
              loading: "lazy",
              decoding: "async",
              sizes: "(min-width: 640px) 320px, 100vw",
            }}
          />
          <figcaption className="sr-only">
            {(mediaItem.title || l("Sida")) + " " + (index + 1)}
          </figcaption>
        </figure>
        <div className="col-span-2">{right}</div>
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
