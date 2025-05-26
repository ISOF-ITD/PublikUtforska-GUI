/* eslint-disable react/require-default-props */
import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';

export default function PdfViewer({ url = null, height = '500' }) {
  const [pdfUrl, setPdfUrl] = useState(null);
  const [pdfHeight, setPdfHeight] = useState('500');

  useEffect(() => {
    if (url) {
      // ladda alltid pdf:en direkt
      setPdfUrl(url);
      setPdfHeight(height || '500');
    }
  }, [url, height]);

  return (
    <div className="hidden md:block w-full pdf-viewer">
      {pdfUrl ? (
        <object data={pdfUrl} width="100%" height={pdfHeight} type="application/pdf">
          <a href={pdfUrl}>Öppna Pdf</a>
        </object>
      ) : (
        <p>Laddar pdf ...</p>
      )}
    </div>
  );
}

PdfViewer.propTypes = {
  url: PropTypes.string,
  height: PropTypes.string,
};
