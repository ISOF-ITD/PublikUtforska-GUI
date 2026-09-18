/* eslint-disable react/require-default-props */
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faSquare } from '@fortawesome/free-solid-svg-icons';
import { l } from '../../../lang/Lang';

function SearchFilterCheckbox({
  id,
  label,
  checked,
  onChange,
  count,
  disabled = false,
}) {
  const inputId = `search-filter-${id}`;

  return (
    <label
      htmlFor={inputId}
      className={classNames(
        'relative inline-flex min-h-9 items-center gap-2 rounded-[3px] !m-0 border px-3 py-1.5 text-sm font-medium',
        checked
          ? 'border-border bg-surface !text-body'
          : 'border-white/70 bg-transparent !text-white',
        !disabled && (checked ? 'hover:bg-surface-hover' : 'hover:bg-primary-hover'),
        disabled
          ? 'cursor-not-allowed opacity-60'
          : 'cursor-pointer',
      )}
    >
      <input
        id={inputId}
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={({ target }) => onChange(target.checked)}
        className="peer sr-only"
      />
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
      <span className="whitespace-nowrap">
        {l(label)}
        {count !== undefined && (
          <>
            {' '}
            {`(${count})`}
          </>
        )}
      </span>
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rounded-[3px] peer-focus-visible:outline peer-focus-visible:outline-[3px] peer-focus-visible:outline-white peer-focus-visible:outline-offset-2"
      />
    </label>
  );
}

SearchFilterCheckbox.propTypes = {
  id: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  checked: PropTypes.bool.isRequired,
  onChange: PropTypes.func.isRequired,
  count: PropTypes.number,
  disabled: PropTypes.bool,
};

export function SearchFilters({
  children,
  filters,
  loading = false,
  className = '',
}) {
  if (!filters?.length) return null;

  return (
    <fieldset
      className={classNames(
        'search-filter-controls !mb-0 flex min-w-0 w-full flex-wrap items-center gap-2 border-0 px-2.5 py-2',
        className,
      )}
      aria-busy={loading || undefined}
    >
      <legend className="sr-only">
        {l('Begränsa sökningen till')}
      </legend>
      {filters.map((filter) => (
        <SearchFilterCheckbox
          key={filter.id}
          id={filter.id}
          label={filter.label}
          checked={filter.checked}
          onChange={filter.onChange}
          count={filter.count}
          disabled={filter.disabled}
        />
      ))}

      {children}
    </fieldset>
  );
}

SearchFilters.propTypes = {
  children: PropTypes.node,
  filters: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      checked: PropTypes.bool.isRequired,
      onChange: PropTypes.func.isRequired,
      count: PropTypes.number,
      disabled: PropTypes.bool,
    }),
  ).isRequired,
  loading: PropTypes.bool,
  className: PropTypes.string,
};

export default SearchFilters;
