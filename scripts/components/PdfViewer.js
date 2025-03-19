/* eslint-disable react/require-default-props */
import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB

export default function PdfViewer({ url = null, height = '500' }) {
  const [pdfUrl, setPdfUrl] = useState(null);
  const [pdfHeight, setPdfHeight] = useState('500');
  const [fileSize, setFileSize] = useState(null); // lagrar filstorleken
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (url) {
      // Återställ tidigare status vid url-ändring
      setFileSize(null);
      setPdfUrl(null);
      setLoading(true);

      // Gör en HEAD-förfrågan för att hämta headers och kolla content-length
      fetch(url, { method: 'HEAD' })
        .then((res) => {
          if (!res.ok) {
            setFileSize('okänd storlek');
            throw new Error('Network response was not ok');
            // let users choose to load anyway
          }
          const size = res.headers.get('content-length');
          if (size) {
            const sizeNum = parseInt(size, 10);
            const sizeInMB = sizeNum / (1024 * 1024);
            if (sizeNum > MAX_FILE_SIZE) {
              setFileSize(`${sizeInMB.toFixed(1)} MB`);
              // pdfUrl lämnas null tills användaren väljer att ladda filen
            } else {
              setPdfUrl(url);
              setPdfHeight(height || '500');
            }
          } else {
            // Om vi inte får storleksinfo, låt användaren välja att ladda ändå
            setFileSize('okänd storlek');
          }
        })
        .catch((err) => {
          // Vid fel, låt användaren välja att ladda ändå
          setFileSize('okänd storlek');
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [url, height]);

  const handleLoadLargePdf = () => {
    // Användaren väljer att ladda filen trots storleken
    setPdfUrl(url);
    setPdfHeight(height || '500');
  };

  return (
    <div className="pdf-viewer">
      {loading && <p>Hämtar filinfo...</p>}
      {/* Visa knappen endast om pdfUrl inte är satt, dvs. filen inte har laddats */}
      {!loading && !pdfUrl && fileSize && (
        <button onClick={handleLoadLargePdf} type="button">
          {`Visa Pdf (${fileSize})`}
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
