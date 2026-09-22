/* eslint-disable react/require-default-props */
import propTypes from "prop-types";
import { useState } from 'react';
import { l } from "../../../lang/Lang";
import {
  // getRecordtypeLabel,
  getPages,
  getTitleText,
  // getArchiveName,
} from "../../../utils/helpers";
import ContactButtonGroup from '../../../components/views/ContactButtonGroup';
import config from "../../../config";
import BookmarkedRecordButton from '../../../components/BookmarkedRecordButton';

const RECORD_TYPE_HELP_ID = 'record-type-help';

const renderMetadataItem = (label, value) => (
  <div key={label} className="mr-2.5 inline">
    <dt className="inline m-0 font-semibold">{label}</dt>
    <dd className="inline m-0">{`: ${value}`}</dd>
  </div>
);

// const renderArchiveName = (archive) => {
//   if (!archive?.archive_org) return null;
//   return renderMetadataItem(l("Arkiv"), getArchiveName(archive.archive_org));
// };

// const renderSubrecordCount = (recordtype, subrecordsCount) => (
//   recordtype === "one_accession_row" && (subrecordsCount?.value ?? subrecordsCount)
//     ? renderMetadataItem(
//         l("Antal uppteckningar"),
//         subrecordsCount?.value ?? subrecordsCount,
//       )
//     : null
// );

const renderAccessionsNumber = (archive) => (
  archive?.archive_id_display_search?.length
    ? renderMetadataItem(
        l("Accessionsnummer"),
        archive.archive_id_display_search.join(", "),
      )
    : null
);

const renderYear = (year) => {
  if (!year) return null;
  return renderMetadataItem(l("År"), String(year).padStart(4, "0").slice(0, 4));
};

const renderPageCount = (pages) => (
  pages ? renderMetadataItem(l("Sidnummer"), pages) : null
);

export default function RecordViewHeader({ data }) {
  const [showRecordTypeHelp, setShowRecordTypeHelp] = useState(false);
  const {
    recordtype,
    materialtype,
    archive,
    year = null,
  } = data;
  const shouldShowMaterialType =
    config.siteOptions?.recordView?.hideMaterialType !== true;
  const pages = getPages(data);
  const titleText = getTitleText(data);
  // const recordTypeLabel = getRecordtypeLabel(recordtype);

  const toggleRecordTypeHelp = () => {
    setShowRecordTypeHelp((visible) => !visible);
  };

  return (
    <header className="container-header">
      <div className="row">
        <div className="eleven columns">
          <h1>
            {titleText && titleText !== '[]' ? titleText : l('(Utan titel)')}
          </h1>
          {/* <p className="mr-2.5">
            {recordTypeLabel}
            <button
              type="button"
              className="relative -top-px mx-2 !mb-0 inline-block !h-[18px] !w-[18px] cursor-pointer !align-baseline !rounded-full !border !border-solid !border-white !bg-isof !p-0 !text-base !font-bold !leading-[18px] !text-white !ring-1 !ring-white appearance-none"
              onClick={toggleRecordTypeHelp}
              title="Om accessioner och uppteckningar"
              aria-label={l("Om accessioner och uppteckningar")}
              aria-expanded={showRecordTypeHelp}
              aria-controls={RECORD_TYPE_HELP_ID}
            >
              ?
            </button>
          </p> */}
          <dl className="m-0">
            {renderAccessionsNumber(archive)}
            {renderYear(year)}
            {/* {renderSubrecordCount(recordtype, subrecordsCount)} */}
            {renderPageCount(pages)}
            {shouldShowMaterialType
              && materialtype
              && renderMetadataItem(l("Materialtyp"), materialtype)}
            {/* {renderArchiveName(archive)} */}
          </dl>
          <section
            id={RECORD_TYPE_HELP_ID}
            hidden={!showRecordTypeHelp}
            aria-labelledby={`${RECORD_TYPE_HELP_ID}-heading`}
            className="mt-4 rounded-lg border border-border bg-surface p-4 text-body"
          >
            <h2 id={`${RECORD_TYPE_HELP_ID}-heading`} className="mt-0 text-lg">
              {config.siteOptions.helpTexts.switcher.title}
            </h2>
            <div
              dangerouslySetInnerHTML={{
                __html: config.siteOptions.helpTexts.switcher.content,
              }}
            />
          </section>
        </div>
      </div>
      <ContactButtonGroup className="!static mt-2 w-full flex-wrap justify-end gap-2">
        <BookmarkedRecordButton record={data} variant="contact" />
      </ContactButtonGroup>
    </header>
  );
}

RecordViewHeader.propTypes = {
  data: propTypes.shape({
    title: propTypes.string,
    recordtype: propTypes.string.isRequired,
    materialtype: propTypes.string,
    archive: propTypes.shape({
      archive_id: propTypes.string.isRequired,
      archive_org: propTypes.string.isRequired,
      archive_id_row: propTypes.string.isRequired,
    }).isRequired,
    country: propTypes.string,
    id: propTypes.string.isRequired,
    year: propTypes.string,
  }).isRequired,
  // subrecordsCount: propTypes.object,
};
