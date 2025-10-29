import { useNavigate } from "react-router-dom";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import PropTypes from "prop-types";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faClose, faList } from "@fortawesome/free-solid-svg-icons";

import { l } from "../../lang/Lang";
import config from "../../config";
import { createParamsFromSearchRoute } from "../../utils/routeHelper";
import {
  getPersonFetchLocation,
  getPlaceFetchLocation,
  makeArchiveIdHumanReadable,
} from "../../utils/helpers";

import SuggestionsPopover from "./ui/SuggestionsPopover";
import SearchFilters from "./ui/SearchFilters";
import classNames from "classnames";

// Utils & hooks
function useDebounce(fn, delay = 300) {
  const timer = useRef();

  useEffect(() => () => clearTimeout(timer.current), []);

  return useCallback(
    (...args) => {
      clearTimeout(timer.current);
      timer.current = setTimeout(() => fn(...args), delay);
    },
    [delay, fn]
  );
}

function useAutocomplete(query) {
  const [{ people, places, provinces, archives }, setSuggestions] = useState({
    people: [],
    places: [],
    provinces: [],
    archives: [],
  });

  const fetchJson = (endpoint, mapFn, signal) =>
    fetch(endpoint, { mode: "cors", signal })
      .then((r) => r.json())
      .then(({ data }) => mapFn(data));

  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;
    if (query.length < 2) {
      controller.abort();
      return setSuggestions({
        people: [],
        places: [],
        provinces: [],
        archives: [],
      });
    }

    const { apiUrl } = config;

    Promise.allSettled([
      fetchJson(`${apiUrl}autocomplete/persons?search=${query}`, (data) =>
        data
          .filter((p) => !/^p\d+$/.test(p.id))
          .map((p) => ({
            value: p.id,
            label: `${p.name}${p.birth_year ? ` (född ${p.birth_year})` : ""}`,
          }))
      ),
      fetchJson(`${apiUrl}autocomplete/socken?search=${query}`, (data) =>
        data.map((p) => ({
          value: p.id,
          label: `${p.name}${p.landskap ? ` (${p.landskap})` : ""}`,
        }))
      ),
      fetchJson(`${apiUrl}autocomplete/landskap?search=${query}`, (data) =>
        data.map((p) => ({
          value: p.name,
          label: p.name,
        }))
      ),
      fetchJson(`${apiUrl}autocomplete/archive_ids?search=${query}`, (data) =>
        data.map((r) => ({
          value: r.id,
          label: makeArchiveIdHumanReadable(r.id),
          secondaryLabel: `(${r.id})`,
        }))
      ),
    ])
      .then((results) => {
        if (signal.aborted) return;
        const [pe, pl, pr, ar] = results.map((r) =>
          r.status === "fulfilled" ? r.value : []
        );
        setSuggestions({ people: pe, places: pl, provinces: pr, archives: ar });
      })
      .catch((err) => {
        if (err?.name !== "AbortError") console.error(err);
      });
    return () => controller.abort();
  }, [query]);

  return { people, places, provinces, archives };
}

const suggestionSort = (needle) => (a, b) => {
  const aStarts = a.label.toLowerCase().startsWith(needle);
  const bStarts = b.label.toLowerCase().startsWith(needle);
  if (aStarts && !bStarts) return -1;
  if (!aStarts && bStarts) return 1;
  return a.label.localeCompare(b.label, "sv"); // secondary alphabetical sort
};

// Component

