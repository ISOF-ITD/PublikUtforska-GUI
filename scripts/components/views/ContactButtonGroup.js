import classNames from 'classnames';
import PropTypes from 'prop-types';

const baseContactButtonGroupClassName = [
  'feedback-button-group absolute right-0 top-0 z-10 flex',
  'items-start gap-3',
  'max-[550px]:static max-[550px]:mt-2 max-[550px]:w-full',
  'max-[550px]:justify-end',
  'max-[550px]:flex-wrap max-[550px]:gap-2',
].join(' ');

export default function ContactButtonGroup({
  children,
  className,
  role,
  ariaLabel,
}) {
  return (
    <div
      className={classNames(
        baseContactButtonGroupClassName,
        className,
      )}
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
