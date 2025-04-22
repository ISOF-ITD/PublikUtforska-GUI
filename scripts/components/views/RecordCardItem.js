import { Link } from "react-router-dom";
import { l } from "../../lang/Lang";
import {
  getTitle,
  makeArchiveIdHumanReadable,
  getPlaceString,
  pageFromTo,
} from "../../utils/helpers";
import ListPlayButton from "../../features/AudioDescription/ListPlayButton";
import TranscribeButton from "./transcribe/TranscribeButton";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArchive, faCalendar, faChevronRight, faMapMarkedAlt, faPencil, faTag } from "@fortawesome/free-solid-svg-icons";

const pill = "inline-flex items-center border border-gray-200 rounded-full px-3 py-1 text-xs font-medium";

export const RecordCardItem = ({ item, searchParams, mode = "material" }) => {
  const {
    _source: {
      archive,
      media,
      metadata,
      places,
      recordtype,
      transcriptionstatus,
      transcriptiontype,
      title,
      contents,
      year,
      id,
    },
    highlight,
  } = item;

  /* helpers */
  const displayTitle = getTitle(title, contents, archive, highlight);
  const archiveId = makeArchiveIdHumanReadable(archive.archive_id, archive.archive_org);
  const placeString = getPlaceString(places);
  const recordUrl = `${mode === "transcribe" ? "/transcribe" : ""}/records/${id}`;
  const audioItem = media.find((m) => m.type === "audio");
  const showSummary = metadata?.some((m) => m.type === "summary") && !!item.text && item.text.length > 0;

  return (
    <article className="group relative rounded-lg border border-gray-100 bg-white p-4 shadow-sm transition-all hover:shadow-md">
      {/* Header Section */}
      <header className="flex items-start gap-3">
        {audioItem && (
          <div className="flex-shrink-0">
            <ListPlayButton
              disablePlayback
              media={audioItem}
              recordId={item._source.id}
              recordTitle={title ?? l("(Utan titel)")}
              className="text-isof hover:text-darker-isof"
            />
          </div>
        )}
        
        <h3 className="flex-1 text-lg font-semibold leading-tight text-gray-900">
          <Link to={recordUrl} className="hover:text-isof focus:outline-none focus:ring-2 focus:ring-isof">
            <span dangerouslySetInnerHTML={{ __html: displayTitle }} />
            <span className="ml-2 inline-block text-gray-400 transition-all group-hover:translate-x-1">
              <FontAwesomeIcon icon={faChevronRight} />
            </span>
          </Link>
        </h3>
      </header>

      {/* Metadata Grid */}
      <div className="mt-3 grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
        <div className="flex items-center gap-1.5">
        <FontAwesomeIcon icon={faArchive} />
          <span className="font-medium text-isof">{archiveId}</span>
          {archive.page && <span className="text-gray-500">:{pageFromTo(item)}</span>}
        </div>

        {placeString && (
          <div className="flex items-center gap-1.5">
            <FontAwesomeIcon icon={faMapMarkedAlt} />
            <span className="text-gray-700">{placeString}</span>
          </div>
        )}

        {year && (
          <div className="flex items-center gap-1.5">
            <FontAwesomeIcon icon={faCalendar} />
            <span className="text-gray-700">{year.split("-")[0]}</span>
          </div>
        )}

        {recordtype && (
          <div className="flex items-center gap-1.5">
            <FontAwesomeIcon icon={faTag} />
            <span className={`${pill} bg-lighter-isof border-transparent text-darker-isof`}>
              {recordtype}
            </span>
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
