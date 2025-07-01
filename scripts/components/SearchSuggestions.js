/* eslint-disable react/require-default-props */
import { forwardRef } from "react";
import PropTypes from "prop-types";
import config from "../config";

// helper: make the search term bold inside any string
const highlight = (text, needle = "") => {
  if (!needle) return text;
  const escaped = needle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return text.split(new RegExp(`(${escaped})`, "gi")).map((part, i) => (
    <span
      key={i}
      style={{
        fontWeight:
          part.toLowerCase() === needle.toLowerCase() ? "bold" : "normal",
      }}
    >
      {part}
    </span>
  ));
};

const SearchSuggestions = forwardRef(
  ({ search, groups, activeIdx, onClose }, ref) => {
    let runningIdx = -1;

    return (
      <ul
        className="suggestions"
        ref={ref}
        id="search-suggestions"
        role="listbox"
        aria-label="Sökförslag"
        aria-live="polite"
      >
        <span
          type="button"
          className="suggestions-close"
          onClick={onClose}
          aria-label="Stäng förslag"
        >
          &times;
        </span>

        {groups.map(
          ({
            title, // 'Person', 'Place', …
            label, // what we print above the list
            items, // array of suggestions
            click, // click-handler
            field, // value for data-field (optional)
            maxHeight = 175,
          }) => {
            const limit = config[`numberOf${title}Suggestions`];
            const trimmed = limit ? items.slice(0, limit) : items;

            if (!trimmed.length) return null;

            return (
              <div
                key={title}
                style={{ maxHeight, overflowY: "auto", listStyle: "none" }}
              >
                <span className="suggestions-label">{label}</span>

                {trimmed.map((item) => {
                  const currentIdx = ++runningIdx;
                  return (
                    <li
                      key={item.value}
                      id={`suggestion-${currentIdx}`}
                      className={`suggestions-item${
                        currentIdx === activeIdx ? " selected" : ""
                      }`}
                      tabIndex={0}
                      data-value={item.value}
                      data-field={field}
                      onClick={() => {
                        click(item);
                        onClose(); // same handler used by the ×-button
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          click(item);
                          onClose();
                        }
                      }}
                    >
                      {highlight(item.label, search)}
                      &nbsp;
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
                    </li>
                  );
                })}
              </div>
            );
          }
        )}
      </ul>
    );
  }
);

SearchSuggestions.displayName = "SearchSuggestions";

SearchSuggestions.propTypes = {
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

export default SearchSuggestions;
