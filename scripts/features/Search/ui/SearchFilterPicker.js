import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFilter } from '@fortawesome/free-solid-svg-icons';
import { l } from '../../../lang/Lang';
import useAutocomplete from '../hooks/useAutocomplete';
import useDebouncedCallback from '../hooks/useDebouncedCallback';
import useSuggestionGroups from '../hooks/useSuggestionGroups';
import useSuggestionKeyboard from '../hooks/useSuggestionKeyboard';
import SuggestionsPopover from './SuggestionsPopover';

const filterPanelId = 'search-filter-picker-panel';
const filterListId = 'search-filter-suggestions';
const filterOptionIdPrefix = 'filter-suggestion';

export default function SearchFilterPicker({
  children,
  open,
  onOpenChange,
  onSelect,
}) {
  const buttonRef = useRef(null);
  const inputRef = useRef(null);
  const [inputValue, setInputValue] = useState('');
  const [query, setQuery] = useState('');
  const debouncedChange = useDebouncedCallback(setQuery);

  const {
    people,
    places,
    provinces,
    archiveIds,
  } = useAutocomplete(query);

  const focusToggle = useCallback(() => {
    window.requestAnimationFrame(() => buttonRef.current?.focus());
  }, []);

  const resetPicker = useCallback(() => {
    onOpenChange(false);
    setInputValue('');
    setQuery('');
    debouncedChange('');
  }, [debouncedChange, onOpenChange]);

  const closePicker = useCallback(() => {
    resetPicker();
    focusToggle();
  }, [focusToggle, resetPicker]);

  const selectFilter = useCallback((field, value) => {
    onSelect(field, value);
    closePicker();
  }, [closePicker, onSelect]);

  const {
    visibleSuggestionGroups,
    flatSuggestions,
    hasSuggestions,
  } = useSuggestionGroups({
    query,
    popularQueries: [],
    people,
    places,
    provinces,
    archiveIds,
    selectFilter,
    includeSearchSuggestions: false,
  });

  const pickSuggestion = useCallback((run) => run(), []);
  const { activeIdx } = useSuggestionKeyboard({
    enabled: open,
    flatSuggestions,
    onPick: pickSuggestion,
    onClose: closePicker,
  });

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (open) return;
    setInputValue('');
    setQuery('');
    debouncedChange('');
  }, [debouncedChange, open]);

  const togglePicker = () => {
    if (open) {
      closePicker();
      return;
    }
    onOpenChange(true);
  };

  const onInput = ({ target }) => {
    setInputValue(target.value);
    debouncedChange(target.value);
  };

  const closeSuggestions = useCallback(() => {
    setInputValue('');
    setQuery('');
    debouncedChange('');
    inputRef.current?.focus();
  }, [debouncedChange]);

  return (
    <>
      {children}
      <button
        ref={buttonRef}
        type="button"
        className={classNames(
          'inline-flex min-h-9 items-center gap-2 !m-0 border px-3 py-1.5 text-sm font-medium',
          'focus-visible:outline focus-visible:outline-2 focus-visible:outline-white focus-visible:outline-offset-2',
          open
            ? 'border-border bg-surface !text-body hover:bg-surface-hover'
            : 'border-white/70 bg-transparent !text-white hover:bg-primary-hover',
        )}
        onClick={togglePicker}
        aria-expanded={open}
        aria-controls={filterPanelId}
      >
        <FontAwesomeIcon icon={faFilter} aria-hidden="true" />
        {l('Lägg till filter')}
      </button>
      {open && (
        <div
          id={filterPanelId}
          className="relative w-full basis-full rounded-md border border-border bg-surface-muted p-3 text-body"
        >
          <label
            className="mb-1 block text-sm font-semibold text-body"
            htmlFor="searchFilterInput"
          >
            {l('Lägg till filter')}
          </label>
          <input
            ref={inputRef}
            id="searchFilterInput"
            type="text"
            className="mb-0 h-11 w-full rounded-md border border-border bg-surface p-2 text-[16px] text-body placeholder-subtle shadow-sm focus-visible:border-focus focus-visible:outline focus-visible:outline-2 focus-visible:outline-focus focus-visible:outline-offset-2"
            placeholder={l('Sök person, ort, landskap eller arkivsignum')}
            value={inputValue}
            onChange={onInput}
            role="combobox"
            aria-expanded={hasSuggestions}
            aria-controls={filterListId}
            aria-haspopup="listbox"
            aria-autocomplete="list"
            aria-activedescendant={
              activeIdx > -1 ? `${filterOptionIdPrefix}-${activeIdx}` : undefined
            }
            autoComplete="off"
            spellCheck="false"
          />

          {hasSuggestions && (
            <SuggestionsPopover
              search={query}
              activeIdx={activeIdx}
              groups={visibleSuggestionGroups}
              onClose={closeSuggestions}
              containerId="search-filter-suggestions-container"
              listId={filterListId}
              optionIdPrefix={filterOptionIdPrefix}
              listLabel={l('Filterförslag')}
            />
          )}
        </div>
      )}
    </>
  );
}

SearchFilterPicker.propTypes = {
  children: PropTypes.node,
  open: PropTypes.bool.isRequired,
  onOpenChange: PropTypes.func.isRequired,
  onSelect: PropTypes.func.isRequired,
};
