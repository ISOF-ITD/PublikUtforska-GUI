import PropTypes from 'prop-types';
import RecordListItem from './RecordListItem';
import { l } from '../../../lang/Lang';
import config from '../../../config';
import {
  RESULT_TABLE_CLASS, RESULT_TABLE_HEADER_ROW_CLASS,
} from './resultListStyles';

export default function RecordTable({
  records,
  uniqueId,
  params,
  highlightRecordsWithMetadataField,
  shouldRenderColumn,
  archiveIdClick,
  mode,
  useRouteParams,
  smallTitle,
  columns,
  selectedRecordId,
  onRecordActivate,
  parishPreview,
  detailSearch,
}) {
  const items = records.map((item, index) => (
    <RecordListItem
      key={`${uniqueId}-${item?._id || item?._source?.id || 'record'}-${index}`}
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
      parishPreview={parishPreview}
      detailSearch={detailSearch}
    />
  ));

  return (
    <div>
      <table
        className={RESULT_TABLE_CLASS}
      >
        {/* ---------- header ---------- */}
        <thead>
          <tr className={RESULT_TABLE_HEADER_ROW_CLASS}>
            {shouldRenderColumn('title') && (
              <th scope="col" className="text-left w-1/2">{l('Titel')}</th>
            )}

            {shouldRenderColumn('archive_id')
              && !config.siteOptions.recordList?.hideAccessionpage && (
                <th scope="col" className="text-left">{l('Arkivnummer')}</th>
            )}

            {shouldRenderColumn('place') && (
              <th scope="col" className="text-center">{l('Ort')}</th>
            )}

            {shouldRenderColumn('collector')
              && config.siteOptions.recordList?.visibleCollecorPersons
                !== false && <th scope="col" className="text-center">{l('Insamlare')}</th>}

            {shouldRenderColumn('year') && (
              <th scope="col" className="text-center">{l('År')}</th>
            )}

            {shouldRenderColumn('material_type')
              && !config.siteOptions.recordList?.hideMaterialType && (
                <th scope="col" className="text-left">{l('Materialtyp')}</th>
            )}

            {shouldRenderColumn('transcriptionstatus')
              && !config.siteOptions.recordList?.hideTranscriptionStatus && (
                <th scope="col" className="text-center">{l('Avskrivna')}</th>
            )}

            {columns?.includes('transcribedby') && (
              <th scope="col" className="text-left">{l('Bidrag av')}</th>
            )}
          </tr>
        </thead>
        <tbody className="[&>tr]:block md:[&>tr]:table-row [&>td]:flex [&>td]:justify-between [&>td]:gap-2">
          {/* hidden header for accessibility on small screens */}
          <tr className="sr-only md:hidden">
            <th>{l('Titel')}</th>
            <th>{l('Arkivnummer')}</th>
            <th>{l('Ort')}</th>
            <th>{l('Insamlare')}</th>
            <th>{l('År')}</th>
            <th>{l('Avskrivna')}</th>
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
  mode: PropTypes.string,
  useRouteParams: PropTypes.bool,
  smallTitle: PropTypes.bool,
  columns: PropTypes.array,
  selectedRecordId: PropTypes.string,
  onRecordActivate: PropTypes.func,
  parishPreview: PropTypes.shape({
    onHover: PropTypes.func.isRequired,
    onFocus: PropTypes.func.isRequired,
  }),
  detailSearch: PropTypes.string,
};
