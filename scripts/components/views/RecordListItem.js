/* eslint-disable react/require-default-props */
import { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faFolder,
  faFolderOpen,
  faFileLines,
  faVolumeHigh,
} from "@fortawesome/free-solid-svg-icons";
import { useNavigate, useParams, Link } from "react-router-dom";
import PropTypes from "prop-types";
import ListPlayButton from "../../features/AudioDescription/ListPlayButton";
import TranscribeButton from "./transcribe/TranscribeButton";
import HighlightedText from "../HighlightedText";

import config from "../../config";
import { l } from "../../lang/Lang";

import {
  createSearchRoute,
  createParamsFromSearchRoute,
} from "../../utils/routeHelper";
import {
  pageFromTo,
  getTitle,
  makeArchiveIdHumanReadable,
  getPlaceString,
  fetchRecordMediaCount,
} from "../../utils/helpers";

import RecordsCollection from "../collections/RecordsCollection";

import PdfGif from "../../../img/pdf.gif";

export default function RecordListItem({
  id,
  item: {
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
      numberofpages,
      numberofonerecord,
      numberoftranscribedonerecord,
      numberoftranscribedpages,
    },
    highlight,
    inner_hits: innerHits,
  },
  searchParams,
  useRouteParams = false,
  archiveIdClick,
  columns = null,
  shouldRenderColumn,
  highlightRecordsWithMetadataField = null,
  mode = "material",
  smallTitle = false,
}) {
  /* ---------- state & data loading ---------- */

  const [subrecords, setSubrecords] = useState([]);
  const [fetchedSubrecords, setFetchedSubrecords] = useState(false);
  const [visibleSubrecords, setVisibleSubrecords] = useState(false);
  const [numberOfSubrecords, setNumberOfSubrecords] = useState(0);
  const [numberOfTranscribedSubrecords, setNumberOfTranscribedSubrecords] =
    useState(0);
  const [numberOfSubrecordsMedia, setNumberOfSubrecordsMedia] = useState(0);
  const [
    numberOfTranscribedSubrecordsMedia,
    setNumberOfTranscribedSubrecordsMedia,
  ] = useState(0);

  const navigate = useNavigate();
  const params = useParams();

  const fetchRecordCount = async (functionScopeParams, setValue) => {
    try {
      const queryParams = { ...config.requiredParams, ...functionScopeParams };
      const queryParamsString = Object.entries(queryParams)
        .map(([key, value]) => `${key}=${value}`)
        .join("&");
      const response = await fetch(
        `${config.apiUrl}count?${queryParamsString}`
      );
      if (response.ok) {
        const json = await response.json();
        setValue(json.data.value);
      } else {
        throw new Error("Fel vid hämtning av antal uppteckningar");
      }
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    if (recordtype === "one_accession_row") {
      const oneRecordParams = { search: id, recordtype: "one_record" };
      const transcribedOneRecordParams = {
        search: id,
        recordtype: "one_record",
        transcriptionstatus: "published,transcribed",
      };
      const oneRecordPagesParams = { search: id };
      const transcribedOneRecordPagesParams = {
        search: id,
        transcriptionstatus: "published,transcribed",
      };

      if (transcriptiontype === "sida") {
        if (Number.isInteger(numberofpages)) {
          setNumberOfSubrecordsMedia(numberofpages);
          setNumberOfTranscribedSubrecordsMedia(numberoftranscribedpages);
        } else {
          fetchRecordMediaCount(
            oneRecordPagesParams,
            setNumberOfSubrecordsMedia,
            setNumberOfTranscribedSubrecordsMedia
          );
        }
      }

      if (Number.isInteger(numberofonerecord)) {
        setNumberOfSubrecords(numberofonerecord);
        setNumberOfTranscribedSubrecords(numberoftranscribedonerecord);
      } else {
        fetchRecordCount(oneRecordParams, setNumberOfSubrecords);
        fetchRecordCount(
          transcribedOneRecordParams,
          setNumberOfTranscribedSubrecords
        );
      }
    }
  }, []);

  const collections = new RecordsCollection((json) => {
    setSubrecords(json.data);
  });

  const fetchData = () => {
    setFetchedSubrecords(true);
    const fetchParams = { search: id, recordtype: "one_record" };
    collections.fetch(fetchParams);
  };

  const toggleSubrecords = () => {
    setVisibleSubrecords(!visibleSubrecords);
    if (!fetchedSubrecords) fetchData();
  };

  /* ---------- render‑helpers ---------- */

  const pillClasses  = "inline-flex flex-wrap max-w-full !bg-white shadow !border !border-gray-200 rounded py-1 px-1.5 m-1.5 text-xs";
  
  const renderFieldArchiveId = () => {
    const base = (
      <span className="py-2 whitespace-nowrap md:whitespace-normal">
        {makeArchiveIdHumanReadable(archive.archive_id, archive.archive_org)}
        {archive.page &&
          `:${
            recordtype === "one_record"
              ? pageFromTo({ _source: { archive } })
              : archive.page
          }`}
      </span>
    );

    // one_accession_row
    if (recordtype === "one_accession_row") {
      return (
        <td
          data-title={`${l("Arkivnummer")}:`}
          className="py-2 whitespace-nowrap md:whitespace-normal"
        >
          <span className={`${pillClasses}`}>{base}</span>
        </td>
      );
    }

    // one_record
    if (recordtype === "one_record") {
      return (
        <td
          data-title={`${l("Arkivnummer")}:`}
          className="py-2 whitespace-nowrap md:whitespace-normal"
        >
          <a
            data-archiveidrow={archive.archive_id_row}
            data-search={searchParams.search ?? ""}
            data-recordtype={searchParams.recordtype}
            onClick={archiveIdClick}
            title={`Gå till accessionen ${archive.archive_id_row}`}
            className={`${pillClasses} text-isof underline hover:bg-gray-100 cursor-pointer`}
          >
            {base}
          </a>
        </td>
      );
    }

    // default
    return (
      <td data-title={`${l("Arkivnummer")}:`} className="py-2">
        <a
          data-archiveid={archive.archive_id}
          data-recordtype={
            searchParams.recordtype === "one_accession_row"
              ? "one_record"
              : "one_accession_row"
          }
          onClick={archiveIdClick}
          title={`Gå till ${
            searchParams.recordtype === "one_accession_row"
              ? "uppteckningarna"
              : "accessionerna"
          }`}
          className={`${pillClasses} underline text-isof hover:bg-gray-100 cursor-pointer`}
        >
          <span className={`${pillClasses}`}>{base}</span>
        </a>
      </td>
    );
  };

  const audioItem =
    config.siteOptions.recordList?.displayPlayButton &&
    media.find((m) => m.type === "audio");

  /* ---------- highlighted summary ---------- */

  const displayTextSummary =
    highlightRecordsWithMetadataField &&
    metadata.some((m) => m.type === highlightRecordsWithMetadataField);

  const textSummary =
    displayTextSummary && text
      ? text.length > 300
        ? `${text.slice(0, 300)}…`
        : text
      : "";

  /* ---------- taxonomy / collector ---------- */

  let taxonomyElement = null;
  if (taxonomy && config.siteOptions.recordList?.visibleCategories) {
    const { visibleCategories } = config.siteOptions.recordList;
    const list = Array.isArray(taxonomy) ? taxonomy : [taxonomy];
    taxonomyElement = list
      .filter((t) => visibleCategories.includes(t.type.toLowerCase()))
      .map((t, i) => (
        <span key={`${id}-cat-${i}`} className="category">
          {l(t.name)}
        </span>
      ));
  }

  let collectorPersonElement = null;
  if (persons && config?.siteOptions?.recordList?.visibleCollecorPersons) {
    collectorPersonElement = persons
      .filter((p) =>
        ["c", "collector", "interviewer", "recorder"].includes(p.relation)
      )
      .map((p) => (
        <Link
          to={`${
            mode === "transcribe" ? "/transcribe" : ""
          }/persons/${p.id.toLowerCase()}${createSearchRoute({
            search: searchParams.search,
            search_field: searchParams.search_field,
          })}`}
          key={`${id}-${p.id}`}
          className={`${pillClasses} text-isof hover:underline`}
        >
          {l(p.name)}
        </Link>
      ));
  }

  /* ---------- transcription status ---------- */

  const transcriptionStatuses = {
    untranscribed: "",
    nottranscribable: "",
    readytotranscribe: "Nej",
    undertranscription: "Skrivs av",
    transcribed: "Granskas",
    reviewing: "Granskas",
    needsimprovement: "Granskas",
    approved: "Granskas",
    published: "Avskriven",
  };

  let transcriptionStatusElement = (
    <span className="transcriptionstatus empty" />
  );

  // record‑level
  if (transcriptionstatus && transcriptionstatus !== "accession") {
    transcriptionStatusElement = (
      <span className={`${transcriptionstatus} ${pillClasses}`}>
        {transcriptionStatuses[transcriptionstatus]}
      </span>
    );
  }

  // accession progress bars
  if (transcriptionstatus === "accession") {
    const progressData =
      transcriptiontype === "sida"
        ? [numberOfSubrecordsMedia, numberOfTranscribedSubrecordsMedia]
        : [numberOfSubrecords, numberOfTranscribedSubrecords];

    const [totalPages, donePages] = progressData;
    if (totalPages) {
      const percent = Math.round((donePages / totalPages) * 100);
      transcriptionStatusElement = (
        <div className="mr-2 space-y-1">
          <span className="text-sm">{`${donePages} av ${totalPages} ${
            transcriptiontype === "sida" ? "sidor" : ""
          }`}</span>
          <div
            className="h-2 w-full max-w-[200px] border border-isof rounded"
            title={`${percent}%`}
          >
            <span
              className="block h-full bg-isof rounded"
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>
      );
    }
  }

  /* ---------- title ---------- */

  const titleText =
    transcriptionstatus === "readytotranscribe"
      ? title
        ? getTitle(title, contents, archive)
        : ""
      : getTitle(title, contents, archive, highlight);

  const recordHref = `${
    mode === "transcribe" ? "/transcribe" : ""
  }/records/${id}${createSearchRoute(
    useRouteParams
      ? createParamsFromSearchRoute(params["*"])
      : {
          category: searchParams.category,
          search: searchParams.search,
          search_field: searchParams.search_field,
        }
  )}`;

  /* ---------- render ---------- */

  return (
    <tr
      className={`border-b border-gray-200 last:border-0 even:bg-white odd:bg-gray-50 ${
        displayTextSummary ? "bg-gray-100" : ""
      }`}
    >
      {shouldRenderColumn("title", columns) && (
        <td className={`${smallTitle ? "" : "text-base"} py-2 space-y-1`}>
          <Link
            to={recordHref}
            target={config.embeddedApp ? "_parent" : "_self"}
            className="item-title text-isof hover:underline"
          >
            {/* media icons */}
            {audioItem && config.siteOptions.recordList?.displayPlayButton && (
              <ListPlayButton
                disablePlayback
                media={audioItem}
                recordId={recordId}
                recordTitle={title || l("(Utan titel)")}
              />
            )}
            {media?.some((m) => m.source?.toLowerCase().includes(".pdf")) && (
              <sub>
                <img
                  src={PdfGif}
                  alt="pdf"
                  title="Accession"
                  className="mr-1 inline"
                />
              </sub>
            )}
            {media?.some((m) => m.source?.toLowerCase().includes(".jpg")) && (
              <FontAwesomeIcon
                icon={faFileLines}
                className="mr-1 text-isof"
                title="Uppteckning"
              />
            )}
            {media?.some((m) => m.source?.toLowerCase().includes(".mp3")) && (
              <FontAwesomeIcon
                icon={faVolumeHigh}
                className="mr-1 text-isof"
                title="Inspelning"
              />
            )}
            <span
              dangerouslySetInnerHTML={{
                __html: titleText && titleText !== "[]" ? titleText : "",
              }}
            />
          </Link>

          {displayTextSummary && (
            <div className="item-summary text-sm text-gray-600 mt-2">
              {textSummary}
            </div>
          )}

          {highlight?.text?.[0] && (
            <HighlightedText text={highlight.text[0]} className="block mt-2" />
          )}

          {/* inner hits for type="sida" */}
          {innerHits?.media?.hits?.hits.map(
            (hit) =>
              hit.highlight["media.text"] && (
                <HighlightedText
                  key={`${hit.highlight["media.text"][0]}-${hit._id}`}
                  text={hit.highlight["media.text"][0]}
                  className="block mt-2"
                />
              )
          )}

          {/* subrecords */}
          {recordtype === "one_accession_row" && numberOfSubrecords !== 0 && (
            <div className="subrecords mt-1">
              <small>
                <a
                  onClick={toggleSubrecords}
                  className="text-isof underline cursor-pointer !ml-1"
                >
                  <FontAwesomeIcon
                    icon={visibleSubrecords ? faFolderOpen : faFolder}
                  />
                  {!visibleSubrecords && " Visa "}
                  {transcriptiontype === "audio"
                    ? "Inspelningar"
                    : "Uppteckningar"}
                  {visibleSubrecords && " i den här accessionen"}(
                  {numberOfSubrecords}){visibleSubrecords && ":"}
                </a>
              </small>

              {visibleSubrecords && (
                <ul className="ml-2 mt-1 list-disc text-sm">
                  {subrecords
                    .sort((a, b) =>
                      parseInt(a._source.archive.page, 10) >
                      parseInt(b._source.archive.page, 10)
                        ? 1
                        : -1
                    )
                    .map((subItem) => {
                      const published =
                        subItem._source.transcriptionstatus === "published";
                      return (
                        <li
                          key={`subitem${subItem._source.id}`}
                          className="mb-1"
                        >
                          <small>
                            <Link
                              className={`${
                                published ? "font-bold" : ""
                              } hover:underline`}
                              to={`${
                                mode === "transcribe" ? "/transcribe" : ""
                              }/records/${
                                subItem._source.id
                              }${createSearchRoute({
                                search: searchParams.search,
                                search_field: searchParams.search_field,
                              })}`}
                            >
                              {transcriptiontype !== "audio" && (
                                <>Sida {pageFromTo(subItem)}: </>
                              )}
                              <span
                                dangerouslySetInnerHTML={{
                                  __html: `${getTitle(
                                    subItem._source.title,
                                    subItem._source.contents,
                                    subItem._source.archive
                                  )}${
                                    !published
                                      ? subItem._source.transcriptiontype ===
                                        "audio"
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

          {/* transcribe button */}
          {transcriptionstatus === "readytotranscribe" && media.length > 0 && (
            <TranscribeButton
              className="button button-primary mt-2"
              label={l("Skriv av")}
              title={title}
              recordId={recordId}
              archiveId={archive.archive_id}
              places={places}
              images={media}
              transcriptionType={transcriptiontype}
              random={false}
            />
          )}
        </td>
      )}

      {/* ---- Other columns ---- */}
      {shouldRenderColumn("archive_id", columns) &&
        !config.siteOptions.recordList?.hideAccessionpage &&
        renderFieldArchiveId()}

      {shouldRenderColumn("place", columns) && (
        <td data-title={`${l("Ort")}:`} className="py-2">
          {places?.length > 0 && (
            <div className={`${pillClasses} `}>
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

      {shouldRenderColumn("collector", columns) &&
        config.siteOptions.recordList?.visibleCollecorPersons && (
          <td data-title={`${l("Insamlare")}:`} className="py-2">
            {collectorPersonElement}
          </td>
        )}

      {shouldRenderColumn("year", columns) && (
        <td data-title={`${l("År")}:`} className="py-2">
          {year && (
            <span className={`${pillClasses}`}>{year.split("-")[0]}</span>
          )}
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
          {transcriptionStatusElement}
        </td>
      )}

      {columns?.includes("transcribedby") && (
        <td data-title={`${l("Transkriberad av")}:`} className="py-2">
          {transcribedby && (
            <span className="transcribed-by text-sm">{transcribedby}</span>
          )}
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
