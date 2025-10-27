/* eslint-disable react/require-default-props */
import PropTypes from "prop-types";
import classNames from "classnames";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSquare, faSquareCheck } from "@fortawesome/free-solid-svg-icons";
import { l } from "../lang/Lang";

export default function SearchFilters({
  filters,
  selectedCategories,
  onToggle,
  loading = false,
  disabled = false,
  className = "",
}) {
  if (!filters?.length) return null;

  return (
    <div
      className={classNames(
        "lg:ml-0 lg:text-base text-lg flex items-center gap-1 lg:flex-nowrap flex-wrap p-2",
        loading ? "hidden" : "flex",
        className
      )}
      aria-label={l("Begränsa sökningen till")}
    >
      <span className="whitespace-nowrap !text-white">
        {l("Begränsa sökningen till: ")}
      </span>

      <div className="flex items-center gap-1 !text-white">
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
              className="flex items-center select-none align-middle overflow-visible outline-none p-0 shrink-0"
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
                  "inline-flex border-none items-center !m-0 gap-1 rounded-md !px-0 py-1 !text-white",
                  disabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer"
                )}
              >
                <FontAwesomeIcon
                  icon={checked ? faSquareCheck : faSquare}
                  className="h-6 w-6 text-white"
                  aria-hidden="true"
                />
                <span id={labelId} className="whitespace-nowrap text-sm">
                  {l(label)} {`(${count})`}
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
    })
  ).isRequired,
  selectedCategories: PropTypes.arrayOf(PropTypes.string).isRequired,
  /** Called with (categoryId) when toggled */
  onToggle: PropTypes.func.isRequired,
  loading: PropTypes.bool,
  disabled: PropTypes.bool,
  className: PropTypes.string,
};
