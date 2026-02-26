import PropTypes from "prop-types";
import RecordListItem from "./RecordListItem";
import { l } from "../../../lang/Lang";
import config from "../../../config";

export default function RecordTable({
  records,
  uniqueId,
  params,
  highlightRecordsWithMetadataField,
  shouldRenderColumn,
  archiveIdClick,
  sort,
  order,
  handleSort,
  mode,
  useRouteParams,
  smallTitle,
  columns,
  selectedRecordId,
  onRecordActivate,
}) {
  const items = records.map((item) => (
    <RecordListItem
      key={`${uniqueId}-${item._source.id}`}
      id={item._source.id}
      item={item}
      routeParams={params}
      highlightRecordsWithMetadataField={highlightRecordsWithMetadataField}
      searchParams={params}
      archiveIdClick={archiveIdClick}
      shouldRenderColumn={shouldRenderColumn}
      columns={columns}
      mode={mode}
      useRouteParams={useRouteParams}
      smallTitle={smallTitle}
      isSelected={String(item._source.id) === String(selectedRecordId)}
      onRecordActivate={onRecordActivate}
    />
  ));


  const ariaSortValue = (key) => {
    if (sort !== key) return "none";
    // aria-sort expects: "ascending" | "descending" | "other" | "none"
    if (order === "asc") return "ascending";
    if (order === "desc") return "descending";
    return "none";
  };

  return (
    <div className="hidden md:block">
      <table
        className="mobile-table w-full text-sm border-collapse"
      >
        {/* ---------- header ---------- */}
        <thead>
          <tr className="border-b border-gray-300 last:border-0">
            {shouldRenderColumn("title") && (
              <th scope="col" className="text-left w-1/2">{l('Titel')}</th>
            )}

            {shouldRenderColumn("archive_id") &&
              !config.siteOptions.recordList?.hideAccessionpage && (
                <th scope="col" className="text-left" aria-sort={ariaSortValue('archive.archive_id_row.keyword')}>
                  <button
                    type="button"
                    onClick={() => handleSort("archive.archive_id_row.keyword")}
                    className="flex items-center gap-1 text-sky-900 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-isof-lighter"
                  >
                    {l("Arkivnummer")}
                    {sort === "archive.archive_id_row.keyword" &&
                      (order === "asc" ? "▼" : "▲")}
                  </button>
                </th>
              )}

            {shouldRenderColumn("place") && (
              <th scope="col" className="text-center">{l('Ort')}</th>
            )}

            {shouldRenderColumn("collector") &&
              config.siteOptions.recordList?.visibleCollecorPersons !==
                false && <th scope="col" className="text-center">{l('Insamlare')}</th>}

            {shouldRenderColumn("year") && (
              <th scope="col" className="text-center" aria-sort={ariaSortValue('year')}>
                <button
                  type="button"
                  className="text-sky-900 hover:underline hover:cursor-pointer focus:outline-none focus:ring-2 focus:ring-isof-lighter"
                  onClick={() => handleSort("year")}
                >
                  {sort === "year" && (order === "asc" ? "▼" : "▲")} {l("År")}
                </button>
              </th>
            )}

            {shouldRenderColumn("material_type") &&
              !config.siteOptions.recordList?.hideMaterialType && (
                <th scope="col" className="text-left">{l('Materialtyp')}</th>
              )}

            {shouldRenderColumn("transcriptionstatus") &&
              !config.siteOptions.recordList?.hideTranscriptionStatus && (
                <th scope="col" className="text-center" aria-sort={ariaSortValue("transcriptionstatus")}>
                  <button
                    type="button"
                    className="text-sky-900 hover:underline hover:cursor-pointer focus:outline-none focus:ring-2 focus:ring-isof-lighter"
                    onClick={() => handleSort("transcriptionstatus")}
                  >
                    {sort === "transcriptionstatus" &&
                      (order === "asc" ? "▼" : "▲")}{" "}
                    {l("Avskrivna")}
                  </button>
                </th>
              )}

            {columns?.includes("transcribedby") && (
              <th scope="col" className="text-left">{l('Bidrag av')}</th>
            )}
          </tr>
        </thead>
        <tbody className="[&>tr]:block md:[&>tr]:table-row [&>td]:flex [&>td]:justify-between [&>td]:gap-2">
          {/* hidden header for accessibility on small screens */}
          <tr className="sr-only md:hidden">
            <th>{l("Titel")}</th>
            <th>{l("Arkivnummer")}</th>
            <th>{l("Ort")}</th>
            <th>{l("Insamlare")}</th>
            <th>{l("År")}</th>
            <th>{l("Avskrivna")}</th>
          </tr>
          {items}
        </tbody>
      </table>
    </div>
  );
}

RecordTable.propTypes = {
  records: PropTypes.array.isRequired,
  uniqueId: PropTypes.string.isRequired,
  params: PropTypes.object.isRequired,
  highlightRecordsWithMetadataField: PropTypes.string,
  shouldRenderColumn: PropTypes.func.isRequired,
  archiveIdClick: PropTypes.func.isRequired,
  sort: PropTypes.string.isRequired,
  order: PropTypes.string.isRequired,
  handleSort: PropTypes.func.isRequired,
  mode: PropTypes.string,
  useRouteParams: PropTypes.bool,
  smallTitle: PropTypes.bool,
  columns: PropTypes.array,
  selectedRecordId: PropTypes.string,
  onRecordActivate: PropTypes.func,
};
