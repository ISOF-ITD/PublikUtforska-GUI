import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import PdfViewer from '../../PdfViewer';
import config from '../../../config';
import PdfThumbnail from './PdfThumbnail';

export function useMediaQuery(query) {
  const [matches, setMatches] = useState(false); // safe default for SSR

  useEffect(() => {
    if (typeof window === "undefined" || !query) return;

    const mql = window.matchMedia(query);

    // set initial value on mount (client only)
    setMatches(mql.matches);

    const handler = (e) => setMatches(e.matches);

    // Feature-detect modern vs legacy API (Safari < 14)
    if (typeof mql.addEventListener === "function") {
      mql.addEventListener("change", handler);
      return () => mql.removeEventListener("change", handler);
    } else {
      mql.addListener(handler);
      return () => mql.removeListener(handler);
    }
  }, [query]);

  return matches;
}

export default function PdfElement({ data }) {
  const { media = [] } = data ?? {};
  const pdfObjects = Array.isArray(media)
    ? media.filter((i) => i?.type === "pdf")
    : [];

  if (pdfObjects.length === 0) return null;

  const isAtLeastMediumScreen = useMediaQuery("(min-width: 768px)");
  const buildPdfUrl = (src) =>
    `${config.pdfUrl ?? config.imageUrl ?? ""}${src ?? ""}`;

  return (
    <>
      {isAtLeastMediumScreen &&
        pdfObjects.map((pdfObject) => (
          <PdfViewer
            height="100%"
            url={buildPdfUrl(pdfObject.source)}
            key={`pdf-viewer-${pdfObject.source}`}
          />
        ))}
      <div className="w-full">
        <div className="flex gap-5 flex-wrap">
          {pdfObjects.map((pdfObject) => (
            <PdfThumbnail
              key={`pdf-${pdfObject.source}`}
              url={buildPdfUrl(pdfObject.source)}
              title={pdfObject.title || pdfObject.source.split('/').pop()}
            />
          ))}
        </div>
      </div>
    </>
  );
}

PdfElement.propTypes = {
  data: PropTypes.shape({
    media: PropTypes.arrayOf(
      PropTypes.shape({
        type: PropTypes.string.isRequired,
        source: PropTypes.string.isRequired,
        title: PropTypes.string,
      })
    ),
  }).isRequired,
};
