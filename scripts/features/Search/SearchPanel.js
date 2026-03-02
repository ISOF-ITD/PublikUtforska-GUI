import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import PropTypes from "prop-types";
import classNames from "classnames";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faClose,
  faList,
  faPen,
  faSearch,
  faCircleQuestion,
  faClipboardList,
  faExternalLink,
} from "@fortawesome/free-solid-svg-icons";
import { useLocation } from 'react-router-dom';
import { l } from "../../lang/Lang";
import {
  createParamsFromSearchRoute,
  removeViewParamsFromRoute,
} from '../../utils/routeHelper';
import useAutocomplete from './hooks/useAutocomplete';
import useDebouncedCallback from './hooks/useDebouncedCallback';
import SuggestionsPopover from './ui/SuggestionsPopover';
import { SearchFilters } from './ui/SearchFilters';
import usePopularQueries from './hooks/usePopularQueries';
import useSearchRouting from './hooks/useSearchRouting';
import useSelectionFromRoute from './hooks/useSelectionFromRoute';
import useSuggestionGroups from './hooks/useSuggestionGroups';
import useSuggestionKeyboard from './hooks/useSuggestionKeyboard';
import TranscribeButton from '../TranscriptionPageByPageOverlay/ui/TranscribeButton';
import FilterSwitch from '../../components/FilterSwitch';
import config from '../../config';

