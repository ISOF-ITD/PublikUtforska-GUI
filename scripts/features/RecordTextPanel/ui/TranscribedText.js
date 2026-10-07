import PropTypes from 'prop-types';

export default function TranscribedText({ html, contentId }) {
  return (
    <div
      id={contentId}
      className="text-pretty prose prose-sm max-w-none break-words whitespace-pre-wrap text-sm text-body"
      dangerouslySetInnerHTML={{ __html: html || '' }}
    />
  );
}

TranscribedText.propTypes = {
  html: PropTypes.string,
  contentId: PropTypes.string.isRequired,
};
