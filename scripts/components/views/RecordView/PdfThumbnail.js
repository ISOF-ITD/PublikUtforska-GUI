/* eslint-disable react/require-default-props */
import PropTypes from 'prop-types';

export default function PdfThumbnail({ url, title = '' }) {
  return (
    <a
      title="Öppna PDF"
      data-type="pdf"
      href={url}
      className="inline-block w-[115px] cursor-pointer"
      download
      rel="noopener noreferrer"
    >
      <div
        className="h-[115px] bg-[#fafbfc] bg-center bg-no-repeat bg-[length:55px_55px] bg-[url('/img/icon-pdf.png')] border border-[#eaeaea] border-solid rounded"
        role="img"
        aria-hidden="true"
      />
      <span className="max-w-full break-words mt-[5px] mb-[15px] text-center">{title}</span>
    </a>
  );
};
PdfThumbnail.propTypes = {
  url: PropTypes.string.isRequired,
  title: PropTypes.string,
};
