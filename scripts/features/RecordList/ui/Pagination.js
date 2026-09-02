import PropTypes from 'prop-types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faArrowRight } from '@fortawesome/free-solid-svg-icons';

import { l } from '../../../lang/Lang';
import config from '../../../config';

const { hitsPerPage, maxTotal } = config;

function buildPageWindow(current, max) {
  if (max <= 7) return [...Array(max)].map((_, index) => index + 1);

  const pageWindow = [1];
  if (current > 4) pageWindow.push('ellipsis-start');

  const start = Math.max(2, current - 1);
  const end = Math.min(max - 1, current + 1);

  for (let page = start; page <= end; page += 1) pageWindow.push(page);

  if (current < max - 3) pageWindow.push('ellipsis-end');
  pageWindow.push(max);
  return pageWindow;
}

function PageButton({
  label,
  onClick,
  disabled = false,
  active = false,
  icon = null,
  iconAfter = false,
  hideLabelBelow360 = false,
  className = '',
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={[
        'flex min-h-11 min-w-10 items-center justify-center gap-2 rounded border px-3 py-1',
        active
          ? 'border-primary bg-primary text-[var(--color-text-inverted)] hover:!text-[var(--color-text-inverted)]'
          : 'border-border bg-surface text-body hover:bg-surface-hover',
        disabled ? 'cursor-not-allowed opacity-40' : '',
        'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus',
        className,
      ].join(' ')}
      aria-current={active ? 'page' : undefined}
      aria-label={typeof label === 'number' ? `${l('Gå till sida')} ${label}` : label}
    >
      {icon && !iconAfter && <FontAwesomeIcon icon={icon} aria-hidden="true" />}
      <span className={hideLabelBelow360 ? 'sr-only min-[360px]:not-sr-only' : ''}>
        {label}
      </span>
      {icon && iconAfter && <FontAwesomeIcon icon={icon} aria-hidden="true" />}
    </button>
  );
}

PageButton.propTypes = {
  label: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  onClick: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
  active: PropTypes.bool,
  icon: PropTypes.shape({}),
  iconAfter: PropTypes.bool,
  hideLabelBelow360: PropTypes.bool,
  className: PropTypes.string,
};

export default function Pagination({
  currentPage,
  total,
  onStep,
  maxPage,
  showRange = false,
}) {
  if (total <= hitsPerPage) return null;

  const from = (currentPage - 1) * hitsPerPage + 1;
  const to = Math.min(currentPage * hitsPerPage, total);
  const pageWindow = buildPageWindow(currentPage, maxPage);
  const previousLabel = l('Föregående');
  const nextLabel = l('Nästa');
  const rangeLabel = `${total.toLocaleString('sv-SE')} ${l('sökträffar')}. ${l('Visar')} ${from}–${to}`;
  const pageStatus = `${l('Sida')} ${currentPage} ${l('av')} ${maxPage}`;

  return (
    <nav
      className={showRange ? 'mb-3 mt-1 text-sm' : 'mb-0 mt-6 text-sm'}
      aria-label={l('Paginering')}
    >
      {showRange && (
        <p className="m-0 mb-2 font-semibold text-muted">
          {rangeLabel}
        </p>
      )}

      <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 sm:hidden">
        <PageButton
          disabled={currentPage === 1}
          onClick={() => onStep(-1)}
          label={previousLabel}
          icon={faArrowLeft}
          hideLabelBelow360
          className="w-full px-2"
        />
        <span className="whitespace-nowrap px-1 text-center font-semibold text-body">
          {pageStatus}
        </span>
        <PageButton
          disabled={currentPage === maxPage}
          onClick={() => onStep(1)}
          label={nextLabel}
          icon={faArrowRight}
          iconAfter
          hideLabelBelow360
          className="w-full px-2"
        />
      </div>

      <div className="hidden flex-wrap items-center gap-1 sm:flex">
        <PageButton
          disabled={currentPage === 1}
          onClick={() => onStep(-1)}
          label={previousLabel}
          icon={faArrowLeft}
        />

        {pageWindow.map((page) => (
          typeof page === 'string' ? (
            <span key={page} className="px-2" aria-hidden="true">
              …
            </span>
          ) : (
            <PageButton
              key={page}
              active={page === currentPage}
              onClick={() => onStep(page - currentPage)}
              label={page}
            />
          )
        ))}

        <PageButton
          disabled={currentPage === maxPage}
          onClick={() => onStep(1)}
          label={nextLabel}
          icon={faArrowRight}
          iconAfter
        />
      </div>

      {total >= maxTotal && currentPage >= maxPage && (
        <p className="mb-0 mt-3 text-danger">
          {l(`Du har nått det maximala antalet sidor (${maxTotal.toLocaleString('sv-SE')} poster).`)}
        </p>
      )}
    </nav>
  );
}

Pagination.propTypes = {
  currentPage: PropTypes.number.isRequired,
  total: PropTypes.number.isRequired,
  onStep: PropTypes.func.isRequired,
  maxPage: PropTypes.number.isRequired,
  showRange: PropTypes.bool,
};
