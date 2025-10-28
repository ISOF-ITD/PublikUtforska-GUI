import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faFileLines,
  faVolumeHigh,
  faFilePdf,
} from "@fortawesome/free-solid-svg-icons";

/**
 * Renders the small PDF / image / audio icons shown in the title row.
 */
export default function MediaIcons({ media }) {
  if (!media?.length) return null;

  const has = (ext) => media.some((m) => m.source?.toLowerCase().endsWith(ext));

  return (
    <>
      {has(".pdf") && (
        <FontAwesomeIcon
          icon={faFilePdf}
          title="PDF"
          className="mx-1 text-red-500 align-middle"
          aria-hidden="true"
        />
      )}
      {has(".jpg") && (
        <FontAwesomeIcon
          icon={faFileLines}
          title="Uppteckning"
          className="mx-1 text-isof align-middle"
          aria-hidden="true"
        />
      )}
      {has(".mp3") && (
        <FontAwesomeIcon
          icon={faVolumeHigh}
          title="Inspelning"
          className="mx-1 text-isof align-middle"
          aria-hidden="true"
        />
      )}
    </>
  );
}
