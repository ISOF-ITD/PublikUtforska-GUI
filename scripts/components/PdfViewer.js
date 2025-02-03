/* eslint-disable react/require-default-props */
import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';

const MAX_FILE_SIZE = 1 * 1024 * 1024; // 1 MB

export default function PdfViewer({ url = null, height = '500' }) {
  const [pdfUrl, setPdfUrl] = useState(null);
  const [pdfHeight, setPdfHeight] = useState(500);
  const [error, setError] = useState('');

  useEffect(() => {
    if (url) {
      let size;
      // Gör en HEAD-förfrågan för att hämta headers och kolla content-length
      fetch(url, { method: 'HEAD' })
        .then((res) => {
          size = res.headers.get('content-length');
          if (size && parseInt(size, 10) > MAX_FILE_SIZE) {
            setError(`PDF-filen är för stor (${(parseInt(size, 10) / (1024 * 1024)).toFixed(2)} MB)`);
            setPdfUrl(null);
          } else {
            setError('');
            setPdfUrl(url);
            setPdfHeight(height || 500);
          }
        })
        .catch((err) => {
          // visa pdfen ändå
          setPdfUrl(url);
          setPdfHeight(height || 500);
        });
    }
  }, [url, height]);

  return (
    <div className="pdf-viewer">
      {error && <div className="error">{error}</div>}
      {pdfUrl && (
        <object data={pdfUrl} width="100%" height={pdfHeight} type="application/pdf">
          <a href={pdfUrl}>Öppna pdf</a>
        </object>
      )}
    </div>
  );
}

PdfViewer.propTypes = {
  url: PropTypes.string,
  height: PropTypes.string,
};
