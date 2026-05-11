import { memo, useMemo } from 'react';
import PropTypes from 'prop-types';
import logoIsof from '../../../../img/logotyp-isof.svg';
import logoIsofWhite from '../../../../img/logotyp-isof-vit.svg';
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
    aliases.forEach((alias) => map.set(normalize(alias), brand));

    return map;
  }, new Map());
}

const aliasMap = buildAliasMap();

const getArchiveBrand = (name) => {
  const key = normalize(name);
  return aliasMap.get(key) || 'isof'; // default: ISOF
};

function RecordViewFooter({ data }) {
  // Safe nested destructuring (won't crash if archive is missing)
  const { archive: { archive: archiveName = '' } = {}, languages = [] } = data || {};

  const hasMeankieliLanguage = languages.some(
    (language) => language?.name === 'Meänkieli',
  );
  const archiveBrand = useMemo(() => getArchiveBrand(archiveName), [archiveName]);
  const isIsofArchive = archiveBrand === 'isof';

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
          {isIsofArchive ? (
            <>
              <img
                src={logoIsof}
                alt={archiveName ? `Logga för ${archiveName}` : 'Logga för arkiv'}
                className="theme-aware-logo--light w-[150px] h-auto"
                loading="lazy"
                decoding="async"
              />
              <img
                src={logoIsofWhite}
                alt={archiveName ? `Logga för ${archiveName}` : 'Logga för arkiv'}
                className="theme-aware-logo--dark w-[150px] h-auto"
                loading="lazy"
                decoding="async"
              />
            </>
          ) : (
            <img
              src={archiveLogoIkos}
              alt={archiveName ? `Logga för ${archiveName}` : 'Logga för arkiv'}
              className="w-[150px] h-auto"
              loading="lazy"
              decoding="async"
            />
          )}
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
