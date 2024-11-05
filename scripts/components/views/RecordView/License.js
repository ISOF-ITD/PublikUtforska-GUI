import config from '../../../config';
import PropTypes from 'prop-types';

export default function License({ data }) {
  const {
    copyrightlicense = 'https://creativecommons.org/licenses/by-nd/2.5/se/',
  } = data;

  return (
    <div className="row">
      {
            config.siteOptions && config.siteOptions.copyrightContent && copyrightlicense
            && (
              <div className="twelve columns">
                <div className="license" dangerouslySetInnerHTML={{ __html: config.siteOptions.copyrightContent[copyrightlicense] }} />
              </div>
            )
          }

    </div>
  );
}

License.propTypes = {
  data: PropTypes.shape({
    copyrightlicense: PropTypes.string, // Typen för `copyrightlicense`, som är en sträng
  }).isRequired,
};
