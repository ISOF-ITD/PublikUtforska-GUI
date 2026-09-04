/* eslint-disable react/require-default-props */
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faSquare } from '@fortawesome/free-solid-svg-icons';
import { l } from '../../../lang/Lang';

export function SearchFilters({
  children,
  filters,
  selectedCategories,
  onToggle,
  loading = false,
  disabled = false,
  compact = false,
  className = '',
}) {
  if (!filters?.length) return null;

  const filtersDisabled = disabled || loading;

  return (
    <div
      className={classNames(
        'search-filter-controls flex min-w-0 w-full flex-wrap items-center gap-2 px-2.5 py-2',
        loading ? 'opacity-70' : '',
        className,
      )}
      role="group"
      aria-label={l('Begränsa sökningen till')}
      aria-busy={loading || undefined}
    >
      <span className={classNames(
        'whitespace-nowrap !text-white text-sm',
        compact ? 'w-full' : '',
      )}
      >
        {l('Begränsa sökningen till: ')}
      </span>

      {filters.map(({ label, categoryId, total }) => {
        const checked = selectedCategories.includes(categoryId);
        const count = total?.value ?? 0;
        const labelId = `${categoryId}-label`;

        const handleActivate = () => {
          if (filtersDisabled) return;
          onToggle?.(categoryId);
        };

        const onKeyDown = (e) => {
          if (filtersDisabled) return;
          if (e.key === ' ' || e.key === 'Enter') {
            e.preventDefault();
            handleActivate();
          }
        };

        return (
          <button
            key={categoryId}
            type="button"
            role="checkbox"
            aria-checked={checked}
            aria-labelledby={labelId}
            aria-disabled={filtersDisabled || undefined}
            disabled={filtersDisabled}
            onClick={handleActivate}
            onKeyDown={onKeyDown}
            className={classNames(
              'inline-flex min-h-9 items-center gap-2 !m-0 border px-3 py-1.5 text-sm font-medium',
              'focus-visible:outline focus-visible:outline-2 focus-visible:outline-white focus-visible:outline-offset-2',
              checked
                ? 'border-border bg-surface !text-body hover:bg-surface-hover disabled:hover:bg-surface'
                : 'border-white/70 bg-transparent !text-white hover:bg-primary-hover disabled:hover:bg-transparent',
              filtersDisabled
                ? 'cursor-not-allowed opacity-60'
                : 'cursor-pointer',
            )}
          >
            {checked ? (
              <span
                className="relative inline-flex h-4 w-4 shrink-0 items-center justify-center"
                aria-hidden="true"
              >
                <FontAwesomeIcon
                  icon={faSquare}
                  className="absolute inset-0 h-full w-full text-[var(--color-search-filter-checkbox-checked-bg)]"
                />
                <FontAwesomeIcon
                  icon={faCheck}
                  className="relative h-3 w-3 text-[var(--color-search-filter-checkbox-check)]"
                />
              </span>
            ) : (
              <FontAwesomeIcon
                icon={faSquare}
                className="h-4 w-4 text-[var(--color-search-filter-checkbox)]"
                aria-hidden="true"
              />
            )}
            <span id={labelId} className="whitespace-nowrap">
              {l(label)}
              {' '}
              {`(${count})`}
            </span>
          </button>
        );
      })}

      {children}
    </div>
  );
}

SearchFilters.propTypes = {
  children: PropTypes.node,
  filters: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      categoryId: PropTypes.string.isRequired,
      total: PropTypes.object, // { value, relation }
    }),
  ).isRequired,
  selectedCategories: PropTypes.arrayOf(PropTypes.string).isRequired,
  /** Called with (categoryId) when toggled */
  onToggle: PropTypes.func.isRequired,
  loading: PropTypes.bool,
  disabled: PropTypes.bool,
  compact: PropTypes.bool,
  className: PropTypes.string,
};

export default SearchFilters;
