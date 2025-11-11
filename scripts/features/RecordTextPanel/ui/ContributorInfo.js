import React from "react";
import PropTypes from "prop-types";
import { l } from "../../../lang/Lang";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUserPen, faCommentDots } from "@fortawesome/free-solid-svg-icons";
import sanitizeHtml from "../../../utils/sanitizeHtml";

function ContributorInfo({ transcribedby, comment, transcriptiondate }) {
  const hasContributor = !!transcribedby;
  const hasComments = !!comment;

  if (!hasContributor && !hasComments) return null;

  // Split on semicolons OR line breaks, trim empties
  const commentItems = (comment || "")
    .split(/;|\r?\n/g)
    .map((s) => s.trim())
    .filter(Boolean);

  return (
    <div className="bg-gray-50 rounded-lg p-4 mt-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Transcribed By Section */}
        {hasContributor && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-isof">
              <FontAwesomeIcon icon={faUserPen} className="h-4 w-4" />
              <h3 className="font-semibold text-base m-0">
                {l("Bidrag av")}
              </h3>
            </div>
            <div className="ml-6 space-y-1">
              <p className="m-0 text-gray-800">{transcribedby}</p>
              {transcriptiondate && (
                <p className="m-0 text-sm text-gray-600">
                  {new Date(transcriptiondate).toLocaleDateString("sv-SE")}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Comments Section */}
        {hasComments && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-isof">
              <FontAwesomeIcon icon={faCommentDots} className="h-4 w-4" />
              <h3 className="font-semibold text-base m-0">
                {l("Kommentarer")}
              </h3>
            </div>

            {commentItems.length > 0 ? (
              <ul className="ml-6 list-disc text-sm text-gray-800 space-y-1">
                {commentItems.map((item, i) => (
                  <li
                    key={i}
                    dangerouslySetInnerHTML={{ __html: sanitizeHtml(item) }}
                  />
                ))}
              </ul>
            ) : (
              <span className="ml-6 m-0 text-gray-800">
                {l("Inga kommentarer.")}
              </span>
            )}
          </div>
        )}
      </div>
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
    <div className="mt-2 border-t border-gray-100 pt-2 text-xs text-gray-600 space-y-1">
      {transcribedby && (
        <span className="m-0 flex items-center gap-1">
          <FontAwesomeIcon icon={faUserPen} />
          <span className="font-medium">Bidrag av:</span> {transcribedby}
          {dateStr ? ` • ${dateStr}` : null}
        </span>
      )}
    </div>
  );
}

PageContributor.propTypes = {
  transcribedby: PropTypes.string,
  transcriptiondate: PropTypes.string,
  comment: PropTypes.string,
};
