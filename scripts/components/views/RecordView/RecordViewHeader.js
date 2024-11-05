/* eslint-disable react/require-default-props */
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
    window.eventBus.dispatch('overlay.switcherHelpText', {});
  }
};

const renderArchiveName = (data) => (
  <span className="ml-10">
    <strong>{l('Arkiv')}</strong>
    {`: ${getArchiveName(data.archive.archive_org)}`}
  </span>
)

const renderSubrecordCount = (subrecordsCount) => (
  subrecordsCount?.value ? (
    <span className="ml-10">
      <strong>{l('Antal uppteckningar')}</strong>
      {`: ${subrecordsCount.value}`}
    </span>
  ) : null
);

const renderAccessionsNumber = (recordtype, archive) => (
  <span className="ml-10">
    <strong>{l('Accessionsnummer')}</strong>
    :&nbsp;
    {recordtype === 'one_record' ? (
      <a
        title={`Gå till accessionen ${archive.archive_id_row}`}
        style={{
          cursor: archive.archive_id_row ? 'pointer' : 'inherit',
          textDecoration: 'underline',
        }}
        href={`#/records/${archive.archive_id_row}`}
      >
        {makeArchiveIdHumanReadable(archive.archive_id, archive.archive_org)}
      </a>
    ) : (
      makeArchiveIdHumanReadable(archive.archive_id, archive.archive_org)
    )}
  </span>
);

const renderPageCount = (pages) => (
  pages ? (
    <span className="ml-10">
      <strong>{l('Sidnummer')}</strong>
      :
      {pages}
    </span>
  ) : null
);

export default function RecordViewHeader({
  data,
  subrecordsCount,
}) {
  const {
    title, recordtype, materialtype, archive, country, id,
  } = data;
  const shouldShowMaterialType = config.siteOptions?.recordView?.hideMaterialType !== true;
  const pages = getPages(data);
  const titleText = getTitleText(data);
  const recordTypeLabel = getRecordtypeLabel(recordtype);

  return (
    <div className="container-header">
      <div className="row">
        <div className="twelve columns">
          <h2>{titleText && titleText !== '[]' ? titleText : l('(Utan titel)')}</h2>
          <p className="ml-10">
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
            {recordtype === 'one_accession_row' && renderSubrecordCount(subrecordsCount)}
            {renderPageCount(pages)}
            {shouldShowMaterialType && (
              <span className="ml-10">
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
    </div>
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
  }).isRequired,
  subrecordsCount: propTypes.object,
};
