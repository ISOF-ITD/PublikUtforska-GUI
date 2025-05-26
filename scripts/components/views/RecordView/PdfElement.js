import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import PdfViewer from '../../PdfViewer';
import config from '../../../config';
import PdfThumbnail from './PdfThumbnail';

export function useMediaQuery(query) {
  if (typeof window === 'undefined') return false;
  const getMatch = () => typeof window !== 'undefined' && window.matchMedia(query).matches;
  const [matches, setMatches] = useState(getMatch);

  useEffect(() => {
    const mql = window.matchMedia(query);
    const handler = (e) => setMatches(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, [query]);

  return matches;
}

export default function PdfElement({ data }) {
  const { media = [] } = data;

  const pdfObjects = media.filter((item) => item.type === 'pdf');
  if (pdfObjects.length === 0) {
    return null;
  }

  const isAtLeastMediumScreen = useMediaQuery('(min-width: 768px)');
  const buildPdfUrl = (src) => `${config.pdfUrl ?? config.imageUrl ?? ''}${src}`;


  return (
    <>
      {isAtLeastMediumScreen
        && pdfObjects.map((pdfObject) => (
          <PdfViewer
            height="100%"
            url={buildPdfUrl(pdfObject.source)}
            key={`pdf-viewer-${pdfObject.source}`}
          />
        ))}
      <div className="w-full">
        <div className="flex gap-5 flex-wrap">
          {pdfObjects.map((pdfObject) => {
            return (
              <PdfThumbnail
                key={`pdf-${pdfObject.source}`}
                url={buildPdfUrl(pdfObject.source)}
                title={pdfObject.title || pdfObject.source.split('/').pop()}
              />
            );
          })}
        </div>
      </div>
    </>
  );
}

PdfElement.propTypes = {
  data: PropTypes.shape({
    media: PropTypes.arrayOf(PropTypes.shape({
      type: PropTypes.string.isRequired,
      source: PropTypes.string.isRequired,
      title: PropTypes.string,
    })),
  }).isRequired,
};
