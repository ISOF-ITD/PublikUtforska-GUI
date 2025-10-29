import { useCallback, useEffect, useRef, useState } from "react";
import PropTypes from "prop-types";
import classNames from "classnames";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faClose, faList } from "@fortawesome/free-solid-svg-icons";
import { l } from "../../lang/Lang";
import { createParamsFromSearchRoute } from "../../utils/routeHelper";
import useAutocomplete from "./hooks/useAutocomplete";
import useDebouncedCallback from "./hooks/useDebouncedCallback";
import SuggestionsPopover from "./ui/SuggestionsPopover";
import SearchFilters from "./ui/SearchFilters";
import usePopularQueries from "./hooks/usePopularQueries";
import useSearchRouting from "./hooks/useSearchRouting";
import useSelectionFromRoute from "./hooks/useSelectionFromRoute";
import useSuggestionGroups from "./hooks/useSuggestionGroups";
import useSuggestionKeyboard from "./hooks/useSuggestionKeyboard";

export default function SearchPanel({
  mode,
  params,
  recordsData,
  audioRecordsData,
  pictureRecordsData,
  loading,
}) {
  const {
    query: qParam,
    search_field,
    category,
  } = createParamsFromSearchRoute(params["*"]);

  // state
  const inputRef = useRef(null);
  const [inputValue, setInputValue] = useState(qParam ?? "");
  const [query, setQuery] = useState(qParam ?? "");
  const [categories, setCategories] = useState(
    category ? category.split(",") : []
  );
  const [suggestionsVisible, setSuggestionsVisible] = useState(false);

  // totals
  const total = recordsData?.metadata?.total ?? { value: 0, relation: "eq" };
  const audioTotal = audioRecordsData?.metadata?.total ?? {
    value: 0,
    relation: "eq",
  };
  const pictureTotal = pictureRecordsData?.metadata?.total ?? {
    value: 0,
    relation: "eq",
  };

  // data
  const { people, places, provinces, archives } = useAutocomplete(query);
  const popularQueries = usePopularQueries(suggestionsVisible);

  // routing helpers
  const { navigateToSearch, toggleCategory } = useSearchRouting({
    mode,
    search_field,
    categories,
    setCategories,
  });

  // selection derived from route
  const {
    selectedPerson,
    selectedPlace,
    hasSelection,
    labelPrefix,
    labelValue,
    setSelectedPerson,
    setSelectedPlace,
  } = useSelectionFromRoute(qParam, search_field);

  // suggestions model
  const { visibleSuggestionGroups, flatSuggestions, hasSuggestions } =
    useSuggestionGroups({
      query,
      popularQueries,
      people,
      places,
      provinces,
      archives,
      navigateToSearch,
    });

  // keyboard nav
  const { activeIdx } = useSuggestionKeyboard({
    enabled: suggestionsVisible,
    flatSuggestions,
    onPick: (run) => {
      run();
      setSuggestionsVisible(false);
    },
  });

  // input handlers
  const debouncedChange = useDebouncedCallback(setQuery);
  const onInput = ({ target }) => {
    const { value } = target;
    setInputValue(value);
    debouncedChange(value);
    setSuggestionsVisible(true);
  };
  const onKeyDown = (e) => {
    if (e.key === "Enter") {
      navigateToSearch(inputValue);
      setSuggestionsVisible(false);
    } else if (e.key === "Escape") {
      setSuggestionsVisible(false);
    }
  };
  const clearSearch = useCallback(() => {
    setSelectedPerson(null);
    setSelectedPlace(null);
    setQuery("");
    navigateToSearch("", null); // strips old search_field segment
    setInputValue("");
    inputRef.current?.focus();
  }, [navigateToSearch, setSelectedPerson, setSelectedPlace]);

  // keep in sync with route changes
  useEffect(() => {
    setQuery(qParam ?? "");
    setInputValue(qParam ?? "");
    setCategories(category ? category.split(",") : []);
  }, [qParam, category]);

  const onFiltersToggle = (categoryId) => toggleCategory(categoryId);

  return (
    <>
      <div className="w-full left-0 mb-4 z-[2000] cursor-auto relative lg:p-3 p-1 text-gray-700 text-base bg-neutral-100 rounded shadow-sm">
        <div className="relative ">
          <input
            ref={inputRef}
            id="searchInputMapMenu"
            type="text"
            className={classNames(
              "w-full h-20 sm:h-16 rounded-lg border bg-white !p-4 pr-28 text-gray-900 placeholder-gray-500 shadow-sm",
              "border-gray-300 focus:border-isof focus:ring-2 focus:ring-isof/60 focus:outline-none",
              hasSelection ? "opacity-0 pointer-events-none" : "opacity-100"
            )}
            placeholder={l("Sök i Folke")}
            value={inputValue}
            onChange={onInput}
            onKeyDown={onKeyDown}
            onFocus={() => setSuggestionsVisible(true)}
            onBlur={({ relatedTarget }) => {
              if (!relatedTarget?.closest("#search-suggestions")) {
                setSuggestionsVisible(false);
              }
            }}
            role="combobox"
            aria-expanded={suggestionsVisible}
            aria-controls="search-suggestions"
            aria-autocomplete="list"
            aria-activedescendant={
              activeIdx > -1 ? `suggestion-${activeIdx}` : undefined
            }
            aria-haspopup="listbox"
            aria-owns={suggestionsVisible ? "search-suggestions" : undefined}
            aria-label={l("Sök i Folke")}
            autoComplete="off"
            spellCheck="false"
            tabIndex={0}
          />

          <div
            className={classNames(
              "absolute pointer-events-none block top-2.5 left-4 right-36",
              "truncate text-gray-700 leading-6",
              hasSelection ? "opacity-100" : "opacity-0"
            )}
          >
            {labelPrefix}
            <strong>{labelValue}</strong>
          </div>

          {suggestionsVisible && hasSuggestions && (
            <SuggestionsPopover
              search={query}
              activeIdx={activeIdx}
              groups={visibleSuggestionGroups}
              onClose={() => setSuggestionsVisible(false)}
            />
          )}

          <div className="absolute inset-y-0 right-2 flex items-center gap-2">
            {(query || selectedPerson || selectedPlace) && (
              <button
                type="button"
                className="pointer-events-auto rounded-full !py-0 !border-none !m-0 text-gray-500 hover:text-gray-700 focus-visible:outline-none"
                onClick={clearSearch}
                aria-label="Rensa sökning"
              >
                <span aria-hidden className="bg-white">
                  Rensa <FontAwesomeIcon icon={faClose} />
                </span>
              </button>
            )}

            {!loading && (
              <button
                type="button"
                className="pointer-events-auto rounded-md px-3.5 py-2.5 text-sm font-medium !mb-0 bg-isof !text-white hover:bg-darker-isof focus:outline-none focus:ring-2 focus:ring-isof/60 focus:ring-offset-1 focus:ring-offset-white"
                onClick={() => {
                  navigateToSearch(inputValue);
                  setSuggestionsVisible(false);
                }}
                aria-label="Sök"
              >
                Sök
              </button>
            )}

            {loading && query && (
              <span
                className={classNames(
                  "h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-transparent",
                  hasSelection ? "hidden" : "inline-block"
                )}
                aria-label="Laddar"
              />
            )}
          </div>
        </div>
      </div>

      <SearchFilters
        loading={loading}
        selectedCategories={categories}
        onToggle={onFiltersToggle}
        filters={[
          { label: "Ljud", categoryId: "contentG5", total: audioTotal },
          { label: "Bild", categoryId: "contentG2", total: pictureTotal },
        ]}
      />

      {total && (
        <div className="mt-2 w-full">
          {total.value > 0 && !loading && (
            <button
              type="button"
              className="inline-flex w/full items-center justify-center gap-2 rounded-md bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow hover:bg-gray-50"
              onClick={() => window.eventBus?.dispatch("routePopup.show")}
            >
              <FontAwesomeIcon icon={faList} />
              {` Visa ${total.value}${
                total.relation === "gte" ? "+" : ""
              } sökträffar som lista`}
            </button>
          )}
          {loading && (
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-md bg-white px-3 py-2 text-sm font-medium text-gray-400 shadow cursor-not-allowed"
              disabled
            >
              <span>Söker...</span>
            </button>
          )}
          {total.value === 0 && !loading && (
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-md bg-white px-3 py-2 text-sm font-medium text-gray-400 shadow cursor-default"
              disabled
            >
              <span>0 sökträffar</span>
            </button>
          )}
        </div>
      )}
    </>
  );
}

SearchPanel.propTypes = {
  mode: PropTypes.string.isRequired,
  params: PropTypes.object.isRequired,
  recordsData: PropTypes.object.isRequired,
  audioRecordsData: PropTypes.object.isRequired,
  pictureRecordsData: PropTypes.object.isRequired,
  loading: PropTypes.bool.isRequired,
};
