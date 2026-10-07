import PropTypes from "prop-types";
import { memo } from "react";
import Card from "./Card";
import ArchiveImage from "./ArchiveImage";
import { l } from "../../../lang/Lang";

const MediaCard = memo(function MediaCard({
  // transcriptionStatus, //Needed here?
  mediaItem,
  index,
  imageUrl,
  renderIndicator,
  onMediaClick,
  right,
  headingLevel = 'h3',
}) {
  const Heading = headingLevel;
  return (
    <Card> {/* <Card> får sin TranscribeButton från buildTextSide i RecordSegment som kommer från RecordTextPanel */}
      <Heading className="!mt-0 mb-2 text-lg font-semibold">
        {`${l('Sida')} ${index + 1}${mediaItem.title ? ` – ${mediaItem.title}` : ''}`}
      </Heading>
      <div className="md:grid items-start md:gap-6 md:[grid-template-columns:minmax(0,1.15fr)_minmax(0,1fr)]">
        <figure className="relative md:sticky md:top-2 md:self-start">
          {/* Cap figure height and scroll the image inside if it’s very tall */}
          <div className="md:max-h-[calc(100vh-1rem)] md:overflow-auto md:pr-1">
            <ArchiveImage
              mediaItem={mediaItem}
              index={index}
              onMediaClick={onMediaClick}
              imageUrl={imageUrl}
              renderIndicator={renderIndicator}
              renderMagnifyingGlass
              buttonLabel={`Öppna större bild av sida ${index + 1}`}
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
        <div className="min-w-0 self-center">{right}</div>
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
  right: PropTypes.node,
  headingLevel: PropTypes.oneOf(['h3', 'h4']),
};
export default MediaCard;
