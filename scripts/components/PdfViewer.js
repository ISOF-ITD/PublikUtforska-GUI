/* eslint-disable react/require-default-props */
import PropTypes from 'prop-types';

export default function PdfViewer({ url = null, height = '80vh' }) {
  const styleHeight =
    typeof height === 'number' ? `${height}px` : height ?? '80vh';

  return (
    <div className="w-full mb-8">
      {url ? (
        <object
          data={url}
          type="application/pdf"
          className="w-full bg-white bg-center bg-no-repeat"
          style={{ height: styleHeight }}
          aria-label="PDF-visning"
        >
          <a href={url}>Öppna PDF</a>
        </object>
      ) : (
        <p>Laddar PDF …</p>
      )}
    </div>
  );
}

PdfViewer.propTypes = {
  url: PropTypes.string,
  height: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
};
