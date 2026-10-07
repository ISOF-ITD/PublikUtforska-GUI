import PropTypes from 'prop-types';
import {
  Children, useId, useRef, useState,
} from 'react';
import { Link } from 'react-router-dom';
import { l } from '../../../lang/Lang';
import { getPages } from '../../../utils/helpers';
import config from '../../../config';
import { createDetailLocation } from '../../../utils/routeHelper';
import groupPersons from './groupPersons';
import ModalDialog, { ModalDialogTitle } from '../../../components/ModalDialog';

const metadataRowClassName = 'grid min-w-0 grid-cols-1 gap-x-6 gap-y-1 min-[650px]:grid-cols-[9rem,minmax(0,1fr)] min-[650px]:items-baseline';
const metadataLinkClassName = 'inline rounded-sm !text-link underline underline-offset-2 hover:!text-link-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-focus focus-visible:outline-offset-2';

const renderMetadataItem = (label, value) => (
  <div key={label} className={metadataRowClassName}>
    <dt className="m-0 text-sm font-semibold text-muted">{label}</dt>
    <dd className="m-0 break-words">{value}</dd>
  </div>
);

const renderYear = (year) => (
  year ? renderMetadataItem(l('År'), String(year).padStart(4, '0').slice(0, 4)) : null
);

const renderPageCount = (pages) => (
  pages ? renderMetadataItem(l('Sidnummer'), pages) : null
);

