import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFileLines, faVolumeHigh } from "@fortawesome/free-solid-svg-icons";
import PdfGif from "../../../../img/pdf.gif";

/**
 * Renders the small PDF / image / audio icons shown in the title row.
 */
export default function MediaIcons({ media }) {
  if (!media?.length) return null;

  return (
    <>
      {media.some((m) => m.source?.toLowerCase().endsWith(".pdf")) && (
        <sub>
          <img src={PdfGif} alt="pdf" className="mx-1 inline" />
        </sub>
      )}
      {media.some((m) => m.source?.toLowerCase().endsWith(".jpg")) && (
        <FontAwesomeIcon
          icon={faFileLines}
          title="Uppteckning"
          className="mx-1 text-isof"
        />
      )}
      {media.some((m) => m.source?.toLowerCase().endsWith(".mp3")) && (
        <FontAwesomeIcon
          icon={faVolumeHigh}
          title="Inspelning"
          className="mx-1 text-isof"
        />
      )}
    </>
  );
}