export default function SearchPanel({
  mode,
  params,
  recordsData,
  audioRecordsData,
  pictureRecordsData,
  loading,
}) {
  // routing & derived params
  const {
    query: qParam,
    search_field,
    category,
  } = createParamsFromSearchRoute(params["*"]);
  const navigate = useNavigate();

  // refs & state
  const inputRef = useRef(null);
  const suggestionsRef = useRef(null);
  const [inputValue, setInputValue] = useState(qParam ?? "");
  const [query, setQuery] = useState(qParam ?? "");
  const [categories, setCategories] = useState(
    category ? category.split(",") : []
  );
  const [selectedPerson, setSelectedPerson] = useState(null);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [suggestionsVisible, setSuggestionsVisible] = useState(false);

  // Popular Matomo searches
  const [popularQueries, setPopularQueries] = useState([]);

  useEffect(() => {
    if (!suggestionsVisible || popularQueries.length) return;

    const url = new URL(config.matomoApiUrl);
    Object.entries(config.searchSuggestionsParams).forEach(([k, v]) =>
      url.searchParams.append(k, v)
    );

    fetch(url, { mode: "cors" })
      .then((r) => r.json())
      .then((json) => {
        if (!Array.isArray(json)) return;
        setPopularQueries(
          json
            .filter((row) => !/^start/i.test(row.label))
            .map((row) => ({ value: row.label, label: row.label }))
        );
      })
      .catch(console.error);
  }, [suggestionsVisible, popularQueries.length]);

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
  // autocomplete
  const { people, places, provinces, archives } = useAutocomplete(query);

  // helpers
  // inside SearchPanel, replace the whole navigateToSearch with:
  const navigateToSearch = useCallback(
    (
      keywordOverwrite = inputValue,
      searchFieldOverwriteProp = search_field ?? null,
      toggleCategory = null
    ) => {
      // update local category state
      const newCats = toggleCategory
        ? categories.includes(toggleCategory)
          ? categories.filter((c) => c !== toggleCategory)
          : [...categories, toggleCategory]
        : categories;
      setCategories(newCats);

      const searchFieldOverwrite = keywordOverwrite
        ? searchFieldOverwriteProp
        : null;

      // build the path
      const segments = [];
      if (keywordOverwrite) {
        segments.push("search", encodeURIComponent(keywordOverwrite));
      }
      if (searchFieldOverwrite) {
        segments.push("search_field", searchFieldOverwrite);
      }
      if (newCats.length) {
        segments.push("category", newCats.join(","));
      }

      const transcribePrefix = mode === "transcribe" ? "transcribe/" : "";
      const pathname = `/${transcribePrefix}${segments.join("/")}`;

      // add the ?s= query only when a keyword exists
      const searchParam = keywordOverwrite
        ? `?s=${
            searchFieldOverwrite ? `${searchFieldOverwrite}:` : ""
          }${encodeURIComponent(keywordOverwrite)}`
        : "";

      navigate(`${pathname}${searchParam}`);
      setSuggestionsVisible(false);
    },
    [
      categories,
      mode,
      navigate,
      query,
      inputValue,
      search_field,
      setSuggestionsVisible,
    ]
  );

  const handleFilterChange = (e) => {
    const { filter: categoryToToggle } = e.currentTarget.dataset;
    navigateToSearch(undefined, undefined, categoryToToggle);
  };

  const clearSearch = () => {
    setSelectedPerson(null);
    setSelectedPlace(null);
    setQuery("");
    navigateToSearch("", null); // strip the old search_field segment
    setInputValue(""); // keep the input in sync
    inputRef.current?.focus();
  };

  const suggestionGroups = useMemo(
    () => [
      {
        title: "Search",
        label: l("Vanligaste sökningar"),
        items: popularQueries.filter(({ label }) =>
          label.toLowerCase().includes(query.trim().toLowerCase())
        ),
        click: (s) => navigateToSearch(s.value),
        maxHeight: 240,
      },
      {
        // Personer
        title: "Person", // <- must match config.numberOfPersonSuggestions
        label: l("Personer"),
        items: [...people].sort(suggestionSort(query)),
        field: "person",
        click: (p) => navigateToSearch(p.value, "person"),
      },
      {
        // Orter
        title: "Place",
        label: l("Orter"),
        items: places,
        field: "place",
        click: (p) => navigateToSearch(p.value, "place"),
      },
      {
        // Landskap
        title: "Province",
        label: l("Landskap"),
        items: provinces,
        field: "place",
        click: (p) => navigateToSearch(p.value, "place"),
      },
      {
        // Arkivsignum
        title: "ArchiveId",
        label: l("Arkivsignum"),
        items: archives,
        /* field left undefined on purpose – we search the raw value */
        click: (p) => navigateToSearch(p.value),
      },
    ],
    [popularQueries, people, places, provinces, archives, navigateToSearch, query]
  );

  // single source of truth for visible suggestions
  const visibleSuggestionGroups = useMemo(
    () =>
      suggestionGroups.map((g) => {
        const limit = config[`numberOf${g.title}Suggestions`];
        return { ...g, items: limit ? g.items.slice(0, limit) : g.items };
      }),
    [suggestionGroups]
  );

  const flatSuggestions = useMemo(
    () =>
      visibleSuggestionGroups.flatMap((g) =>
        g.items.map((it) => ({ ...it, group: g }))
      ),
    [visibleSuggestionGroups]
  );

  const hasSuggestions = flatSuggestions.length > 0;

  const debouncedChange = useDebounce(setQuery);

  // effects
  // keep component in sync with route changes
  useEffect(() => {
    setQuery(qParam ?? "");
    setCategories(category ? category.split(",") : []);
    if (search_field === "person") {
      fetch(getPersonFetchLocation(qParam))
        .then((r) => r.json())
        .then(setSelectedPerson);
    } else if (search_field === "place") {
      fetch(getPlaceFetchLocation(qParam))
        .then((r) => r.json())
        .then(setSelectedPlace);
    } else {
      setSelectedPerson(null);
      setSelectedPlace(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qParam, search_field, category]);

  useEffect(() => setInputValue(qParam ?? ""), [qParam]);

  // render helpers
  const labelPrefix = selectedPerson
    ? "Person: "
    : selectedPlace
    ? "Ort: "
    : query
    ? "Innehåll: "
    : "";

  const labelValue = selectedPerson?.name ?? selectedPlace?.name ?? query;

  // event handlers
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

  const [activeIdx, setActiveIdx] = useState(-1);

  useEffect(
    () => setActiveIdx(-1),
    [suggestionsVisible, query, flatSuggestions.length]
  );

  const handleGlobalKey = useCallback(
    (e) => {
      if (!suggestionsVisible || flatSuggestions.length === 0) return;
      if (["ArrowDown", "ArrowUp"].includes(e.key)) {
        e.preventDefault();
        setActiveIdx((prev) =>
          e.key === "ArrowDown"
            ? (prev + 1) % flatSuggestions.length
            : (prev - 1 + flatSuggestions.length) % flatSuggestions.length
        );
      }
      if (e.key === "Enter" && activeIdx > -1) {
        e.preventDefault();
        const { group, ...item } = flatSuggestions[activeIdx];
        group.click(item);
        setSuggestionsVisible(false);
      }
    },
    [activeIdx, flatSuggestions, suggestionsVisible]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleGlobalKey);
    return () => window.removeEventListener("keydown", handleGlobalKey);
  }, [handleGlobalKey]);

  const hasSelection = !!(selectedPerson || selectedPlace);

  const toggleCategory = (categoryId) => {
    navigateToSearch(undefined, undefined, categoryId);
  };

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
              ref={suggestionsRef}
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
                className={classNames(
                  "pointer-events-auto rounded-md px-3.5 py-2.5 text-sm font-medium !mb-0",
                  "bg-isof !text-white hover:bg-darker-isof",
                  "focus:outline-none focus:ring-2 focus:ring-isof/60 focus:ring-offset-1 focus:ring-offset-white"
                )}
                onClick={() => navigateToSearch(inputValue)}
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
        onToggle={toggleCategory}
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
              className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow hover:bg-gray-50"
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
