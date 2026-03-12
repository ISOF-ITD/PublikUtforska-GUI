import { memo, useMemo } from 'react';
import PropTypes from 'prop-types';
import archiveLogoIsof from '../../../../img/archive-logo-isof.png';
import archiveLogoIkos from '../../../../img/archive-logo-ikos.png';
import logotypSprakbanken from '../../../../img/logotyp_sprakbanken.svg';
import Disclaimer from '../../../components/views/Disclaimer';

// Normalize: lowercase, strip diacritics, collapse punctuation/whitespace
const normalize = (s) => (s || '')
  .toLowerCase()
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '') // strip diacritics
  .replace(/[^\w\s]/g, ' ') // punctuation -> space
  .replace(/\s+/g, ' ')
  .trim();

// Aliases grouped by brand
const NAME_ALIASES = {
  isof: [
    'dialekt-, namn- och folkminnesarkivet i göteborg',
    'dialekt- och folkminnesarkivet i uppsala',
    'dialekt och folkminnesarkivet i uppsala',
    'dag',
    'dfu',
    'isof',
  ],
  ikos: ['norsk folkeminnesamling', 'nfs', 'ikos'],
};

function buildAliasMap() {
  return Object.entries(NAME_ALIASES).reduce((map, [brand, aliases]) => {
    const logo = brand === 'ikos' ? archiveLogoIkos : archiveLogoIsof;

    aliases.forEach((alias) => map.set(normalize(alias), logo));

    return map;
  }, new Map());
}

const aliasMap = buildAliasMap();

const getArchiveLogo = (name) => {
  const key = normalize(name);
  return aliasMap.get(key) || archiveLogoIsof; // default: ISOF
};

function RecordViewFooter({ data }) {
  // Safe nested destructuring (won't crash if archive is missing)
  const { archive: { archive: archiveName = '' } = {}, languages = [] } = data || {};

  const hasMeankieliLanguage = languages.some(
    (language) => language?.name === 'Meänkieli',
  );
  const logoSrc = useMemo(() => getArchiveLogo(archiveName), [archiveName]);

  return (
    <div className="flex flex-row items-center max-sm:flex-col">
      <Disclaimer showMeankieliDisclaimer={hasMeankieliLanguage} />
      <div
        className="flex items-center gap-4 max-sm:flex-col max-sm:mb-20"
      >
        <a
          href="https://isof.se"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Öppna Isof i ny flik"
        >
          <img
            src={logoSrc}
            alt={archiveName ? `Logga för ${archiveName}` : 'Logga för arkiv'}
            className="w-[150px] h-auto"
            loading="lazy"
            decoding="async"
            onError={(e) => {
              // If a custom mapping ever points to a broken logo,
              // guarantee we still show something.
              if (e.currentTarget.src !== archiveLogoIsof) {
                e.currentTarget.src = archiveLogoIsof;
              }
            }}
          />
        </a>

        <a
          href="https://sprakbanken.se/"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Öppna Språkbanken i ny flik"
        >
          <img
            src={logotypSprakbanken}
            alt="Logga för Språkbanken"
            className="w-[150px] h-auto"
            loading="lazy"
            decoding="async"
          />
        </a>
      </div>
    </div>
  );
}

RecordViewFooter.propTypes = {
  data: PropTypes.shape({
    archive: PropTypes.shape({
      archive: PropTypes.string,
    }),
    languages: PropTypes.arrayOf(
      PropTypes.shape({
        name: PropTypes.string,
        code: PropTypes.string,
      }),
    ),
  }).isRequired,
};

export default memo(RecordViewFooter);
