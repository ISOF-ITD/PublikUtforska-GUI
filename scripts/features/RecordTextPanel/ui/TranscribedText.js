import PropTypes from "prop-types";

export default function TranscribedText({
  html,
  expanded,
  onToggle,
  contentId,
}) {
  return (
    <div className="relative">
      <div
        id={contentId}
        aria-expanded={expanded}
        className={
          "text-pretty prose prose-sm max-w-none text-gray-800 whitespace-pre-wrap break-words " +
          (expanded ? "" : "overflow-hidden")
        }
        dangerouslySetInnerHTML={{ __html: html || "&nbsp;" }}
      />
    </div>
  );
}
TranscribedText.propTypes = {
  html: PropTypes.string,
  expanded: PropTypes.bool,
  onToggle: PropTypes.func.isRequired,
  contentId: PropTypes.string.isRequired,
};
