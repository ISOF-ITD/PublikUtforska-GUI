import React from "react";
import PropTypes from "prop-types";
import ShareButtons from "./ShareButtons";
import config from "../../../config";
import { l } from "../../../lang/Lang";
import {
  makeArchiveIdHumanReadable,
  getPages,
  getArchiveName,
} from "../../../utils/helpers";

function buildCitation(data) {
  const {
    archive: { archive_id: archiveId, archive_org: archiveOrg },
  } = data;

  const pages = getPages(data);
  const idHuman = makeArchiveIdHumanReadable(archiveId, archiveOrg);
  const orgName = getArchiveName(archiveOrg);

  // Example: "A123:45, s. 12–14, Arkivnamn"
  return `${idHuman}${pages ? `, s. ${pages}` : ""}, ${orgName}`;
}

export default function ReferenceLinks({ data }) {
  const { id } = data;
  const recordUrl = `${config.siteUrl}/records/${id}`;
  const citation = buildCitation(data);

  return (
    <div
      className="w-full lg:w-2/3 grid grid-cols-1 md:grid-cols-2 gap-2 h-full
+                  [grid-auto-rows:1fr]"
    >
      <ShareButtons
        title={l("Kopiera länk")}
        text={recordUrl}
        breakAll={true}
      />

      <ShareButtons
        title={l("Källhänvisning")}
        text={citation}
        breakAll={false}
      />
    </div>
  );
}

ReferenceLinks.propTypes = {
  data: PropTypes.shape({
    id: PropTypes.string.isRequired,
    archive: PropTypes.shape({
      archive_id: PropTypes.string.isRequired,
      archive_org: PropTypes.string.isRequired,
    }).isRequired,
  }).isRequired,
};
