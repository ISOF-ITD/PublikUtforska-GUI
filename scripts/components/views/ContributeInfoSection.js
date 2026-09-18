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
}) {
  const headingId = useId();
  const formId = useId();
  const formHeadingId = useId();
  const buttonRef = useRef(null);
  const [expanded, setExpanded] = useState(false);

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
      <h3 id={headingId} className="text-xl font-bold mb-4">
        {l('Hjälp oss att förbättra informationen')}
      </h3>
      <ContributeInfoButton
        expanded={expanded}
        controls={formId}
        onClick={() => setExpanded((value) => !value)}
        buttonRef={buttonRef}
        variant="inline"
      />
      {expanded && (
        <div
          id={formId}
          role="region"
          aria-labelledby={formHeadingId}
          className="mt-4 max-w-[46rem] rounded-md border border-border bg-surface p-4 shadow-sm"
        >
          <h4 id={formHeadingId} className="mb-3 text-lg font-bold text-body">
            {l('Vet du mer?')}
          </h4>
          <ContributeInfoForm title={title} type={type} id={id} onClose={closeForm} />
        </div>
      )}
    </section>
  );
}

ContributeInfoSection.propTypes = {
  title: PropTypes.string.isRequired,
  type: PropTypes.string.isRequired,
  id: PropTypes.string,
};
