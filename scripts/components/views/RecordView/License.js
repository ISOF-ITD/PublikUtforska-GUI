import PropTypes from 'prop-types';
import config from '../../../config';

export default function License({ data }) {
  const {
    copyrightlicense,
  } = data;

  // Sätt standardvärdet om copyrightlicense är en tom sträng eller falsy
  const effectiveLicense = copyrightlicense
  || 'https://creativecommons.org/licenses/by-nd/2.5/se/';

  return (
    <div className="row">
      {
            config.siteOptions?.copyrightContent
            && (
              <div className="twelve columns">
                <div className="license" dangerouslySetInnerHTML={{ __html: config.siteOptions.copyrightContent[effectiveLicense] }} />
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