export default function RecordViewMetadata({ data, search = '', children }) {
  const [showRecordTypeHelp, setShowRecordTypeHelp] = useState(false);
  const helpId = useId();
  const helpButtonRef = useRef(null);
  const closeButtonRef = useRef(null);
  const recordTypeHelp = config.siteOptions?.helpTexts?.switcher;
  const {
    materialtype,
    archive,
    year = null,
    places = [],
    persons: rawPersons = [],
  } = data;
  const shouldShowMaterialType = config.siteOptions?.recordView?.hideMaterialType !== true;
  const pages = getPages(data);
  const persons = groupPersons(rawPersons);
  const hasMetadata = archive?.archive_id_display_search?.length || year || pages
    || (shouldShowMaterialType && materialtype) || places.length || persons.length;
  const additionalMetadata = Children.toArray(children);
  if (!hasMetadata && !additionalMetadata.length) return null;

  return (
    <dl className="m-0 grid gap-y-3 text-base leading-relaxed text-body">
      {archive?.archive_id_display_search?.length > 0 && (
        <div className={metadataRowClassName}>
          <dt className="m-0 text-sm font-semibold text-muted">
            <span className="inline-flex items-center gap-1 whitespace-nowrap">
              {l('Accessionsnummer')}
              {recordTypeHelp?.content && (
                <button
                  ref={helpButtonRef}
                  type="button"
                  aria-label={l('Om accessioner och uppteckningar')}
                  title={l('Om accessioner och uppteckningar')}
                  aria-expanded={showRecordTypeHelp}
                  aria-haspopup="dialog"
                  aria-controls={showRecordTypeHelp ? helpId : undefined}
                  onClick={() => setShowRecordTypeHelp(true)}
                  className="!m-0 !inline-flex !h-6 !w-6 shrink-0 items-center justify-center !border-0 !bg-transparent !p-0 !text-sm !text-link !leading-none hover:!text-link-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-focus focus-visible:outline-offset-2"
                >
                  <span aria-hidden="true" className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-solid border-current">?</span>
                </button>
              )}
            </span>
          </dt>
          <dd className="m-0 break-words">
            <span>{archive.archive_id_display_search.join(', ')}</span>
            {recordTypeHelp?.content && (
              <ModalDialog
                open={showRecordTypeHelp}
                onClose={() => setShowRecordTypeHelp(false)}
                initialFocus={closeButtonRef}
                fallbackFocus={helpButtonRef}
                closeOnBackdrop
                containerClassName="fixed inset-0 z-[3200] flex items-center justify-center bg-[var(--color-overlay-strong)] p-4"
              >
                <div id={helpId} className="flex max-h-[calc(100dvh-2rem)] w-full max-w-xl flex-col rounded-xl border border-solid border-border bg-surface text-body shadow-xl">
                  <div className="flex shrink-0 items-start justify-between gap-4 p-5">
                    <ModalDialogTitle className="!m-0 !text-lg !font-semibold !leading-snug">
                      {recordTypeHelp.title}
                    </ModalDialogTitle>
                    <button
                      ref={closeButtonRef}
                      type="button"
                      aria-label={l('Stäng förklaringen')}
                      onClick={() => setShowRecordTypeHelp(false)}
                      className="button button-secondary !m-0 !h-auto min-h-11 shrink-0 !px-3 !py-2 !text-sm !leading-normal focus-visible:outline focus-visible:outline-2 focus-visible:outline-focus focus-visible:outline-offset-2"
                    >
                      {l('Stäng')}
                    </button>
                  </div>
                  <div
                    className="min-h-0 overflow-y-auto px-5 pb-5 text-base leading-relaxed [&_p]:!mt-0 [&_p]:!mb-4 [&_p:last-child]:!mb-0"
                    dangerouslySetInnerHTML={{ __html: recordTypeHelp.content }}
                  />
                </div>
              </ModalDialog>
            )}
          </dd>
        </div>
      )}
      {renderYear(year)}
      {renderPageCount(pages)}
      {shouldShowMaterialType
        && materialtype
        && renderMetadataItem(l('Materialtyp'), materialtype)}
      {places.length > 0 && (
        <div className={metadataRowClassName}>
          <dt className="m-0 text-sm font-semibold text-muted">
            {l(places.length === 1 ? 'Ort' : 'Orter')}
          </dt>
          <dd className="m-0">
            <ul className="!m-0 grid gap-y-1 !list-none !p-0">
              {places.map((place) => {
                const placeName = [
                  [place.specification, place.name].filter(Boolean).join(' i '),
                  place.fylke || place.harad,
                  place.landskap,
                ].filter(Boolean).join(', ');
                return (
                  <li key={`${place.id}-${place.specification || ''}-${place.name}`} className="!m-0 break-words">
                    <Link
                      to={createDetailLocation({ resource: 'places', id: place.id, search })}
                      className={metadataLinkClassName}
                    >
                      {placeName}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </dd>
        </div>
      )}
      {persons.length > 0 && (
        <div className={metadataRowClassName}>
          <dt className="m-0 text-sm font-semibold text-muted">
            {l('Personer')}
          </dt>
          <dd className="m-0">
            <ul className="!m-0 grid gap-y-1 !list-none !p-0">
              {persons.map((person) => {
                const roles = person.roles.join(', ');
                const showLink = person.id && !config.siteOptions.disablePersonLinks
                  && !(config.siteOptions.disableInformantLinks
                    && person.isInformant);
                return (
                  <li key={person.groupKey} className="!m-0 break-words">
                    {showLink ? (
                      <Link
                        to={createDetailLocation({ resource: 'persons', id: person.id, search })}
                        className={metadataLinkClassName}
                      >
                        {person.name}
                      </Link>
                    ) : person.name}
                    {roles && <span className="text-muted">{` (${roles})`}</span>}
                  </li>
                );
              })}
            </ul>
          </dd>
        </div>
      )}
      {additionalMetadata}
    </dl>
  );
}

RecordViewMetadata.propTypes = {
  children: PropTypes.node,
  search: PropTypes.string,
  data: PropTypes.shape({
    materialtype: PropTypes.string,
    year: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    archive: PropTypes.shape({
      archive_id_display_search: PropTypes.arrayOf(PropTypes.string),
      page: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      total_pages: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    }),
    places: PropTypes.arrayOf(PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      specification: PropTypes.string,
      harad: PropTypes.string,
      fylke: PropTypes.string,
      landskap: PropTypes.string,
    })),
    persons: PropTypes.arrayOf(PropTypes.shape({
      id: PropTypes.string,
      name: PropTypes.string.isRequired,
      relation: PropTypes.string,
    })),
  }).isRequired,
};
