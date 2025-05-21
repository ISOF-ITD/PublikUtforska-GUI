import PropTypes from 'prop-types';
import PdfViewer from '../../PdfViewer';
import config from '../../../config';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDownload } from '@fortawesome/free-solid-svg-icons';

export default function PdfElement({ data }) {
  const { media = [] } = data;
  const baseUrl = config.pdfUrl || config.imageUrl;

  const pdfObjects = media.filter((item) => item.type === 'pdf');
  if (pdfObjects.length === 0) {
    return null;
  }

  return (
    <>
      {/* visa inte i mobilläge */}
      <div className="row hidden md:block">
        {
          pdfObjects.map((pdfObject) => (
            <div className={`${pdfObjects.length > 1 ? 'six' : 'twelve'} columns`} key={`pdf-${pdfObject.source}`}>
              <PdfViewer
                height="100%"
                url={baseUrl + pdfObject.source}
              />
            </div>
          ))
        }
      </div>
      <div className="row">
        <div className="twelve columns pdf-wrapper">
          {
            pdfObjects.map((pdfObject) => {
              const titleString = pdfObject.title || pdfObject.source.split('/').pop();
              return (
                <a
                  data-type="pdf"
                  href={baseUrl + pdfObject.source}
                  key={`pdf-${pdfObject.source}`}
                  className="archive-image pdf"
                  download
                >
                  <div className="pdf-icon-container">
                    <div className="pdf-icon" title={titleString} />
                    <div className="media-title">
                      {titleString}
                    </div>
                  </div>
                </a>
              );
            })
          }
        </div>
      </div>
    </>
  );
}

PdfElement.propTypes = {
  data: PropTypes.shape({
    media: PropTypes.arrayOf(PropTypes.shape({
      type: PropTypes.string.isRequired,
      source: PropTypes.string.isRequired,
    })),
  }).isRequired,
};
