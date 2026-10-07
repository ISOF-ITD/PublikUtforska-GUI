import PropTypes from 'prop-types';
import { useCallback, useMemo } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFilePdf, faFileLines } from '@fortawesome/free-solid-svg-icons';
import config from '../../../config';
import { isImageMedia, isPdfMedia } from '../../../utils/mediaTypes';
import buildSegments from '../../../utils/buildSegments';
import { useDownloadAllText } from '../../RecordTextPanel/hooks/useDownloadAllText';

const downloadClassName = [
  'button button-secondary !m-0 !inline-flex !h-auto min-h-11 max-w-full',
  'items-center justify-center gap-2 !px-3 !py-2 !text-sm !leading-normal',
  '![font-family:inherit] !whitespace-normal focus-visible:outline focus-visible:outline-2',
  'focus-visible:outline-focus focus-visible:outline-offset-2',
].join(' ');

export default function RecordViewActions({ data }) {
  const pdfs = (data.media || []).filter(isPdfMedia);
  const images = useMemo(() => (data.media || []).filter(isImageMedia), [data.media]);
  const segments = useMemo(() => buildSegments({
    mediaImages: images,
    rawSegments: data.segments,
    transcriptionstatus: data.transcriptionstatus,
    persons: data.persons,
  }), [images, data.segments, data.transcriptionstatus, data.persons]);
  const getPersonsForPage = useCallback((pageIndex) => (
    segments.find((segment) => pageIndex >= segment.startIndex
      && pageIndex < segment.startIndex + segment.items.length)?.persons || []
  ), [segments]);
  const { textPages, handleDownloadAllText } = useDownloadAllText({
    isPageByPage: true,
    mediaImages: images,
    title: data.title,
    recordId: data.id,
    getPersonsForPage,
  });
  if (!pdfs.length && !textPages.length) return null;
  return (
    <div role="group" aria-label="Ladda ner material" className="my-4 flex flex-wrap items-center gap-3">
      {pdfs.map((pdf, index) => {
        const url = `${config.pdfUrl || config.imageUrl || ''}${pdf.source || ''}`
          .replace(/([^:]\/)\/+/g, '$1');
        return (
          <a key={pdf.source} href={url} download className={downloadClassName}>
            <FontAwesomeIcon icon={faFilePdf} aria-hidden="true" focusable="false" className="h-4 w-4 shrink-0" />
            <span className="min-w-0 break-words">
              {pdfs.length === 1 ? 'Ladda ner PDF'
                : `Ladda ner PDF ${index + 1}: ${pdf.title || pdf.source.split('/').pop()}`}
            </span>
          </a>
        );
      })}
      {textPages.length > 0 && (
        <button
          type="button"
          className={downloadClassName}
          onClick={handleDownloadAllText}
        >
          <FontAwesomeIcon icon={faFileLines} aria-hidden="true" focusable="false" className="h-4 w-4 shrink-0" />
          <span className="min-w-0 break-words">Ladda ner text (.txt)</span>
        </button>
      )}
    </div>
  );
}

RecordViewActions.propTypes = {
  data: PropTypes.object.isRequired,
};
