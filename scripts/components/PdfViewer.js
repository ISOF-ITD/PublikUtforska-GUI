/* eslint-disable react/require-default-props */
import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2 MB

export default function PdfViewer({ url = null, height = '500' }) {
  const [pdfUrl, setPdfUrl] = useState(null);
  const [pdfHeight, setPdfHeight] = useState(500);
  const [error, setError] = useState('');
  const [fileSizeMB, setFileSizeMB] = useState(null); // lagrar filstorleken i MB

  useEffect(() => {
    if (url) {
      // Återställ tidigare status vid url-ändring
      setError('');
      setFileSizeMB(null);
      setPdfUrl(null);

      // Gör en HEAD-förfrågan för att hämta headers och kolla content-length
      fetch(url, { method: 'HEAD' })
        .then((res) => {
          const size = res.headers.get('content-length');
          if (size) {
            const sizeNum = parseInt(size, 10);
            const sizeInMB = sizeNum / (1024 * 1024);
            if (sizeNum > MAX_FILE_SIZE) {
              setFileSizeMB(sizeInMB.toFixed(1));
              // pdfUrl lämnas null tills användaren väljer att ladda filen
            } else {
              setPdfUrl(url);
              setPdfHeight(height || 500);
            }
          } else {
            // Om vi inte får storleksinfo, låt användaren välja att ladda ändå
            setFileSizeMB('okänd');
          }
        })
        .catch((err) => {
          // Vid fel, låt användaren välja att ladda ändå
          setFileSizeMB('okänd');
        });
    }
  }, [url, height]);

  const handleLoadLargePdf = () => {
    // Användaren väljer att ladda filen trots storleken
    setError('');
    setPdfUrl(url);
    setPdfHeight(height || 500);
  };

  return (
    <div className="pdf-viewer">
      {error && (
        <div className="error">
          <p>{error}</p>
        </div>
      )}
      {/* Visa knappen endast om pdfUrl inte är satt, dvs. filen inte har laddats */}
      {!pdfUrl && fileSizeMB && (
        <button onClick={handleLoadLargePdf} type="button">
          Visa Pdf ({fileSizeMB} MB)
        </button>
      )}
      {pdfUrl && (
        <object data={pdfUrl} width="100%" height={pdfHeight} type="application/pdf">
          <a href={pdfUrl}>Öppna Pdf</a>
        </object>
      )}
    </div>
  );
}

PdfViewer.propTypes = {
  url: PropTypes.string,
  height: PropTypes.string,
};
