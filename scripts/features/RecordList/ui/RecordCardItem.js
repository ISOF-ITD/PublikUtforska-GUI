import { Link } from "react-router-dom";
import { l } from "../../../lang/Lang";
import {
  getTitle,
  makeArchiveIdHumanReadable,
  getPlaceString,
  pageFromTo,
} from "../../../utils/helpers";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArchive,
  faChevronRight,
  faPencil,
  faClosedCaptioning,
} from "@fortawesome/free-solid-svg-icons";
import PdfGif from "../../../../img/pdf.gif";
import config from "../../../config";
import TranscribeButton from "../../../components/views/transcribe/TranscribeButton";
import TranscriptionStatus from "./TranscriptionStatus";
import useSubrecords from "../hooks/useSubrecords";
import MediaIcons from "./MediaIcons";
import HighlightedText from "./HighlightedText";
import PropTypes from "prop-types";
import { secondsToMMSS } from "../../../utils/timeHelper";

const pill =
  "inline-flex items-center border rounded-full px-3 py-1 text-xs font-medium";

export const RecordCardItem = ({
  item,
  searchParams,
  mode = "material",
  highlightRecordsWithMetadataField,
}) => {
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
      recordtype,
      contents,
      year,
      id,
    },
    highlight,
  } = item;

  /* ───────────────── sub-records (needed for the counters) ─────────────── */
  const {
    count, // number of child records
    countDone,
    subrecords,
    mediaCount, // number of page images (for scanned pages)
    mediaCountDone,
  } = useSubrecords({
    // network request ≈ table row
    recordtype,
    id,
    ...item._source,
  });

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
  const hasTranscription = media.some(
    (m) => m.type === "audio" && m.utterances?.utterances?.length > 0
  );

  /* ─────── inner-hits (description + utterances) ─────── */
  const descriptionHits =
    item.inner_hits?.["media.description"]?.hits?.hits ?? [];

  const utteranceHits =
    item.inner_hits?.["media.utterances.utterances"]?.hits?.hits ?? [];

  const innerHitsToShow = [
    ...descriptionHits.map((h) => ({
      key: h._id,
      text: `Innehållsbeskrivning: ${
        h._source?.start !== undefined ? `${h._source.start} ` : ""
      }${
        h.highlight?.["media.description.text"]
          ? h.highlight["media.description.text"][0]
          : h._source?.text || ""
      }`,
    })),
    ...utteranceHits.map((h) => ({
      key: h._id,
      text: `Ljudavskrift: ${
        h._source?.start !== undefined
          ? `${secondsToMMSS(h._source.start)} `
          : ""
      }${
        h.highlight?.["media.utterances.utterances.text"]
          ? h.highlight["media.utterances.utterances.text"][0]
          : h._source?.text || ""
      }`,
    })),
  ].slice(0, 3); // max three snippets

  /* ───────── highlight / summary ──────── */
  const displayTextSummary =
    highlightRecordsWithMetadataField &&
    metadata?.some((m) => m.type === highlightRecordsWithMetadataField);

  const summary =
    displayTextSummary && item.text
      ? item.text.length > 250
        ? `${item.text.slice(0, 250)}…`
        : item.text
      : null;
  const showSummary =
    metadata?.some((m) => m.type === "summary") &&
    !!item.text &&
    item.text.length > 0;

  // Collector filtering
  const collectorPersons = persons?.filter((p) =>
    ["c", "collector", "interviewer", "recorder"].includes(p.relation)
  );

  /* helper */
  const countDescriptionsInMedia = (arr = []) =>
    arr.reduce(
      (acc, m) =>
        acc + (Array.isArray(m.description) ? m.description.length : 0),
      0
    );

  // descriptions that belong to the parent record itself
  const descriptionCountSelf = countDescriptionsInMedia(media);

  // …and those that live in every sub-record’s media (only for accessions)
  const descriptionCountSubrecords =
    recordtype === "one_accession_row"
      ? subrecords.reduce(
          (acc, sr) => acc + countDescriptionsInMedia(sr._source.media),
          0
        )
      : 0;

  const descriptionCount = descriptionCountSelf + descriptionCountSubrecords;

  const isAccession =
    recordtype === "one_accession_row" && transcriptiontype !== "audio";

  const total =
    transcriptiontype === "audio" || descriptionCount > 0
      ? descriptionCount // audio ➜ # descriptions
      : transcriptiontype === "sida"
      ? mediaCount // scanned pages ➜ # page images
      : count; // born-digital text ➜ # child records

  const done =
    transcriptiontype === "audio" || descriptionCount > 0
      ? descriptionCount
      : transcriptiontype === "sida"
      ? mediaCountDone
      : countDone;

  return (
    <article className="group relative rounded-lg border border-gray-100 bg-white p-4 shadow-sm transition-all hover:shadow-md">
      {/* Header Section */}
      <header className="flex items-center gap-2">
        <MediaIcons media={media} />
        <span className="flex-1 text-lg font-semibold leading-tight !text-isof">
          <Link
            to={recordUrl}
            className="!text-isof focus:outline-none focus:ring-2 focus:ring-isof"
          >
            <span dangerouslySetInnerHTML={{ __html: displayTitle }} />
            {hasTranscription && (
              <span
                className="inline-flex items-center gap-0.5 -!mb-0.5 px-1.5 text-[10px] font-medium text-lighter-isof"
                title={l("Har avskrift")}
              >
                <FontAwesomeIcon
                  icon={faClosedCaptioning}
                  className="text-[16px] bg-isof rounded-sm"
                />
                <span className="sr-only">{l("Har avskrift")}</span>
              </span>
            )}
            <span className="ml-2 inline-block text-gray-400 transition-all group-hover:translate-x-1">
              <FontAwesomeIcon icon={faChevronRight} />
            </span>
          </Link>
        </span>
      </header>

      {/* Metadata Grid */}
      <div className="mt-3 flex flex-col gap-y-2 text-sm">
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

      {/* Summary first (if any) */}
      {summary && (
        <p className="mt-2 text-sm text-gray-600 line-clamp-4">{summary}</p>
      )}

      {/* New: inner-hits for descriptions + utterances */}
      {innerHitsToShow.map(({ key, text }) => (
        <HighlightedText key={key} text={text} className="block mt-2 text-sm" />
      ))}

      {/* Fallback: ordinary ES text hit */}
      {!summary && innerHitsToShow.length === 0 && highlight?.text?.[0] && (
        <HighlightedText text={highlight.text[0]} className="block mt-2" />
      )}

      <TranscriptionStatus
        status={transcriptionstatus}
        type={recordtype === "one_accession_row" ? "accession" : "record"}
        transcriptiontype={
          transcriptiontype === "audio" || descriptionCount > 0
            ? "audio"
            : transcriptiontype
        }
        done={done}
        total={total}
        pillClasses={`${pill} mr-auto`}
      />

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

RecordCardItem.propTypes = {
  item: PropTypes.object.isRequired,
  searchParams: PropTypes.object,
  mode: PropTypes.string,
  highlightRecordsWithMetadataField: PropTypes.string,
};
