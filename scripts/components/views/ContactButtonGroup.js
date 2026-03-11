import { useContext } from 'react';
import classNames from 'classnames';
import PropTypes from 'prop-types';
import { useLocation } from 'react-router-dom';
import { NavigationContext } from '../../NavigationContext';

const baseContactButtonGroupClassName = [
  'feedback-button-group absolute top-0 z-[3200] flex',
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
  const { pathname } = useLocation();
  const { previousNavigation } = useContext(NavigationContext);
  const shouldReserveBackButtonSpace = previousNavigation
    || /\/audio\/[^/]+\/transcribe\/?$/.test(pathname);

  return (
    <div
      className={classNames(
        baseContactButtonGroupClassName,
        shouldReserveBackButtonSpace ? 'right-[127px]' : 'right-[95px]',
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
