import { faUtensils } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import PropTypes from 'prop-types';
import { Link, useLocation } from 'react-router-dom';
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
      <span className={`box-border inline-flex min-h-[38px] items-center gap-2 whitespace-nowrap rounded border border-solid px-2.5 py-2 ${active ? 'border-[var(--color-matkult-accent)] bg-[var(--color-matkult-bg)] hover:brightness-95' : 'border-[rgb(var(--color-text-inverted-rgb)/0.35)] hover:bg-primary-hover'}`}>
        <FontAwesomeIcon icon={faUtensils} aria-hidden="true" className="h-4 w-4" />
        <span>Matkult</span>
      </span>
    </Link>
  );
}

MatkultHeaderLink.propTypes = { onClick: PropTypes.func };
