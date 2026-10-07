import { useId, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import config from '../../config';
import { l } from '../../lang/Lang';
import ContributeInfoButton from './ContributeInfoButton';
import ContributeInfoForm from './ContributeInfoForm';

export default function ContributeInfoSection({
  title,
  type,
  id = undefined,
  headingLevel = 'h3',
}) {
  const headingId = useId();
  const formId = useId();
  const formHeadingId = useId();
  const buttonRef = useRef(null);
  const [expanded, setExpanded] = useState(false);
  const Heading = headingLevel;
  const FormHeading = headingLevel === 'h2' ? 'h3' : 'h4';

  const closeForm = () => {
    setExpanded(false);
    requestAnimationFrame(() => buttonRef.current?.focus());
  };

  if (config.siteOptions.hideContactButton) return null;

  return (
    <section
      className="my-8 border-t border-border pt-5 text-body print:hidden"
      aria-labelledby={headingId}
    >
      <Heading id={headingId} className="text-xl font-bold mb-4">
        {l('Hjälp oss att förbättra informationen')}
      </Heading>
      <ContributeInfoButton
        expanded={expanded}
        controls={formId}
        onClick={() => setExpanded((value) => !value)}
        buttonRef={buttonRef}
        variant="inline"
      />
      <div id={formId} hidden={!expanded}>
        {expanded && (
          <div
            role="region"
            aria-labelledby={formHeadingId}
            className="mt-4 max-w-[46rem] rounded-md border border-border bg-surface p-4 shadow-sm"
          >
            <FormHeading id={formHeadingId} className="mb-3 text-lg font-bold text-body">
              {l('Vet du mer?')}
            </FormHeading>
            <ContributeInfoForm title={title} type={type} id={id} onClose={closeForm} />
          </div>
        )}
      </div>
    </section>
  );
}

ContributeInfoSection.propTypes = {
  title: PropTypes.string.isRequired,
  type: PropTypes.string.isRequired,
  id: PropTypes.string,
  headingLevel: PropTypes.oneOf(['h2', 'h3']),
};
