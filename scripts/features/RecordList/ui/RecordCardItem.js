import { Link } from "react-router-dom";
import { useMemo } from "react";
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
import config from "../../../config";
import TranscribeButton from "../../TranscriptionPageByPageOverlay/ui/TranscribeButton";
import TranscriptionStatus from "./TranscriptionStatus";
import useSubrecords from "../hooks/useSubrecords";
import MediaIcons from "./MediaIcons";
import HighlightedText from "./HighlightedText";
import PropTypes from "prop-types";
import { secondsToMMSS } from "../../../utils/timeHelper";
import { createSearchRoute } from "../../../utils/routeHelper";

const pill =
  "inline-flex items-center border rounded-full px-3 py-1 text-xs font-medium";

export const RecordCardItem = ({
  item,
  searchParams,
  mode = "material",
  highlightRecordsWithMetadataField,
}) => {
  const src = item?._source ?? {};

  const {
    archive = {},
    media = [],
    metadata = [],
    places = [],
    persons = [],
    transcriptiontype,
    transcriptionstatus,
    title,
    recordtype,
    contents,
    year,
    id,
  } = src;

  const highlight = item?.highlight ?? {};
  const inner_hits = item?.inner_hits ?? {};
  const itemText = item?.text;

  /* ───────────────── sub-records (needed for the counters) ─────────────── */
  const {
    count = 0,
    countDone = 0,
    subrecords = [],
    mediaCount = 0,
    mediaCountDone = 0,
  } = useSubrecords({
    // network request ≈ table row
    recordtype,
    id,
    ...src,
  });

  // helpers
  const displayTitle = useMemo(
    () => getTitle(title, contents, archive, highlight),
    [title, contents, archive, highlight]
  );
  const archiveId = useMemo(
    () =>
      makeArchiveIdHumanReadable(archive?.archive_id, archive?.archive_org) ||
      "",
    [archive?.archive_id, archive?.archive_org]
  );
  const placeString = useMemo(() => getPlaceString(places || []), [places]);

  // build a search suffix from the current list params
  const searchSuffix = createSearchRoute(searchParams || {});

  // avoid adding a bare "/" when there are no params
  const recordUrl = `${
    mode === "transcribe" ? "/transcribe" : ""
  }/records/${id}${searchSuffix === "/" ? "" : searchSuffix}`;

  const hasTranscription = useMemo(
    () =>
      !!media?.some?.(
        (m) => m?.type === "audio" && m?.utterances?.utterances?.length > 0
      ),
    [media]
  );

  const toText = (v) => {
    const s = v == null ? "" : String(v);
    return s.trim();
  };

  // inner hits -> show up to 3; memoize to avoid work each render
  const innerHitsToShow = useMemo(() => {
    const descriptionHits = inner_hits?.["media.description"]?.hits?.hits ?? [];
    const utteranceHits =
      inner_hits?.["media.utterances.utterances"]?.hits?.hits ?? [];

    const rows = [
      ...descriptionHits.map((h, i) => {
        const pre = h?._source?.start != null ? `${h._source.start} ` : "";
        const hi = h?.highlight?.["media.description.text"]?.[0];
        const body = toText(hi ?? h?._source?.text);
        const text = body ? `Innehållsbeskrivning: ${pre}${body}` : "";
        return { key: `${h?._index || "desc"}:${h?._id || i}`, text };
      }),
      ...utteranceHits.map((h, i) => {
        const pre =
          h?._source?.start != null ? `${secondsToMMSS(h._source.start)} ` : "";
        const hi = h?.highlight?.["media.utterances.utterances.text"]?.[0];
        const body = toText(hi ?? h?._source?.text);
        const text = body ? `Ljudavskrift: ${pre}${body}` : "";
        return { key: `${h?._index || "utt"}:${h?._id || i}`, text };
      }),
    ]
      .filter((x) => x.text)
      .slice(0, 3);

    return rows;
  }, [inner_hits]);

  // ───────── highlight / summary
  const displayTextSummary =
    !!highlightRecordsWithMetadataField &&
    metadata?.some?.((m) => m?.type === highlightRecordsWithMetadataField);

  const summary =
    !!highlightRecordsWithMetadataField &&
    metadata?.some?.((m) => m?.type === highlightRecordsWithMetadataField) &&
    itemText
      ? itemText.length > 250
        ? `${itemText.slice(0, 250)}…`
        : itemText
      : null;

  // Collector filtering
  const collectorPersons =
    persons?.filter?.((p) =>
      ["c", "collector", "interviewer", "recorder"].includes(p?.relation)
    ) ?? [];

  // helpers
  const countDescriptionsInMedia = (arr = []) =>
    arr.reduce(
      (acc, m) =>
        acc + (Array.isArray(m?.description) ? m.description.length : 0),
      0
    );

  const descriptionCountSelf = countDescriptionsInMedia(media);
  const descriptionCountSubrecords =
    recordtype === "one_accession_row"
      ? subrecords.reduce(
          (acc, sr) => acc + countDescriptionsInMedia(sr?._source?.media),
          0
        )
      : 0;

  const descriptionCount = descriptionCountSelf + descriptionCountSubrecords;

  const isAccession =
    recordtype === "one_accession_row" && transcriptiontype !== "audio";

  const total =
    transcriptiontype === "audio" || descriptionCount > 0
      ? descriptionCount
      : transcriptiontype === "sida"
      ? mediaCount
      : count;

  const done =
    transcriptiontype === "audio" || descriptionCount > 0
      ? descriptionCount
      : transcriptiontype === "sida"
      ? mediaCountDone
      : countDone;

  // normalize year to a displayable string safely
  const displayYear =
    typeof year === "string"
      ? year.split("-")[0]
      : typeof year === "number"
      ? String(year)
      : null;

  return (
    <article className="group relative rounded-lg !border !border-gray-200 bg-white p-4 shadow transition-all hover:shadow-md">
      {/* Header Section */}
      <header className="flex items-center gap-2">
        <MediaIcons media={media || []} />
        <span className="flex-1 text-lg font-semibold leading-tight !text-isof">
          {recordUrl ? (
            <Link
              to={recordUrl}
              className="!text-isof focus:outline-none focus:ring-2 focus:ring-isof"
            >
              <span
                // ensure string
                dangerouslySetInnerHTML={{ __html: String(displayTitle || "") }}
              />
              {hasTranscription && (
                <span
                  className="inline-flex items-center gap-0.5 mb-0.5 px-1.5 text-[10px] font-medium text-lighter-isof"
                  title={l("Har avskrift")}
                  aria-label={l("Har avskrift")}
                >
                  <FontAwesomeIcon
                    icon={faClosedCaptioning}
                    className="text-[16px] bg-isof rounded-sm"
                  />
                  <span className="sr-only">{l("Har avskrift")}</span>
                </span>
              )}
              <span className="ml-2 inline-block text-gray-400 transition-all group-hover:translate-x-1">
                <FontAwesomeIcon icon={faChevronRight} aria-hidden="true" />
              </span>
            </Link>
          ) : (
            <span
              className="!text-isof opacity-70 cursor-not-allowed"
              aria-disabled="true"
            >
              <span
                dangerouslySetInnerHTML={{ __html: String(displayTitle || "") }}
              />
            </span>
          )}
        </span>
      </header>

      {/* Metadata Grid */}
      <div className="mt-3 flex flex-col gap-y-2 text-sm">
        {(archiveId || archive?.page) && (
          <div className="flex items-center gap-1.5">
            <FontAwesomeIcon icon={faArchive} className="flex-shrink-0" />
            {archiveId && (
              <span className="font-medium text-isof">
                <b>Arkivnummer:</b> {archiveId}
              </span>
            )}
            {archive?.page &&
              (() => {
                try {
                  const val =
                    typeof pageFromTo === "function"
                      ? pageFromTo({ _source: { archive } })
                      : archive.page;

                  return val ? (
                    <span className="text-gray-500">:{val}</span>
                  ) : null;
                } catch (e) {
                  return null;
                }
              })()}
          </div>
        )}

        {placeString && (
          <div className="flex items-center">
            <span className="text-gray-700">
              <b>Ort:</b> {placeString}
            </span>
          </div>
        )}

        {displayYear && (
          <div className="flex items-center">
            <span className="text-gray-700">
              <b>År:</b> {displayYear}
            </span>
          </div>
        )}

        {config?.siteOptions?.recordList?.visibleCollecorPersons &&
          collectorPersons.length > 0 && (
            <div className="flex items-center">
              <div className="flex flex-wrap gap-1 items-center">
                <b>Insamlare:</b>
                {collectorPersons.map((p, idx) => {
                  const pid = (p?.id != null ? String(p.id) : "").toLowerCase();
                  if (!pid) return null;
                  return (
                    <Link
                      key={p?.id ?? `${pid}-${idx}`}
                      to={`${
                        mode === "transcribe" ? "/transcribe" : ""
                      }/persons/${pid}`}
                      className="text-isof hover:underline text-xs"
                    >
                      {l(p?.name || "")}
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
      </div>

      {/* Summary first (if any) */}
      {summary && (
        <span className="mt-2 text-sm text-gray-600 line-clamp-4">
          {summary}
        </span>
      )}

      {innerHitsToShow?.["media.description"]?.hits?.hits.map((descHit) => {
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
          {innerHitsToShow?.["media.utterances.utterances"]?.hits?.hits.map(
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
          {innerHitsToShow?.media?.hits?.hits.map((hit) => {
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
        pillClasses={`${pill} mr-auto block`}
      />

      {/* Transcription CTA */}
      {transcriptionstatus === "readytotranscribe" &&
        (media?.length ?? 0) > 0 && (
          <div className="mt-4 border-t border-gray-100 pt-3">
            <TranscribeButton
              className="w-full justify-center bg-isof hover:bg-darker-isof !text-white font-medium rounded-lg transition-colors"
              label={
                <>
                  <FontAwesomeIcon icon={faPencil} /> {l("Skriv av")}
                </>
              }
              title={title}
              recordId={id}
              archiveId={archive?.archive_id}
              places={places}
              images={media || []}
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
