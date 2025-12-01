import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faFileLines,
  faVolumeHigh,
  faFilePdf,
} from "@fortawesome/free-solid-svg-icons";

/**
 * Renders a single media icon with priority:
 * audio > image > pdf
 */
export default function MediaIcons({ media }) {
  if (!media?.length) return null;

  // Decide which media type should be represented by a single icon
  const pickPrimaryMediaType = (mediaArr) => {
    // 1. Audio takes precedence
    if (
      mediaArr.some(
        (m) =>
          m.type === "audio" ||
          m.source?.toLowerCase().endsWith(".mp3")
      )
    ) {
      return "audio";
    }

    // 2. Then image / scanned pages
    if (
      mediaArr.some(
        (m) =>
          m.type === "image" ||
          /\.(jpe?g|png|gif|webp)$/i.test(m.source ?? "")
      )
    ) {
      return "image";
    }

    // 3. Then PDF
    if (
      mediaArr.some(
        (m) =>
          m.type === "pdf" ||
          m.source?.toLowerCase().endsWith(".pdf")
      )
    ) {
      return "pdf";
    }

    return null;
  };

  const type = pickPrimaryMediaType(media);
  if (!type) return null;

  if (type === "audio") {
    return (
      <FontAwesomeIcon
        icon={faVolumeHigh}
        title="Inspelning"
        className="mx-1 text-isof align-middle"
        aria-hidden="true"
      />
    );
  }

  if (type === "image") {
    return (
      <FontAwesomeIcon
        icon={faFileLines}
        title="Uppteckning"
        className="mx-1 text-isof align-middle"
        aria-hidden="true"
      />
    );
  }

  if (type === "pdf") {
    return (
      <FontAwesomeIcon
        icon={faFilePdf}
        title="PDF"
        className="mx-1 text-red-500 align-middle"
        aria-hidden="true"
      />
    );
  }

  return null;
}
