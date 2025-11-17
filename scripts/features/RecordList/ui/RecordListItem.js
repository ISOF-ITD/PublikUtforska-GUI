/* eslint-disable react/require-default-props */
import { Link, useNavigate, useParams } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faFolder,
  faFolderOpen,
  faClosedCaptioning,
} from "@fortawesome/free-solid-svg-icons";
import PropTypes from "prop-types";
import HighlightedText from "./HighlightedText";
import MediaIcons from "./MediaIcons";
import TranscriptionStatus from "./TranscriptionStatus";
import AccessionIdCell from "./AccessionIdCell";
import CollectorList from "./CollectorList";
import ListPlayButton from "../../../features/AudioDescription/ListPlayButton";
import { l } from "../../../lang/Lang";
import config from "../../../config";
import {
  createSearchRoute,
  createParamsFromSearchRoute,
} from "../../../utils/routeHelper";
import { getTitle, getPlaceString, pageFromTo } from "../../../utils/helpers";
import useSubrecords from "../hooks/useSubrecords";
import { secondsToMMSS } from "../../../utils/timeHelper";

export default function RecordListItem(props) {
  const {
    id,
    item,
    searchParams,
    useRouteParams,
    archiveIdClick,
    columns,
    shouldRenderColumn,
    highlightRecordsWithMetadataField,
    mode,
    smallTitle,
  } = props;

  const {
    _source: {
      archive,
      contents,
      id: recordId,
      materialtype,
      media,
      metadata,
      persons,
      places,
      recordtype,
      taxonomy,
      text,
      title,
      transcribedby,
      transcriptionstatus,
      transcriptiontype,
      year,
    },
    highlight,
    inner_hits: innerHits,
  } = item;

  const navigate = useNavigate();
  const params = useParams();
  // Re-use same Tailwind classes in similar many elements
  const pillClasses =
    "inline-flex flex-wrap max-w-full shadow border border-gray-200 rounded py-1 px-1.5 m-1.5 text-xs bg-white";

  /* ---------- sub-records hook ---------- */
  const {
    subrecords,
    visible,
    toggle,
    count,
    countDone,
    mediaCount,
    mediaCountDone,
  } = useSubrecords({
    recordtype,
    id,
    ...item._source,
  });

  /* ---------- flags ---------- */
  const displayTextSummary =
    highlightRecordsWithMetadataField &&
    metadata.some((m) => m.type === highlightRecordsWithMetadataField);

  const summary =
    displayTextSummary && text
      ? text.length > 300
        ? `${text.slice(0, 300)}…`
        : text
      : "";

  /* ----- audio & utterance helpers ----- */
  const audioItem =
    config.siteOptions.recordList?.displayPlayButton &&
    media.find((m) => m.type === "audio");

  // does any audio file contain utterances?
  const hasTranscription = media.some(
    (m) => m.type === "audio" && m.utterances?.utterances?.length > 0
  );

  /* ---------- helper to count beskrivningar ---------- */
  const countDescriptionsInMedia = (mediaArr = []) =>
    mediaArr.reduce(
      (acc, m) =>
        acc + (Array.isArray(m.description) ? m.description.length : 0),
      0
    );

  const descriptionCountSelf = countDescriptionsInMedia(media);

  // descriptions that live in every sub-record’s media (if we have them)
  const descriptionCountSubrecords =
    recordtype === "one_accession_row"
      ? subrecords.reduce(
          (acc, sr) => acc + countDescriptionsInMedia(sr._source.media),
          0
        )
      : 0;

  // grand total for the badge
  const descriptionCount = descriptionCountSelf + descriptionCountSubrecords;

  /* ---------- hrefs ---------- */
  // build a search suffix from the current list params
  const searchSuffix = createSearchRoute(searchParams || {});

  // avoid adding a bare "/" when there are no params
  const recordHref = `${
    mode === "transcribe" ? "/transcribe" : ""
  }/records/${id}${searchSuffix === "/" ? "" : searchSuffix}`;

  /* ---------- render ---------- */
  return (
    <tr
      className={`border-b border-gray-200 last:border-0 even:bg-white odd:bg-gray-100 ${
        displayTextSummary ? "bg-gray-100" : ""
      }`}
    >
      {/* ---------- title (mobile+desktop) ---------- */}
      {shouldRenderColumn("title", columns) && (
        <td
          className={`${
            smallTitle ? "" : "text-base"
          } !px-2 !py-3 space-y-1 flex flex-col`}
        >
          <Link
            to={recordHref}
            target={config.embeddedApp ? "_parent" : "_self"}
            className="item-title text-isof hover:underline"
          >
            {audioItem && (
              <ListPlayButton
                disablePlayback
                media={audioItem}
                recordId={recordId}
                recordTitle={title || l("(Utan titel)")}
              />
            )}
            <MediaIcons media={media} />
            <span
              dangerouslySetInnerHTML={{
                __html: getTitle(
                  title,
                  contents,
                  archive,
                  transcriptionstatus === "readytotranscribe"
                    ? undefined
                    : highlight
                ),
              }}
            />
            {hasTranscription && (
              <span
                className="inline-flex items-center gap-0.5 -!mb-1 px-1.5 text-[10px] font-medium text-lighter-isof"
                title={l("Har avskrift")}
              >
                <FontAwesomeIcon
                  icon={faClosedCaptioning}
                  className="text-[16px] bg-isof rounded-sm"
                  aria-hidden="true"
                />
                <span className="sr-only">{l("Har avskrift")}</span>
              </span>
            )}
          </Link>

          {summary && (
            <div className="item-summary text-sm text-gray-600 mt-2">
              {summary}
            </div>
          )}

          {/* Show hits for double nested hits with highlight for descriptions */}
          {innerHits?.["media.description"]?.hits?.hits.map((descHit) => {
            const highlighted =
              descHit.highlight?.["media.description.text"]?.[0] ??
              descHit._source?.text ??
              "";

            if (!highlighted) return null;

            return (
              <div className="flex flex-col mt-2" key={descHit._id}>
                <span className="mr-1">Innehållsbeskrivning:</span>
                <HighlightedText
                  text={highlighted}
                  className="inline"
                  maxSnippets={1}
                  maxWords={15}
                />
              </div>
            );
          })}
          {innerHits?.["media.utterances.utterances"]?.hits?.hits.map(
            (descHit) => {
              const highlighted =
                descHit.highlight?.["media.utterances.utterances.text"]?.[0] ??
                descHit._source?.text ??
                "";

              if (!highlighted) return null;

              const startLabel =
                descHit._source?.start !== undefined
                  ? ` (${secondsToMMSS(descHit._source.start)})`
                  : "";

              return (
                <div className="flex flex-col mt-2" key={descHit._id}>
                  <span className="mr-1">Ljudavskrift{startLabel}:</span>
                  <HighlightedText
                    text={highlighted}
                    className="inline"
                    maxSnippets={1}
                    maxWords={15}
                  />
                </div>
              );
            }
          )}
          {highlight?.text?.[0] && (
            <div className="flex flex-col mt-2">
              <span className="mr-1">Transkribering:</span>
              <HighlightedText
                text={highlight.text[0]} // only the ES highlight HTML
                className="inline"
                maxSnippets={1}
                maxWords={15}
              />
            </div>
          )}

          {highlight?.headwords?.[0] && (
            <div className="flex flex-col mt-2">
              <span className="mr-1">
                Uppgifter från äldre innehållsregister:
              </span>
              <HighlightedText
                text={highlight.headwords[0]}
                maxSnippets={1}
                maxWords={15}
                className="inline"
              />
            </div>
          )}
          {innerHits?.media?.hits?.hits.map((hit) => {
            const highlighted = hit.highlight?.["media.text"]?.[0];
            if (!highlighted) return null;

            return (
              <div className="flex flex-col mt-2" key={hit._id}>
                <span className="mr-1">Transkribering:</span>
                <HighlightedText
                  text={highlighted}
                  className="inline"
                  maxSnippets={1}
                  maxWords={15}
                />
              </div>
            );
          })}
          {/* sub-records accordion */}
          {recordtype === "one_accession_row" && count !== 0 && visible && (
            <div className="subrecords mt-1">
              <small>
                <a
                  onClick={toggle}
                  className="text-isof hover:underline cursor-pointer"
                >
                  <FontAwesomeIcon
                    icon={visible ? faFolderOpen : faFolder}
                    className="mr-1"
                  />
                  {!visible && " Visa "}
                  {transcriptiontype === "audio"
                    ? "Inspelningar"
                    : "Uppteckningar"}
                  {visible && " i den här accessionen"} ({count})
                  {visible && ":"}
                </a>
              </small>

              {visible && (
                <ul className="ml-2 mt-1 list-disc text-sm">
                  {subrecords
                    .sort((a, b) => {
                      const pa = Number(a?._source?.archive?.page);
                      const pb = Number(b?._source?.archive?.page);
                      return (
                        (isFinite(pa) ? pa : Infinity) -
                        (isFinite(pb) ? pb : Infinity)
                      );
                    })
                    .map((s) => {
                      const pub = s._source.transcriptionstatus === "published";
                      return (
                        <li key={s._source.id} className="mb-1">
                          <small>
                            <Link
                              to={`${
                                mode === "transcribe" ? "/transcribe" : ""
                              }/records/${s._source.id}`}
                              className={`${
                                pub ? "font-bold" : ""
                              } hover:underline text-isof`}
                            >
                              {transcriptiontype !== "audio" && (
                                <>Sida {pageFromTo(s)}: </>
                              )}
                              <span
                                dangerouslySetInnerHTML={{
                                  __html: `${getTitle(
                                    s._source.title,
                                    s._source.contents,
                                    s._source.archive
                                  )}${
                                    !pub
                                      ? transcriptiontype === "audio"
                                        ? " (kan bidra)"
                                        : " (ej avskriven)"
                                      : ""
                                  }`,
                                }}
                              />
                            </Link>
                          </small>
                        </li>
                      );
                    })}
                </ul>
              )}
            </div>
          )}
        </td>
      )}

      {/* ---------- other columns ---------- */}
      {shouldRenderColumn("archive_id", columns) &&
        !config.siteOptions.recordList?.hideAccessionpage && (
          <AccessionIdCell
            archive={archive}
            recordtype={recordtype}
            pillClasses={pillClasses}
            searchParams={searchParams}
            archiveIdClick={archiveIdClick}
          />
        )}

      {shouldRenderColumn("place", columns) && (
        <td data-title={`${l("Ort")}:`} className="py-2">
          {places?.length > 0 && (
            <div className={pillClasses}>
              {places[0].specification && (
                <span className="mr-1">{places[0].specification} i</span>
              )}
              <Link
                to={`${mode === "transcribe" ? "/transcribe" : ""}/places/${
                  places[0].id
                }${createSearchRoute({
                  category: searchParams.category,
                  search: searchParams.search,
                  search_field: searchParams.search_field,
                })}`}
                className="text-isof hover:underline"
                onClick={(e) => {
                  e.preventDefault();
                  navigate(`/places/${places[0].id}`);
                }}
              >
                {getPlaceString(places)}
              </Link>
            </div>
          )}
        </td>
      )}

      {shouldRenderColumn("collector", columns) && (
        <td data-title={`${l("Insamlare")}:`} className="py-2">
          <CollectorList
            persons={persons}
            mode={mode}
            searchParams={searchParams}
            pillClasses={pillClasses}
          />
        </td>
      )}

      {shouldRenderColumn("year", columns) && (
        <td data-title={`${l("År")}:`} className="py-2">
          {(() => {
            const displayYear =
              typeof year === "string"
                ? year.split("-")[0]
                : typeof year === "number"
                ? String(year)
                : null;
            return displayYear ? (
              <span className={`${pillClasses} bg-white`}>{displayYear}</span>
            ) : null;
          })()}
        </td>
      )}

      {shouldRenderColumn("material_type", columns) &&
        !config.siteOptions.recordList?.hideMaterialType && (
          <td data-title={`${l("Materialtyp")}:`} className="py-2">
            {materialtype}
          </td>
        )}

      {shouldRenderColumn("transcription_status", columns) && (
        <td data-title={`${l("Avskriven")}:`} className="py-2">
          <TranscriptionStatus
            status={transcriptionstatus}
            type={recordtype === "one_accession_row" ? "accession" : "record"}
            total={
              transcriptiontype === "audio" || descriptionCount > 0
                ? descriptionCount
                : transcriptiontype === "sida"
                ? mediaCount
                : count
            }
            done={
              transcriptiontype === "audio" || descriptionCount > 0
                ? descriptionCount
                : transcriptiontype === "sida"
                ? mediaCountDone
                : countDone
            }
            transcriptiontype={
              transcriptiontype === "audio" || descriptionCount > 0
                ? "audio"
                : transcriptiontype
            }
            pillClasses={pillClasses}
          />
        </td>
      )}

      {columns?.includes("transcribedby") && (
        <td data-title={`${l("Transkriberad av")}:`} className="py-2">
          {transcribedby && <span className="text-sm">{transcribedby}</span>}
        </td>
      )}
    </tr>
  );
}

RecordListItem.propTypes = {
  id: PropTypes.string.isRequired,
  item: PropTypes.object.isRequired,
  searchParams: PropTypes.object.isRequired,
  archiveIdClick: PropTypes.func.isRequired,
  columns: PropTypes.array,
  shouldRenderColumn: PropTypes.func.isRequired,
  highlightRecordsWithMetadataField: PropTypes.string,
  mode: PropTypes.string,
  useRouteParams: PropTypes.bool,
  smallTitle: PropTypes.bool,
};
