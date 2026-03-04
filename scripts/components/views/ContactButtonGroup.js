import classNames from 'classnames';
import PropTypes from 'prop-types';

const contactButtonGroupClassName = [
  'feedback-button-group absolute right-36 top-0 z-[3000] flex',
  'items-start gap-3',
  '[&_.feedback-button]:!static [&_.feedback-button]:!right-auto',
  '[&_.feedback-button]:!left-auto [&_.feedback-button]:!top-auto',
  '[&_.feedback-button]:!bottom-auto [&_.feedback-button]:!m-0',
  '[&_.feedback-button]:!transform-none',
  'max-[550px]:static max-[550px]:mt-2 max-[550px]:w-full',
  'max-[550px]:right-auto max-[550px]:justify-end',
  'max-[550px]:flex-wrap max-[550px]:gap-2',
  'max-[550px]:[&_.feedback-button]:!rounded',
  'max-[550px]:[&_.feedback-button]:!px-3',
  'max-[550px]:[&_.feedback-button]:!py-2',
].join(' ');

export default function ContactButtonGroup({
  children,
  className,
  role,
  ariaLabel,
}) {
  return (
    <div
      className={classNames(contactButtonGroupClassName, className)}
      role={role}
      aria-label={ariaLabel}
    >
      {children}
    </div>
  );
}

ContactButtonGroup.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
  role: PropTypes.string,
  ariaLabel: PropTypes.string,
};
