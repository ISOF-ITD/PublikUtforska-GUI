import PropTypes from 'prop-types';
import { Link, useLocation } from 'react-router-dom';
import matkultLogo from '../../../img/matkult-logga.png';
import { isMatkultLocation } from '../../utils/collectionHelper';

export default function MatkultHeaderLink({ onClick = undefined }) {
  const location = useLocation();
  const active = isMatkultLocation(location);

  return (
    <Link
      to="/matkult"
      onClick={onClick}
      aria-current={location.pathname === '/matkult' ? 'page' : undefined}
      className={`header-keyboard-focus !m-0 inline-flex min-h-11 shrink-0 rounded-lg text-sm font-semibold no-underline hover:no-underline focus:no-underline print:hidden ${active ? '!text-[var(--color-matkult-text)]' : '!text-[var(--color-text-inverted)]'}`}
    >
      <span className={`box-border inline-flex min-h-[38px] items-center gap-2 whitespace-nowrap rounded border border-solid px-2.5 py-1.5 ${active ? 'border-[var(--color-matkult-accent)] bg-[var(--color-matkult-bg)] hover:brightness-95' : 'border-[rgb(var(--color-text-inverted-rgb)/0.35)] hover:bg-primary-hover'}`}>
        <img src={matkultLogo} alt="" aria-hidden="true" width="24" height="24" className="h-6 w-6 shrink-0 object-contain" />
        <span>Matkult</span>
      </span>
    </Link>
  );
}

MatkultHeaderLink.propTypes = { onClick: PropTypes.func };
