/* eslint-disable react/require-default-props */
import PropTypes from "prop-types";
import classNames from "classnames";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSquare, faSquareCheck } from "@fortawesome/free-solid-svg-icons";
import { l } from "../../../lang/Lang";

export function SearchFilters({
  filters,
  selectedCategories,
  onToggle,
  loading = false,
  disabled = false,
  compact = false,
  className = "",
}) {
  if (!filters?.length) return null;

  const filtersRowClass = compact
    ? 'flex flex-wrap items-center gap-2 pb-1 !text-white'
    : 'flex items-center gap-1 !text-white';
  let displayClass = 'flex';
  if (compact) displayClass = 'block';
  if (loading) displayClass = 'hidden';

  return (
    <div
      className={classNames(
        compact
          ? 'w-full p-2'
          : 'lg:ml-0 lg:text-base text-lg flex items-center gap-1 lg:flex-nowrap flex-wrap p-2',
        displayClass,
        className,
      )}
      aria-label={l('Begränsa sökningen till')}
    >
      <span className={classNames('whitespace-nowrap !text-white', compact ? 'block text-sm' : '')}>
        {l('Begränsa sökningen till: ')}
      </span>

      <div className={filtersRowClass}>
        {filters.map(({ label, categoryId, total }) => {
          const checked = selectedCategories.includes(categoryId);
          const count = total?.value ?? 0;
          const labelId = `${categoryId}-label`;

          const handleActivate = () => {
            if (disabled) return;
            onToggle?.(categoryId);
          };

          const onKeyDown = (e) => {
            if (disabled) return;
            if (e.key === " " || e.key === "Enter") {
              e.preventDefault();
              handleActivate();
            }
          };

          return (
            <div
              key={categoryId}
              className="flex items-center select-none align-middle overflow-visible outline-none p-0"
            >
              <button
                type="button"
                role="checkbox"
                aria-checked={checked}
                aria-labelledby={labelId}
                aria-disabled={disabled || undefined}
                disabled={disabled}
                onClick={handleActivate}
                onKeyDown={onKeyDown}
                className={classNames(
                  'inline-flex border-none items-center !m-0 gap-1 !text-white',
                  compact
                    ? 'rounded-full border border-solid border-white/60 bg-transparent px-2.5 py-1.5 hover:bg-darker-isof focus:bg-darker-isof'
                    : 'rounded-md !px-0 py-1',
                  disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer',
                )}
              >
                <FontAwesomeIcon
                  icon={checked ? faSquareCheck : faSquare}
                  className={classNames('text-white', compact ? 'h-4 w-4' : 'h-5 w-5')}
                  aria-hidden="true"
                />
                <span
                  id={labelId}
                  className={classNames('whitespace-nowrap text-sm', compact ? 'font-semibold' : '')}
                >
                  {l(label)}
                  {' '}
                  {`(${count})`}
                </span>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

SearchFilters.propTypes = {
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
