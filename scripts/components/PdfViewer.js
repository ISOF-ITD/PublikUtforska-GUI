import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';

function SitevisionContent({ url, height }) {
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

SitevisionContent.propTypes = {
  url: PropTypes.string,
  height: PropTypes.number,
};

SitevisionContent.defaultProps = {
  url: null,
  height: 500,
};

export default SitevisionContent;
