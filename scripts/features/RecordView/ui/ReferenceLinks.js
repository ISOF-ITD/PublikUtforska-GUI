import PropTypes from "prop-types";
import ShareButtons from "./ShareButtons";
import config from "../../../config";
import { l } from "../../../lang/Lang";
import { buildCitation } from "../utils/licenseUtils";

export default function ReferenceLinks({ data }) {
  const { id } = data;
  const recordUrl = `${config.siteUrl}/records/${id}`;
  const citation = buildCitation(data);

  return (
    <div className="contents">
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
