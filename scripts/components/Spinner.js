/* eslint-disable react/require-default-props */
import PropTypes from 'prop-types';
import classNames from 'classnames';

export default function Spinner({
  size = 'md',
  label = 'Laddar…',
  className,
  decorative = false,
}) {
  const sizeCls = {
    xs: 'h-4 w-4 border',
    sm: 'h-5 w-5 border-2',
    md: 'h-6 w-6 border-2',
    lg: 'h-8 w-8 border-2',
    xl: 'h-10 w-10 border-4',
  }[size];

  return (
    <div
      className={classNames('inline-flex items-center gap-2', className)}
      role={decorative ? undefined : 'status'}
      aria-live={decorative ? undefined : 'polite'}
      aria-busy={decorative ? undefined : 'true'}
      aria-hidden={decorative || undefined}
    >
      {/* Ring spinner using the current text color */}
      <span
        aria-hidden="true"
        className={classNames(
          'inline-block rounded-full border-current border-t-transparent motion-safe:animate-spin motion-reduce:animate-none',
          sizeCls,
        )}
      />
      {!decorative && <span className="sr-only">{label}</span>}
    </div>
  );
}

Spinner.propTypes = {
  size: PropTypes.oneOf(['xs', 'sm', 'md', 'lg', 'xl']),
  label: PropTypes.string,
  className: PropTypes.string,
  decorative: PropTypes.bool,
};
