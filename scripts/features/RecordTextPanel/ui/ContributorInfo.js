import PropTypes from "prop-types";
import { l } from "../../../lang/Lang";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUserPen, faCommentDots } from "@fortawesome/free-solid-svg-icons";
import sanitizeHtml from "../../../utils/sanitizeHtml";

function ContributorInfo({ transcribedby, comment, transcriptiondate }) {
  const hasContributor = !!transcribedby;
  const hasComments = !!comment && comment.trim() !== "" && comment.trim() !== "None"

  if (!hasContributor && !hasComments) return null;

  // Split on semicolons OR line breaks, trim empties
  const commentItems = (comment || "")
    .split(/;|\r?\n/g)
    .map((s) => s.trim())
    .filter(Boolean);

  return (
    <div className="bg-surface-muted rounded-lg p-4 mt-4">
      <dl className="m-0 grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Transcribed By Section */}
        {hasContributor && (
          <div className="space-y-2">
            <dt className="flex items-center gap-2 font-semibold text-base text-body">
              <FontAwesomeIcon icon={faUserPen} className="h-4 w-4" aria-hidden="true" />
              {l('Bidrag av')}
            </dt>
            <dd className="m-0 ml-6 space-y-1">
              <p className="m-0 text-body">{transcribedby}</p>
            </dd>
          </div>
        )}
        {hasContributor && transcriptiondate && (
          <div className="space-y-2">
            <dt className="font-semibold text-base text-body">{l('Datum')}</dt>
            <dd className="m-0 text-sm text-muted">
              {new Date(transcriptiondate).toLocaleDateString('sv-SE')}
            </dd>
          </div>
        )}

        {/* Comments Section */}
        {hasComments && (
          <div className="space-y-2">
            <dt className="flex items-center gap-2 font-semibold text-base text-body">
              <FontAwesomeIcon icon={faCommentDots} className="h-4 w-4" aria-hidden="true" />
              {l('Kommentarer')}
            </dt>
            <dd className="m-0">
              {commentItems.length > 0 ? (
                <ul className="ml-6 list-disc text-sm text-body space-y-1">
                  {commentItems.map((item, i) => (
                    <li
                      key={i}
                      dangerouslySetInnerHTML={{ __html: sanitizeHtml(item) }}
                    />
                  ))}
                </ul>
              ) : (
                <span className="ml-6 m-0 text-body">
                  {l('Inga kommentarer.')}
                </span>
              )}
            </dd>
          </div>
        )}
      </dl>
    </div>
  );
}

ContributorInfo.propTypes = {
  transcribedby: PropTypes.string,
  comment: PropTypes.string,
  transcriptiondate: PropTypes.string,
};

export default ContributorInfo;

// Current ContributorInfo is great for the whole record, but it’s visually heavy for “every page”. So it is a tiny variant.

export function PageContributor({ transcribedby, transcriptiondate, comment }) {
  if (!transcribedby && !comment) return null;

  const dateStr = transcriptiondate
    ? new Date(transcriptiondate).toLocaleDateString("sv-SE")
    : null;

  return (
    <dl className="m-0 mt-2 border-t border-border pt-2 text-xs text-muted space-y-1">
      {transcribedby && (
        <div className="flex flex-wrap items-baseline gap-x-1">
          <dt className="font-medium">
            <FontAwesomeIcon icon={faUserPen} aria-hidden="true" />
            {' '}
            {l('Bidrag av')}
          </dt>
          <dd className="m-0">{transcribedby}</dd>
        </div>
      )}
      {transcribedby && dateStr && (
        <div className="flex flex-wrap items-baseline gap-x-1">
          <dt className="font-medium">{l('Datum')}</dt>
          <dd className="m-0">{dateStr}</dd>
        </div>
      )}
      {comment && (
        <div>
          <dt className="font-medium">{l('Kommentarer')}</dt>
          <dd className="m-0" dangerouslySetInnerHTML={{ __html: sanitizeHtml(comment) }} />
        </div>
      )}
    </dl>
  );
}

PageContributor.propTypes = {
  transcribedby: PropTypes.string,
  transcriptiondate: PropTypes.string,
  comment: PropTypes.string,
};
