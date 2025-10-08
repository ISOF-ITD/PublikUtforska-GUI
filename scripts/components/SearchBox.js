import { useNavigate, useSearchParams } from "react-router-dom";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import PropTypes from "prop-types";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faList } from "@fortawesome/free-solid-svg-icons";

import { l } from "../lang/Lang";
import config from "../config";
import { createParamsFromSearchRoute } from "../utils/routeHelper";
import {
  getPersonFetchLocation,
  getPlaceFetchLocation,
  makeArchiveIdHumanReadable,
} from "../utils/helpers";

import SearchSuggestions from "./SearchSuggestions";
import SearchFilterButton from "./views/SearchFilterButton";

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

function useAutocomplete(search) {
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
    if (search.length < 2) {
      controller.abort();
      return setSuggestions({
        people: [],
        places: [],
        provinces: [],
        archives: [],
      });
    }

    const { apiUrl } = config;

    Promise.all([
      fetchJson(`${apiUrl}autocomplete/persons?search=${search}`, (data) =>
        data
          .filter((p) => !/^p\d+$/.test(p.id))
          .map((p) => ({
            value: p.id,
            label: `${p.name}${p.birth_year ? ` (född ${p.birth_year})` : ""}`,
          }))
      ),
      fetchJson(`${apiUrl}autocomplete/socken?search=${search}`, (data) =>
        data.map((p) => ({
          value: p.id,
          label: `${p.name}${p.landskap ? ` (${p.landskap})` : ""}`,
        }))
      ),
      fetchJson(`${apiUrl}autocomplete/landskap?search=${search}`, (data) =>
        data.map((p) => ({
          value: p.name,
          label: p.name,
        }))
      ),
      fetchJson(`${apiUrl}autocomplete/archive_ids?search=${search}`, (data) =>
        data.map((r) => ({
          value: r.id,
          label: makeArchiveIdHumanReadable(r.id),
          secondaryLabel: `(${r.id})`,
        }))
      ),
    ]).then(([people, places, provinces, archives]) =>
      setSuggestions({
        people,
        places,
        provinces,
        archives,
      })
    );
    return () => controller.abort();
  }, [search]);

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

