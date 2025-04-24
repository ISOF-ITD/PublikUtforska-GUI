import { Link } from "react-router-dom";
import { l } from "../../lang/Lang";
import {
  getTitle,
  makeArchiveIdHumanReadable,
  getPlaceString,
  pageFromTo,
} from "../../utils/helpers";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArchive,
  faCalendar,
  faChevronRight,
  faMapMarkedAlt,
  faPencil,
  faUser,
  faTag,
  faCheckCircle,
  faFileLines,
  faVolumeHigh,
} from "@fortawesome/free-solid-svg-icons";
import PdfGif from "../../../img/pdf.gif";
import config from "../../config";
import TranscribeButton from "../../components/views/transcribe/TranscribeButton";

const pill =
  "inline-flex items-center border rounded-full px-3 py-1 text-xs font-medium";

export const RecordCardItem = ({ item, searchParams, mode = "material" }) => {
  const {
    _source: {
      archive,
      media,
      metadata,
      places,
      persons,
      transcriptiontype,
      transcriptionstatus,
      title,
      contents,
      year,
      id,
    },
    highlight,
  } = item;

  /* helpers */
  const displayTitle = getTitle(title, contents, archive, highlight);
  const archiveId = makeArchiveIdHumanReadable(
    archive.archive_id,
    archive.archive_org
  );
  const placeString = getPlaceString(places);
  const recordUrl = `${
    mode === "transcribe" ? "/transcribe" : ""
  }/records/${id}`;
  const audioItem = media.find((m) => m.type === "audio");
  const showSummary =
    metadata?.some((m) => m.type === "summary") &&
    !!item.text &&
    item.text.length > 0;

  // Collector filtering
  const collectorPersons = persons?.filter((p) =>
    ["c", "collector", "interviewer", "recorder"].includes(p.relation)
  );

  const statusConfig = {
    readytotranscribe: {
      text: l("Klar för avskrift"),
      icon: faPencil,
      class: "bg-orange-100 border-orange-200 text-orange-800",
    },
    transcribed: {
      text: l("Avskriven"),
      icon: faCheckCircle,
      class: "bg-green-100 border-green-200 text-green-800",
    },
    default: {
      text: transcriptionstatus,
      icon: faTag,
      class: "bg-gray-100 border-gray-200 text-gray-800",
    },
  };

  const status = statusConfig[transcriptionstatus] || statusConfig.default;

  return (
    <article className="group relative rounded-lg border border-gray-100 bg-white p-4 shadow-sm transition-all hover:shadow-md">
      {/* Header Section */}
      <header className="flex items-center gap-2">
        {media?.some((m) => m.source?.toLowerCase().includes(".pdf")) && (
          <sub>
            <img src={PdfGif} alt="pdf" title="Accession" className="inline" />
          </sub>
        )}
        {media?.some((m) => m.source?.toLowerCase().includes(".jpg")) && (
          <FontAwesomeIcon
            icon={faFileLines}
            className="text-isof"
            title="Uppteckning"
          />
        )}
        {media?.some((m) => m.source?.toLowerCase().includes(".mp3")) && (
          <FontAwesomeIcon
            icon={faVolumeHigh}
            className="text-isof"
            title="Inspelning"
          />
        )}
        <span className="flex-1 text-lg font-semibold leading-tight !text-isof">
          <Link
            to={recordUrl}
            className="!text-isof focus:outline-none focus:ring-2 focus:ring-isof"
          >
            <span dangerouslySetInnerHTML={{ __html: displayTitle }} />
            <span className="ml-2 inline-block text-gray-400 transition-all group-hover:translate-x-1">
              <FontAwesomeIcon icon={faChevronRight} />
            </span>
          </Link>
        </span>
      </header>

      {/* Metadata Grid */}
      <div className="mt-3 flex flex-col gap-2 text-sm">
        <div className="flex items-center gap-1.5">
          <FontAwesomeIcon icon={faArchive} className="flex-shrink-0" />
          <span className="font-medium text-isof">
            <b>Arkivnummer:</b> {archiveId}
          </span>
          {archive.page && (
            <span className="text-gray-500">:{pageFromTo(item)}</span>
          )}
        </div>

        {placeString && (
          <div className="flex items-center">
            <span className="text-gray-700">
              <b>Ort:</b> {placeString}
            </span>
          </div>
        )}

        {year && (
          <div className="flex items-center">
            <span className="text-gray-700">
              <b>År:</b> {year.split("-")[0]}
            </span>
          </div>
        )}

        {config?.siteOptions?.recordList?.visibleCollecorPersons &&
          collectorPersons?.length > 0 && (
            <div className="flex items-center">
              <div className="flex flex-wrap gap-1  items-center">
              <b>Insamlare:</b>
                {collectorPersons.map((p) => (
                  <Link
                    key={p.id}
                    to={`${
                      mode === "transcribe" ? "/transcribe" : ""
                    }/persons/${p.id.toLowerCase()}`}
                    className="text-isof hover:underline text-xs"
                  >
                    {l(p.name)}
                  </Link>
                ))}
              </div>
            </div>
          )}
      </div>

      {/* Summary Section */}
      {showSummary && (
        <div className="mt-3 relative">
          <p className="text-sm text-gray-600 line-clamp-3 transition-all">
            {item.text}
          </p>
          <div className="absolute bottom-0 h-6 w-full bg-gradient-to-t from-white via-white/80 pointer-events-none"></div>
        </div>
      )}

      {/* Transcription CTA */}
      {transcriptionstatus === "readytotranscribe" && media.length > 0 && (
        <div className="mt-4 border-t border-gray-100 pt-3">
          <TranscribeButton
            className="w-full justify-center bg-isof hover:bg-darker-isof text-white font-medium py-2 px-4 rounded-lg transition-colors"
            label={
              <>
                <FontAwesomeIcon icon={faPencil} />
                {l("Skriv av")}
              </>
            }
            title={title}
            recordId={id}
            archiveId={archive.archive_id}
            places={places}
            images={media}
            transcriptionType={transcriptiontype}
            random={false}
          />
        </div>
      )}
    </article>
  );
};
