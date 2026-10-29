import PropTypes from "prop-types";
import ShareButtons from "./ShareButtons";
import config from "../../../config";
import { l } from "../../../lang/Lang";
import { buildCitation } from "../utils/licenseUtils";
import { createDetailLocation } from '../../../utils/routeHelper';

export default function ReferenceLinks({ data }) {
  const { id } = data;
  const recordUrl = `${config.siteUrl}${createDetailLocation({
    resource: 'records', id, search: data.materialtype === 'matkarta' ? '?theme=matkult' : '',
  })}`;
  const citation = buildCitation(data);

  return (
    <div className="contents">
      <ShareButtons
        title={l('Länk till accessionen')}
        copyLabel={l('Kopiera länk till urklipp')}
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
    materialtype: PropTypes.string,
    archive: PropTypes.shape({
      archive_id: PropTypes.string.isRequired,
      archive_org: PropTypes.string,
    }).isRequired,
  }).isRequired,
};