export default function SearchBox({
  mode,
  params,
  recordsData,
  audioRecordsData,
  pictureRecordsData,
  loading,
}) {
  // routing & derived params
  const {
    search: qParam,
    search_field,
    category,
  } = createParamsFromSearchRoute(params["*"]);
  const navigate = useNavigate();
  const [, setSearchParams] = useSearchParams(); // reserved for future needs

  // refs & state
  const inputRef = useRef(null);
  const suggestionsRef = useRef(null);
  const [inputValue, setInputValue] = useState(qParam ?? "");
  const [search, setSearch] = useState(qParam ?? "");
  const [categories, setCategories] = useState(
    category ? category.split(",") : []
  );
  const [selectedPerson, setSelectedPerson] = useState(null);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [suggestionsVisible, setSuggestionsVisible] = useState(false);

  // Popular Matomo searches
  const [topSearches, setTopSearches] = useState([]);

  useEffect(() => {
    if (!suggestionsVisible || topSearches.length) return;

    const url = new URL(config.matomoApiUrl);
    Object.entries(config.searchSuggestionsParams).forEach(([k, v]) =>
      url.searchParams.append(k, v)
    );

    fetch(url, { mode: "cors" })
      .then((r) => r.json())
      .then((json) => {
        if (!Array.isArray(json)) return;
        setTopSearches(
          json
            .filter((row) => !/^start/i.test(row.label))
            .map((row) => ({ value: row.label, label: row.label }))
        );
      })
      .catch(console.error);
  }, [suggestionsVisible, topSearches.length]);

  // totals
  const {
    metadata: { total },
  } = recordsData;
  const {
    metadata: { total: audioTotal },
  } = audioRecordsData;
  const {
    metadata: { total: pictureTotal },
  } = pictureRecordsData;

  // autocomplete
  const { people, places, provinces, archives } = useAutocomplete(search);

  // helpers
  // inside SearchBox, replace the whole executeSearch with:
  const executeSearch = useCallback(
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
      search,
      inputValue,
      search_field,
      setSuggestionsVisible,
    ]
  );

  const handleFilterChange = (e) => {
    const { filter: categoryToToggle } = e.currentTarget.dataset;
    executeSearch(undefined, undefined, categoryToToggle);
  };

  const clearSearch = () => {
    setSelectedPerson(null);
    setSelectedPlace(null);
    setSearch("");
    executeSearch("", null); // strip the old search_field segment
    setInputValue(""); // keep the input in sync
    inputRef.current?.focus();
  };

  const suggestionGroups = useMemo(
    () => [
      {
        title: "Search",
        label: l("Vanligaste sökningar"),
        items: topSearches
          .filter(({ label }) =>
            label.toLowerCase().includes(search.trim().toLowerCase())
          )
          .sort(suggestionSort(search)),
        click: (s) => executeSearch(s.value),
        maxHeight: 240,
      },
      {
        // Personer
        title: "Person", // <- must match config.numberOfPersonSuggestions
        label: l("Personer"),
        items: [...people].sort(suggestionSort(search)),
        field: "person",
        click: (p) => executeSearch(p.value, "person"),
      },
      {
        // Orter
        title: "Place",
        label: l("Orter"),
        items: places,
        field: "place",
        click: (p) => executeSearch(p.value, "place"),
      },
      {
        // Landskap
        title: "Province",
        label: l("Landskap"),
        items: provinces,
        field: "place",
        click: (p) => executeSearch(p.value, "place"),
      },
      {
        // Arkivsignum
        title: "ArchiveId",
        label: l("Arkivsignum"),
        items: archives,
        /* field left undefined on purpose – we search the raw value */
        click: (p) => executeSearch(p.value),
      },
    ],
    [topSearches, people, places, provinces, archives, executeSearch, search]
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

  const debouncedChange = useDebounce(setSearch);

  // effects
  // keep component in sync with route changes
  useEffect(() => {
    setSearch(qParam ?? "");
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
    : search
    ? "Innehåll: "
    : "";

  const labelValue = selectedPerson?.name ?? selectedPlace?.name ?? search;

  // event handlers
  const onInput = ({ target }) => {
    const { value } = target;
    debouncedChange(value);
    setSuggestionsVisible(true);
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter") {
      executeSearch(inputValue);
      setSuggestionsVisible(false);
    } else if (e.key === "Escape") {
      setSuggestionsVisible(false);
    }
  };

  const [activeIdx, setActiveIdx] = useState(-1);

  useEffect(
    () => setActiveIdx(-1),
    [suggestionsVisible, search, flatSuggestions.length]
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

  // JSX
  return (
    <>
      <div className="search-box map-floating-control expanded">
        <div>
          <input
            ref={inputRef}
            id="searchInputMapMenu"
            type="text"
            className={
              (selectedPerson && "person") ||
              (selectedPlace && "place") ||
              "keyword"
            }
            placeholder={l("Sök i Folke")}
            value={inputValue}
            onChange={(e) => {
              const { value } = e.target;
              setInputValue(value);
              debouncedChange(value);
              setSuggestionsVisible(true);
            }}
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
            autoComplete="off"
            spellCheck="false"
            tabIndex={0}
          />

          <div
            className={`search-label ${
              (selectedPerson && "person") ||
              (selectedPlace && "place") ||
              "keyword"
            }`}
            style={{
              fontSize: "0.9rem",
              textOverflow: "ellipsis",
              overflow: "hidden",
              whiteSpace: "nowrap",
              maxWidth: 227,
              display: "block",
            }}
          >
            {labelPrefix}
            <strong>{labelValue}</strong>
          </div>

          {suggestionsVisible && hasSuggestions && (
            <SearchSuggestions
              search={search}
              activeIdx={activeIdx}
              groups={visibleSuggestionGroups}
              ref={suggestionsRef}
              onClose={() => setSuggestionsVisible(false)}
            />
          )}
        </div>

        <div className="search-field-buttons">
          {(search || selectedPerson || selectedPlace) && (
            <button
              type="button"
              className="clear-button"
              onClick={clearSearch}
              aria-label="Rensa sökning"
            />
          )}
          {!loading && (
            <button
              type="button"
              className="search-button"
              onClick={() => executeSearch(inputValue)}
              aria-label="Sök"
              style={{
                visibility:
                  selectedPerson || selectedPlace ? "hidden" : "unset",
              }}
            />
          )}
          {loading && search && (
            <div
              className="search-spinner"
              style={{
                visibility:
                  selectedPerson || selectedPlace ? "hidden" : "unset",
              }}
            />
          )}
        </div>
      </div>

      <div
        className={`totals${
          loading ? " visible" : " visible"
        } text-white pb-8 flex gap-3 flex-wrap p-2`}
      >
        <span className="whitespace-nowrap">
          {l("Begränsa sökningen till: ")}
        </span>
        <div className="flex items-center gap-2">
          <SearchFilterButton
            handleFilterChange={handleFilterChange}
            label="Ljud"
            categoryId="contentG5"
            total={audioTotal}
            checked={categories.includes("contentG5")}
          />
          <SearchFilterButton
            handleFilterChange={handleFilterChange}
            label="Bild"
            categoryId="contentG2"
            total={pictureTotal}
            checked={categories.includes("contentG2")}
          />
        </div>
      </div>

      {total && (
        <div className="popup-wrapper">
          {total.value > 0 && !loading && (
            <button
              type="button"
              className="popup-open-button"
              onClick={() => window.eventBus?.dispatch("routePopup.show")}
            >
              <FontAwesomeIcon icon={faList} />
              {` Visa ${total.value}${
                total.relation === "gte" ? "+" : ""
              } sökträffar som lista`}
            </button>
          )}
          {loading && (
            <button type="button" className="popup-open-button disabled">
              <span>Söker...</span>
            </button>
          )}
          {total.value === 0 && !loading && (
            <button
              type="button"
              className="popup-open-button visible disabled"
            >
              <span>0 sökträffar</span>
            </button>
          )}
        </div>
      )}
    </>
  );
}

SearchBox.propTypes = {
  mode: PropTypes.string.isRequired,
  params: PropTypes.object.isRequired,
  recordsData: PropTypes.object.isRequired,
  audioRecordsData: PropTypes.object.isRequired,
  pictureRecordsData: PropTypes.object.isRequired,
  loading: PropTypes.bool.isRequired,
};
