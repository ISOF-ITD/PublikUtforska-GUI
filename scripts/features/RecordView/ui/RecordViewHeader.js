/* eslint-disable react/require-default-props */
import propTypes from "prop-types";
import { l } from "../../../lang/Lang";
import {
  getRecordtypeLabel,
  getPages,
  getTitleText,
  getArchiveName,
} from "../../../utils/helpers";
import FeedbackButton from "../../../components/views/FeedbackButton";
import ContributeInfoButton from "../../../components/views/ContributeInfoButton";
import config from "../../../config";

const renderArchiveName = (archive) => {
  if (!archive?.archive_org) return null;
  return (
    <span className="mr-2.5">
      <strong>{l("Arkiv")}</strong>
      {`: ${getArchiveName(archive.archive_org)}`}
    </span>
  );
};

const renderSubrecordCount = (recordtype, subrecordsCount) =>
  recordtype === "one_accession_row" &&
  (subrecordsCount?.value ?? subrecordsCount) ? (
    <span className="mr-2.5">
      <strong>{l("Antal uppteckningar")}</strong>
      {`: ${subrecordsCount?.value ?? subrecordsCount}`}
    </span>
  ) : null;

const renderAccessionsNumber = (recordtype, archive) => (
  <span className="mr-2.5">
    <strong>{l("Accessionsnummer")}</strong>
    :&nbsp;
    { archive.archive_id_display_search?.join(", ") || "" }
  </span>
);

const renderYear = (year) => {
  if (!year) return null;
  return (
    <span className="mr-2.5">
      <strong>{l("År")}</strong>
      {`: ${String(year).padStart(4, "0").slice(0, 4)}`}
    </span>
  );
};

const renderPageCount = (pages) =>
  pages ? (
    <span className="mr-2.5">
      <strong>{l("Sidnummer")}</strong>
      {`: ${pages}`}
    </span>
  ) : null;

export default function RecordViewHeader({ data, subrecordsCount }) {
  const {
    title,
    recordtype,
    materialtype,
    archive,
    country,
    id,
    year = null,
  } = data;
  const shouldShowMaterialType =
    config.siteOptions?.recordView?.hideMaterialType !== true;
  const pages = getPages(data);
  const titleText = getTitleText(data);
  const recordTypeLabel = getRecordtypeLabel(recordtype);

  const openSwitcherHelptext = () => {
    if (window.eventBus) {
      window.eventBus.dispatch("overlay.HelpText", { kind: "switcher" });
    }
  };

  return (
    <header className="container-header">
      <div className="row">
        <div className="eleven columns">
          <h1>
            {titleText && titleText !== "[]" ? titleText : l("(Utan titel)")}
          </h1>
          <p className="mr-2.5">
            {recordTypeLabel}
            <span
              className="switcher-help-button"
              onClick={openSwitcherHelptext}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") openSwitcherHelptext();
              }}
              title="Om accessioner och uppteckningar"
              role="button"
              tabIndex={0}
              aria-label={l("Om accessioner och uppteckningar")}
            >
              ?
            </span>
          </p>
          <p>
            {renderAccessionsNumber(recordtype, archive)}
            {renderYear(year)}
            {renderSubrecordCount(recordtype, subrecordsCount)}
            {renderPageCount(pages)}
            {shouldShowMaterialType && (
              <span className="mr-2.5">
                <strong>Materialtyp</strong>
                {": "}
                {materialtype}
              </span>
            )}
            {renderArchiveName(archive)}
          </p>
        </div>
      </div>
      <FeedbackButton title={title} type="Uppteckning" country={country} />
      <ContributeInfoButton
        title={title}
        type="Uppteckning"
        country={country}
        id={id}
      />
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
  subrecordsCount: propTypes.object,
};
