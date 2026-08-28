import classNames from 'classnames';
import PropTypes from 'prop-types';
import { useEffect, useState } from 'react';
import { NavLink, useLocation, useParams } from 'react-router-dom';
import { l } from '../lang/Lang';
import {
  createParamsFromSearchRoute,
  createSearchRoute,
} from '../utils/routeHelper';

const renderLabel = (label, isSelected) => (
  <>
    {isSelected && <span aria-hidden="true" className="sr-only">[Aktiv] </span>}
    {l(label)}
  </>
);

export default function FilterSwitch({
  mode = 'material',
  className = '',
  compact = false,
  resultView = null,
}) {
  const params = useParams();
  const location = useLocation();
  const sharedRoute = createSearchRoute(
    createParamsFromSearchRoute(params['*']),
  ).replace(/^\//, '');
  const sharedQuery = new URLSearchParams(location.search);
  sharedQuery.delete('media');
  sharedQuery.delete('record_ids');
  sharedQuery.delete('showlist');
  const sharedSearch = sharedQuery.toString();
  const navigationState = {
    ...(location.state || {}),
    mobileResultView: resultView,
  };

  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);

  // segmented-control container
  const container = classNames(
    'relative z-[1400]',
    'bg-transparent backdrop-blur',
    'transition-opacity duration-200',
    ready ? 'opacity-100' : 'opacity-0',
    'flex flex-row justify-center w-full',
    compact ? 'gap-1 px-3 pb-2' : '',
    className,
  );

  // shared button styles
  const base = classNames(
    'flex items-center justify-center px-3 text-center font-medium',
    'transition-colors duration-200 no-underline',
    'focus-visible:outline focus-visible:outline-2 focus-visible:outline-focus focus-visible:outline-offset-2',
    compact ? 'h-10 flex-1 rounded-md text-sm' : 'h-12 w-2/5 hover:underline',
  );

  const unselected = compact
    ? 'border border-white/70 bg-transparent !text-white hover:bg-darker-isof'
    : 'bg-[var(--color-mode-tab-unselected)] text-body hover:bg-surface-hover';
  const selected = classNames(
    'bg-surface text-body hover:bg-surface-hover font-semibold',
    compact ? 'border border-white' : '',
  );

  return (
    <nav
      aria-label={l('Välj arbetsläge')}
      data-focus-id="filter-switch"
      className={container}
    >
      <NavLink
        to={{
          pathname: `/${sharedRoute}`,
          search: sharedSearch ? `?${sharedSearch}` : '',
        }}
        state={navigationState}
        end
        className={({ isActive }) => [base, isActive || mode === 'material' ? selected : unselected].join(
          ' ',
        )}
      >
        {({ isActive }) => renderLabel('Arkivmaterial', isActive || mode === 'material')}
      </NavLink>

      <NavLink
        to={{
          pathname: `/transcribe/${sharedRoute}`,
          search: sharedSearch ? `?${sharedSearch}` : '',
        }}
        state={navigationState}
        className={({ isActive }) => [
          base,
          isActive || mode === 'transcribe' ? selected : unselected,
        ].join(' ')}
      >
        {({ isActive }) => renderLabel('Skriva av', isActive || mode === 'transcribe')}
      </NavLink>
    </nav>
  );
}

FilterSwitch.propTypes = {
  mode: PropTypes.string,
  className: PropTypes.string,
  compact: PropTypes.bool,
  resultView: PropTypes.oneOf(['map', 'list']),
};