export default function SearchPanel({
  mode,
  recordsData,
  audioRecordsData,
  pictureRecordsData,
  loading,
  onOpenIntroOverlay,
  mobileCompact = false,
}) {
  const location = useLocation();
  // Normalise the path so it always starts from "search/…"
  const baseSearchPath = useMemo(() => {
    // 1. Strip view segments (/records/:id etc.)
    const stripped = removeViewParamsFromRoute(location.pathname);
    // 2. Remove leading "/" and optional "transcribe/" prefix,
    // so both "/search/…" and "/transcribe/search/…" become "search/…"
    return stripped
      .replace(/^\/?transcribe\/?/, '/') // drop "transcribe" mode prefix
      .replace(/^\//, ''); // drop leading slash
  }, [location.pathname]);

  const {
    search: qParam,
    search_field: searchField,
    category,
  } = useMemo(
    () => createParamsFromSearchRoute(baseSearchPath),
    [baseSearchPath],
  );

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
  const { people, places, provinces, archiveIds } = useAutocomplete(query);
  const popularQueries = usePopularQueries(suggestionsVisible);

  // routing helpers
  const { navigateToSearch: rawNavigateToSearch, toggleCategory } = useSearchRouting({
    mode,
    search_field: searchField,
    categories,
    setCategories,
  });

  // Ensure the controlled input reflects any picked suggestion
  const navigateToSearch = useCallback(
    (keywordOverwrite, searchFieldOverwrite) => {
      const v = typeof keywordOverwrite === "string" ? keywordOverwrite : "";
      // Update both pieces of state so the input text appear right away
      setInputValue(v);
      setQuery(v);
      rawNavigateToSearch(keywordOverwrite, searchFieldOverwrite);
    },
    [rawNavigateToSearch]
  );

  // selection derived from route
  const {
    selectedPerson,
    selectedPlace,
    selectedArchiveId,
    hasSelection,
    labelPrefix,
    labelValue,
    setSelectedPerson,
    setSelectedPlace,
    setSelectedArchiveId,
  } = useSelectionFromRoute(qParam, searchField);

  // suggestions model
  const { visibleSuggestionGroups, flatSuggestions, hasSuggestions } =
    useSuggestionGroups({
      query,
      popularQueries,
      people,
      places,
      provinces,
      archiveIds,
      navigateToSearch,
    });

  // keyboard nav
  const { activeIdx } = useSuggestionKeyboard({
    enabled: suggestionsVisible,
    flatSuggestions,
    onPick: (run) => {
      run();
      setSuggestionsVisible(false);
      // return focus to the input for good a11y
      inputRef.current?.focus();
    },
    onClose: () => setSuggestionsVisible(false),
  });

  // When pressing Enter on the input, prefer selecting the active suggestion
  const pickActiveSuggestion = useCallback(() => {
    if (!suggestionsVisible || activeIdx < 0) return false;
    const s = flatSuggestions?.[activeIdx];
    // support both shapes: a function or an object with .run() or a { click, item }
    const run =
      typeof s === "function"
        ? s
        : s?.run || (s?.click && (() => s.click(s.item ?? s)));
    if (typeof run === "function") {
      run();
      setSuggestionsVisible(false);
      inputRef.current?.focus();
      return true;
    }
    return false;
  }, [suggestionsVisible, activeIdx, flatSuggestions]);

  // input handlers
  const debouncedChange = useDebouncedCallback(setQuery);
  const onInput = ({ target }) => {
    const { value } = target;
    setInputValue(value);
    debouncedChange(value);
    setSuggestionsVisible(true);
  };
  const onKeyDown = (e) => {
    if (e.key === 'Enter') {
      if (pickActiveSuggestion()) return;
      navigateToSearch(inputValue);
      setSuggestionsVisible(false);
    } else if (e.key === 'Tab') {
      setSuggestionsVisible(false);
    } else if (e.key === 'Escape') {
      setSuggestionsVisible(false);
    }
  };
  const clearSearch = useCallback(() => {
    if (!qParam && !inputValue && !selectedPerson && !selectedPlace && !selectedArchiveId) {
      inputRef.current?.focus();
      return;
    }
    setSelectedPerson(null);
    setSelectedPlace(null);
    setSelectedArchiveId(null);
    setQuery("");
    navigateToSearch("", null);
    setInputValue("");
    inputRef.current?.focus();
  }, [navigateToSearch, qParam, inputValue, selectedPerson, selectedPlace, selectedArchiveId]);

  // keep categories in sync with the route
  useEffect(() => {
    setCategories(category ? category.split(",") : []);
  }, [category]);

  // keep input/query in sync only when the route's query changes
  useEffect(() => {
    const next = qParam ?? "";
    // React will bail out if value is unchanged, so setting unconditionally is fine
    setQuery(next);
    setInputValue(next);
  }, [qParam]); // do NOT include `category` here

  const onFiltersToggle = (categoryId) => toggleCategory(categoryId, inputValue || qParam || '');
  const fixedSearchControlHeightPx = 48;
  const desktopSearchRowStyle = mobileCompact
    ? undefined
    : { padding: '6px 10px', minHeight: `${fixedSearchControlHeightPx + 12}px` };
  const searchInputStyle = {
    height: `${fixedSearchControlHeightPx}px`,
    minHeight: `${fixedSearchControlHeightPx}px`,
    maxHeight: `${fixedSearchControlHeightPx}px`,
    boxSizing: 'border-box',
  };
  const searchButtonStyle = {
    height: `${fixedSearchControlHeightPx}px`,
    minHeight: `${fixedSearchControlHeightPx}px`,
    maxHeight: `${fixedSearchControlHeightPx}px`,
    lineHeight: '1',
    boxSizing: 'border-box',
  };

  return (
    <>
      <FilterSwitch mode={mode} className={mobileCompact ? 'mt-2' : ''} />
      <div
        className={classNames(
          'left-0 z-[2000] flex max-w-full items-center cursor-auto relative overflow-visible text-gray-700 bg-neutral-100 rounded shadow-sm',
          mobileCompact ? 'w-auto mx-2 px-2.5 py-1.5 text-sm' : 'w-full px-2.5 py-1.5 text-sm',
        )}
        style={desktopSearchRowStyle}
      >
        {/* Make the input and the external button siblings */}
        <div className="w-full min-w-0 flex items-center gap-2">
          {/* Input wrapper stays relative so the popover can be absolutely positioned */}
          <div className="relative min-w-0 flex-1 items-center">
            <input
              ref={inputRef}
              id="searchInputMapMenu"
              type="text"
              className={classNames(
                'w-full border bg-white !p-2 text-gray-900 placeholder-gray-500 shadow-sm',
                'border-gray-300 focus:border-isof focus:ring-2 focus:ring-isof/60 focus:outline-none !mb-0',
                'h-12 rounded-md pr-20',
                'text-[16px]',
                hasSelection ? 'opacity-0 pointer-events-none' : 'opacity-100',
              )}
              placeholder={l("Sök i Folke")}
              style={searchInputStyle}
              value={inputValue}
              onChange={onInput}
              onKeyDown={onKeyDown}
              onFocus={() => setSuggestionsVisible(true)}
              onBlur={({ relatedTarget }) => {
                if (!relatedTarget?.closest("#search-suggestions-container")) {
                  setSuggestionsVisible(false);
                }
              }}
              role="combobox"
              aria-expanded={suggestionsVisible}
              aria-controls="search-suggestions"
              aria-haspopup="listbox"
              aria-autocomplete="list"
              aria-activedescendant={
                activeIdx > -1 ? `suggestion-${activeIdx}` : undefined
              }
              aria-hidden={hasSelection || undefined}
              aria-label={l("Sök i Folke")}
              aria-busy={loading || undefined}
              autoComplete="off"
              spellCheck="false"
              tabIndex={hasSelection ? -1 : 0}
            />

            {/* Read-only label overlay – tighten right edge since search is now outside */}
            <div
              className={classNames(
                'absolute pointer-events-none block left-4 right-12',
                mobileCompact ? 'top-2' : 'top-2.5',
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

            {/* Keep only clear + loader inside the input */}
            <div className="absolute inset-y-0 right-2 flex items-center gap-2">
              {(query || selectedPerson || selectedPlace || selectedArchiveId) && (
                <button
                  type="button"
                  className={classNames(
                    'pointer-events-auto rounded-full !py-0 !border-none !m-0 text-gray-500 hover:text-gray-700 focus-visible:outline-none',
                    mobileCompact ? 'h-8 w-8 flex items-center justify-center' : '',
                  )}
                  onClick={clearSearch}
                  aria-label="Rensa sökning"
                  title={l("Rensa sökning")}
                >
                  <span aria-hidden>
                    {mobileCompact ? (
                      <FontAwesomeIcon icon={faClose} />
                    ) : (
                      <>
                        Rensa
                        <FontAwesomeIcon icon={faClose} />
                      </>
                    )}
                  </span>
                </button>
              )}

              {loading && query && (
                <span
                  className={classNames(
                    "h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-transparent",
                    hasSelection ? "hidden" : "inline-block"
                  )}
                  aria-label="Laddar"
                  role="status"
                  aria-live="polite"
                />
              )}
            </div>
          </div>

          {/* External “Sök” button */}
          <button
            type="button"
            className={classNames(
              'pointer-events-auto gap-1 flex items-center justify-center self-center rounded-md text-sm font-medium',
              'bg-isof !text-white border-2 border-transparent hover:bg-darker-isof focus:bg-darker-isof focus:border-black focus:ring-2 focus:ring-black focus:ring-offset-2 focus:ring-offset-neutral-100 focus:outline-none',
              'shrink-0 !mb-0',
              mobileCompact ? 'h-12 min-w-[3rem] px-3' : 'h-12 px-3',
            )}
            onClick={() => {
              navigateToSearch(inputValue);
              setSuggestionsVisible(false);
            }}
            aria-label={l("Sök")}
            disabled={loading}
            title={l("Hämta sökresultat")}
            style={searchButtonStyle}
          >
            <FontAwesomeIcon icon={faSearch} />
            {!mobileCompact && l('Sök')}
          </button>
        </div>
      </div>

      <SearchFilters
        loading={loading}
        selectedCategories={categories}
        onToggle={onFiltersToggle}
        compact={mobileCompact}
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
              className={classNames(
                'inline-flex w-full items-center justify-center gap-2 rounded-md bg-white px-3 py-2 !text-base font-medium text-gray-700 shadow hover:bg-gray-50',
                mobileCompact ? 'flex-wrap whitespace-normal break-words text-center' : '',
              )}
              onClick={() => window.eventBus?.dispatch('routePopup.show')}
              title={l('Visa sökträffar')}
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
              className={classNames(
                'inline-flex w-full items-center gap-2 rounded-md bg-white px-3 py-2 !text-base font-medium text-gray-700 shadow cursor-not-allowed',
                mobileCompact ? 'flex-wrap whitespace-normal break-words text-center' : '',
              )}
              disabled
            >
              <span>Söker...</span>
            </button>
          )}
          {total.value === 0 && !loading && (
            <button
              type="button"
              className={classNames(
                'inline-flex w-full items-center gap-2 rounded-md bg-white px-3 py-2 !text-base font-medium text-gray-700 shadow cursor-default',
                mobileCompact ? 'flex-wrap whitespace-normal break-words text-center' : '',
              )}
              disabled
            >
              <span>0 sökträffar</span>
            </button>
          )}
        </div>
      )}
      <TranscribeButton
        className={mobileCompact ? '!h-auto !min-h-[2.75rem] !whitespace-normal !break-words !leading-snug !py-2' : ''}
        label={(
          <>
            <FontAwesomeIcon icon={faPen} />{" "}
            {l("Skriv av slumpmässig uppteckning")}
            {config.specialEventTranscriptionCategoryLabel && <br />}
            {config.specialEventTranscriptionCategoryLabel || ""}
          </>
        )}
        random
        title={l("Skriv av slumpmässig uppteckning")}
        variant="listLike" // match "Visa sökträffar" look
      />

      {onOpenIntroOverlay && (
        <button
          type="button"
          onClick={onOpenIntroOverlay}
          aria-controls="intro-overlay"
          className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-white px-3 py-2 !text-base font-medium text-gray-700 shadow hover:bg-gray-50"
          title={l("Hjälp & nyheter")}
          aria-label={l("Hjälp och nyheter")}
        >
          <span className="inline-flex items-center gap-2">
            <FontAwesomeIcon icon={faCircleQuestion} />
            <span className="font-medium">{l("Hjälp och nyheter")}</span>
          </span>
        </button>
      )}
      {/* SURVEY */}
      <div className="hidden relative w-full !mb-4">
        <a
          href="https://www.isof.se/enkatfolke"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-white border-4 border-solid border-lighter-isof py-2 !text-base font-medium text-gray-700 shadow "
          title={l("Tyck till om Folke – svara på vår enkät")}
          aria-label={l("Tyck till om Folke – svara på vår enkät!")}
        >
          <span className="inline-flex items-center gap-2">
            <FontAwesomeIcon icon={faClipboardList} />
            <span className="font-medium">
              {l("Tyck till om Folke – svara på vår enkät 2025")}
            </span>
            <FontAwesomeIcon icon={faExternalLink} />
          </span>
        </a>
      </div>
    </>
  );
}

SearchPanel.propTypes = {
  mode: PropTypes.string.isRequired,
  // These can be null/undefined while data loads; code already guards
  recordsData: PropTypes.object,
  audioRecordsData: PropTypes.object,
  pictureRecordsData: PropTypes.object,
  loading: PropTypes.bool,
  onOpenIntroOverlay: PropTypes.func,
  mobileCompact: PropTypes.bool,
};
