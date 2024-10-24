/* eslint-disable react/require-default-props */
import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';

export default function PdfViewer({ url = null, height = 500 }) {
  const [pdfUrl, setPdfUrl] = useState(null);
  const [pdfHeight, setPdfHeight] = useState(500);

  useEffect(() => {
    if (url) {
      setPdfUrl(url);
      setPdfHeight(height || 500);
    }
  }, [url, height]);

  return (
    <div className="pdf-viewer">
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
  height: PropTypes.number,
};
