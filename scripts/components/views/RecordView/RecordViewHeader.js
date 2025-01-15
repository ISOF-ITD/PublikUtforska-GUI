/* eslint-disable react/require-default-props */
import { Link } from 'react-router-dom';
import propTypes from 'prop-types';
import { l } from '../../../lang/Lang';
import {
  makeArchiveIdHumanReadable, getRecordtypeLabel, getPages, getTitleText, getArchiveName,
} from '../../../utils/helpers';
import FeedbackButton from '../FeedbackButton';
import ContributeInfoButton from '../ContributeInfoButton';
import config from '../../../config';

const openSwitcherHelptext = () => {
  if (window.eventBus) {
    window.eventBus.dispatch('overlay.HelpText', { kind: 'switcher' });
  }
};

const renderArchiveName = (data) => (
  <span className="mr-10">
    <strong>{l('Arkiv')}</strong>
    {`: ${getArchiveName(data.archive.archive_org)}`}
  </span>
);

const renderSubrecordCount = (recordtype, subrecordsCount) => (
  recordtype === 'one_accession_row' && subrecordsCount?.value ? (
    <span className="mr-10">
      <strong>{l('Antal uppteckningar')}</strong>
      {`: ${subrecordsCount.value}`}
    </span>
  ) : null
);

const renderAccessionsNumber = (recordtype, archive) => (
  <span className="mr-10">
    <strong>{l('Accessionsnummer')}</strong>
    :&nbsp;
    {recordtype === 'one_record' ? (
      <Link
        title={`Gå till accessionen ${archive.archive_id_row}`}
        style={{
          cursor: archive.archive_id_row ? 'pointer' : 'inherit',
          textDecoration: 'underline',
        }}
        to={`/records/${archive.archive_id_row}`}
      >
        {makeArchiveIdHumanReadable(archive.archive_id, archive.archive_org)}
      </Link>
    ) : (
      makeArchiveIdHumanReadable(archive.archive_id, archive.archive_org)
    )}
  </span>
);

const renderYear = (year) => {
  if (!year) return null;
  return (
    <span className="mr-10">
      <strong>{l('År')}</strong>
      {`: ${year.substring(0, 4)}`}
    </span>
  );
};

const renderPageCount = (pages) => (
  pages ? (
    <span className="mr-10">
      <strong>{l('Sidnummer')}</strong>
      {`: ${pages}`}
    </span>
  ) : null
);

export default function RecordViewHeader({
  data,
  subrecordsCount,
}) {
  const {
    title, recordtype, materialtype, archive, country, id, year = null,
  } = data;
  const shouldShowMaterialType = config.siteOptions?.recordView?.hideMaterialType !== true;
  const pages = getPages(data);
  const titleText = getTitleText(data);
  const recordTypeLabel = getRecordtypeLabel(recordtype);

  return (
    <header className="container-header">
      <div className="row">
        <div className="eleven columns">
          <h1>{titleText && titleText !== '[]' ? titleText : l('(Utan titel)')}</h1>
          <p className="mr-10">
            {recordTypeLabel}
            <span
              className="switcher-help-button"
              onClick={openSwitcherHelptext}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') openSwitcherHelptext();
              }}
              title="Om accessioner och uppteckningar"
              role="button"
              tabIndex={0}
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
              <span className="mr-10">
                <strong>Materialtyp</strong>
                {': '}
                {materialtype}
              </span>
            )}
            {renderArchiveName(data)}
          </p>
        </div>
      </div>
      <FeedbackButton title={title} type="Uppteckning" country={country} />
      <ContributeInfoButton title={title} type="Uppteckning" country={country} id={id} />
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
