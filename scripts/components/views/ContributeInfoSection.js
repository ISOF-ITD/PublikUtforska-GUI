import { useId } from 'react';
import PropTypes from 'prop-types';
import config from '../../config';
import { l } from '../../lang/Lang';
import ContributeInfoButton from './ContributeInfoButton';

export default function ContributeInfoSection({
  title,
  type,
  country = undefined,
  id = undefined,
}) {
  const headingId = useId();

  if (config.siteOptions.hideContactButton) return null;

  return (
    <section
      className="my-8 border-t border-border pt-5 text-body print:hidden"
      aria-labelledby={headingId}
    >
      <h3 id={headingId} className="text-xl font-bold mb-4">
        {l('Hjälp oss förbättra informationen')}
      </h3>
      <ContributeInfoButton
        title={title}
        type={type}
        country={country}
        id={id}
        variant="inline"
      />
    </section>
  );
}

ContributeInfoSection.propTypes = {
  title: PropTypes.string.isRequired,
  type: PropTypes.string.isRequired,
  country: PropTypes.string,
  id: PropTypes.string,
};
