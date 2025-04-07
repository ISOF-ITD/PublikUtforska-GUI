import React from "react";
import PropTypes from "prop-types";
import { l } from "../../../lang/Lang";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUserPen, faCommentDots } from "@fortawesome/free-solid-svg-icons";

function ContributorInfo({ transcribedby, comment, transcriptiondate }) {
  const hasContributor = !!transcribedby;
  const hasComments = !!comment;

  if (!hasContributor && !hasComments) return null;

  return (
    <div className="bg-gray-50 rounded-lg p-4 mt-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Transcribed By Section */}
        {hasContributor && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-isof">
              <FontAwesomeIcon icon={faUserPen} className="h-4 w-4" />
              <h3 className="font-semibold text-base m-0">
                {l("Transkriberad av")}
              </h3>
            </div>
            <div className="ml-6 space-y-1">
              <p className="m-0 text-gray-800">{transcribedby}</p>
              {transcriptiondate && (
                <p className="m-0 text-sm text-gray-600">
                  {new Date(transcriptiondate).toLocaleDateString()}
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
            <div
              className="ml-6 prose prose-sm text-gray-800"
              dangerouslySetInnerHTML={{
                __html: comment.split(";").join("<br/>"),
              }}
            />
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
