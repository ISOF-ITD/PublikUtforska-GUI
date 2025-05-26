import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import PdfViewer from '../../PdfViewer';
import config from '../../../config';

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
          <div className="hidden md:block w-full" key={`pdf-row-${pdfObject.source}`}>
            <PdfViewer
              height="100%"
              url={buildPdfUrl(pdfObject.source)}
            />
          </div>
        ))}
      <div className="w-full">
        <div className="flex gap-5 flex-wrap">
          {pdfObjects.map((pdfObject) => {
            const titleString = pdfObject.title || pdfObject.source.split('/').pop();
            return (
              <a
                title="Öppna PDF"
                data-type="pdf"
                href={buildPdfUrl(pdfObject.source)}
                key={`pdf-${pdfObject.source}`}
                className="inline-block w-[115px] cursor-pointer"
                download
                rel="noopener noreferrer"
              >
                {/* ikon + titel */}
                <div className="h-[115px] bg-[#fafbfc] bg-center bg-no-repeat bg-[length:55px_55px] bg-[url('/img/icon-pdf.png')] border border-[#eaeaea] rounded" role="img" aria-hidden="true" />
                <span className="max-w-full break-words mt-[5px] mb-[15px] text-center">{titleString}</span>
              </a>
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
