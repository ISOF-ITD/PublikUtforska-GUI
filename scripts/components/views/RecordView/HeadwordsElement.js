import { useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronDown, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import sanitizeHtml from 'sanitize-html';

function getCleanHtmlHeadwords(headwords, archive) {
  if (!headwords) return null;

  const formattedHeadwords = headwords.trim().replace(/( Sida| Sidor)/g, '\n$1');

  if (archive.archive_org === 'Uppsala') {
    const anchorStart = '<a href="https://www5.sprakochfolkminnen.se/Realkatalogen/';
    const anchorEnd = '" target="_blank">Visa indexkort</a>';
    return sanitizeHtml(
      formattedHeadwords.replaceAll('[[', anchorStart).replaceAll(']]', anchorEnd),
      {
        allowedTags: ['b', 'i', 'em', 'strong', 'a'],
        allowedAttributes: {
          a: ['href', 'target'],
        },
      }
    );
  }

  // Om arkivet inte är 'Uppsala', returnera den formaterade strängen oförändrad
  return formattedHeadwords;
}

function HeadwordsElement({ data }) {
  const { headwords, archive } = data;
  const [expanded, setExpanded] = useState(false);

  // Memorera det bearbetade HTML-innehållet för att undvika onödiga omberäkningar
  const cleanHTMLheadwords = useMemo(
    () => getCleanHtmlHeadwords(headwords, archive),
    [headwords, archive],
  );
  
  if (!headwords) return null;

  return (
    <div className="row">
      <div className="twelve columns">
        <button
          aria-expanded={expanded}
          className="headwords-toggle"
          type="button"
          tabIndex={0}
          style={{
            textDecoration: 'underline',
            cursor: 'pointer',
            background: 'none',
            border: 'none',
            padding: 0,
            font: 'inherit',
          }}
          onClick={() => setExpanded(!expanded)}
          onKeyDown={(e) => {
            // Aktivera toggling när "Enter" eller "Space" trycks ned
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setExpanded(!expanded);
            }
          }}
        >
          <FontAwesomeIcon icon={expanded ? faChevronDown : faChevronRight} />
          {' '}
          <span>Uppgifter från äldre innehållsregister</span>
        </button>
        <div className={`record-text realkatalog-content display-line-breaks ${expanded ? 'show' : 'hide'}`}>
          <div
            dangerouslySetInnerHTML={{
              __html: cleanHTMLheadwords,
            }}
          />
        </div>
      </div>
    </div>
  );
}

HeadwordsElement.propTypes = {
  data: PropTypes.shape({
    headwords: PropTypes.string,
    archive: PropTypes.shape({
      archive_org: PropTypes.string.isRequired,
    }).isRequired,
  }).isRequired,
};

export default HeadwordsElement;
