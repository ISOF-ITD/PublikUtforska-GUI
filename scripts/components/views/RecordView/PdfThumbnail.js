/* eslint-disable react/require-default-props */
import PropTypes from 'prop-types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFilePdf } from '@fortawesome/free-solid-svg-icons';

export default function PdfThumbnail({ url, title = '' }) {
  return (
    <a
      title="Öppna PDF"
      data-type="pdf"
      href={url}
      className="inline-block w-24 cursor-pointer"
      download
      rel="noopener noreferrer"
    >
      <div
        className="h-24 text-red-500 w-full bg-gray-50 border border-gray-200 border-solid rounded
                   flex items-center justify-center"
        aria-hidden="true"
      >
        <FontAwesomeIcon
          icon={faFilePdf}
          className="h-14 w-14"
          aria-hidden="true"
        />
      </div>

      <span className="max-w-full break-words mt-1 mb-4 text-center">{title}</span>
    </a>
  );
}

PdfThumbnail.propTypes = {
  url: PropTypes.string.isRequired,
  title: PropTypes.string,
};
