/* eslint-disable react/require-default-props */
import { forwardRef } from "react";
import PropTypes from "prop-types";
import config from "../../../config";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faClose } from "@fortawesome/free-solid-svg-icons";
import classNames from "classnames";

// helper: make the search term bold inside any string
const highlight = (text, needle = "") => {
  if (!needle) return text;
  const escaped = needle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return text.split(new RegExp(`(${escaped})`, "gi")).map((part, i) => (
    <span
      key={i}
      className={classNames(
        part.toLowerCase() === needle.toLowerCase()
          ? "font-bold"
          : "font-normal",
        part.toLowerCase() === needle.toLowerCase()
          ? "bg-yellow-100 rounded-sm"
          : "",
        part.toLowerCase() === needle.toLowerCase() ? "py-0.5 px-0.5" : ""
      )}
    >
      {part}
    </span>
  ));
};

const SuggestionsPopover = forwardRef(
  ({ search, groups, activeIdx, onClose }, ref) => {
    let runningIdx = -1;

    return (
      <div
        ref={ref}
        id="search-suggestions-container"
        className="absolute left-0 right-0 top-full mt-2 w-full rounded-lg border border-gray-200 bg-white shadow-lg z-[2100] pointer-events-auto overflow-hidden"
      >
        <button
          type="button"
          className="absolute z-[2000] right-3 !p-2 !border-none top-3 cursor-pointer !text-gray-500 text-xl leading-none  rounded"
          onClick={onClose}
          aria-label="Stäng förslag"
        >
          <FontAwesomeIcon icon={faClose} />
        </button>

        <div
          id="search-suggestions"
          role="listbox"
          aria-label="Sökförslag"
          aria-live="polite"
          className="max-h-96 overflow-y-auto py-1"
        >
          {groups.map(
            ({ title, label, items, click, field, maxHeight = 175 }) => {
              const limit = config[`numberOf${title}Suggestions`];
              const trimmed = limit ? items.slice(0, limit) : items;
              if (!trimmed.length) return null;

              return (
                <div
                  key={title}
                  role="group"
                  aria-label={label}
                  className="py-1"
                  style={{ maxHeight }}
                >
                  <div className="px-4 pt-2 pb-1 text-[11px] uppercase tracking-wide text-gray-500 sticky top-0 bg-white">
                    {label}
                  </div>

                  {trimmed.map((item) => {
                    const currentIdx = ++runningIdx;
                    const isActive = currentIdx === activeIdx;

                    return (
                      <div
                        key={item.value}
                        id={`suggestion-${currentIdx}`}
                        role="option"
                        aria-selected={isActive}
                        tabIndex={-1}
                        className={`px-4 py-2 cursor-pointer hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded ${
                          isActive ? "bg-gray-100" : ""
                        }`}
                        // prevent input blur before we handle the click
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => {
                          click(item);
                          onClose();
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            click(item);
                            onClose();
                          }
                        }}
                        data-value={item.value}
                        data-field={field}
                      >
                        {highlight(item.label, search)}
                        {item.secondaryLabel && (
                          <>
                            &nbsp;
                            <small>
                              {highlight(item.secondaryLabel, search)}
                            </small>
                          </>
                        )}
                        {item.comment &&
                          item.comment
                            .toLowerCase()
                            .includes(search.toLowerCase()) && (
                            <>
                              <br />
                              <small>{highlight(item.comment, search)}</small>
                            </>
                          )}
                      </div>
                    );
                  })}
                </div>
              );
            }
          )}
        </div>
      </div>
    );
  }
);

SuggestionsPopover.displayName = "SearchSuggestions";

SuggestionsPopover.propTypes = {
  search: PropTypes.string,
  onClose: PropTypes.func.isRequired,
  groups: PropTypes.arrayOf(
    PropTypes.shape({
      title: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      items: PropTypes.arrayOf(
        PropTypes.shape({
          value: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
            .isRequired,
          label: PropTypes.string.isRequired,
          secondaryLabel: PropTypes.string,
          comment: PropTypes.string,
        })
      ).isRequired,
      click: PropTypes.func.isRequired,
      field: PropTypes.string,
      maxHeight: PropTypes.number,
    })
  ).isRequired,
  activeIdx: PropTypes.number.isRequired,
};

export default SuggestionsPopover;
