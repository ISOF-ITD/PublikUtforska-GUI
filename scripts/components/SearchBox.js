import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faList } from '@fortawesome/free-solid-svg-icons';
import { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';

import config from '../config';

import { createParamsFromSearchRoute } from '../utils/routeHelper';

import SearchSuggestions from './SearchSuggestions';
import { getPersonFetchLocation, getPlaceFetchLocation, makeArchiveIdHumanReadable } from '../utils/helpers';

export default function SearchBox({
  mode, params, recordsData, audioRecordsData, loading,
}) {
  SearchBox.propTypes = {
    // expanded: PropTypes.bool.isRequired,
    mode: PropTypes.string.isRequired,
    params: PropTypes.object.isRequired,
    recordsData: PropTypes.object.isRequired,
    audioRecordsData: PropTypes.object.isRequired,
    loading: PropTypes.bool.isRequired,
  };

  const searchInputRef = useRef();
  const suggestionsRef = useRef();
  const suggestionsCloseRef = useRef();

  // const [fetchingPage, setFetchingPage] = useState(false);
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const [personSuggestions, setPersonSuggestions] = useState([]);
  const [placeSuggestions, setPlaceSuggestions] = useState([]);
  const [provinceSuggestions, setProvinceSuggestions] = useState([]);
  const [archiveIdSuggestions, setArchiveIdSuggestions] = useState([]);
  const [suggestionsVisible, setSuggestionsVisible] = useState(false);
  const [search, setSearch] = useState('');
  const [person, setPerson] = useState(null);
  const [place, setPlace] = useState(null);
  // const [province, setProvince] = useState(null);

  const { search: searchParam, search_field: searchFieldParam } = createParamsFromSearchRoute(params['*']);
  const navigate = useNavigate();

  // const dataFromRecordsRoute = useRouteLoaderData('records');
  // const dataFromRootRoute = useRouteLoaderData('/');
  // const dataFromTranscribeRoute = useRouteLoaderData('transcribe');

  // const total = mode === 'transcribe'
  const { metadata: { total } } = recordsData;
  const { metadata: { total: audioTotal } } = audioRecordsData;
  // : totalFromSearchRoute || totalFromRecordsRoute || totalFromRootRoute;

  const executeSearch = (keyword, searchFieldValue = null) => {
    // if keyword is a string, use it as search phrase
    // otherwise use the value of the search input field
    const searchPhrase = typeof keyword === 'string' ? encodeURIComponent(keyword) : encodeURIComponent(searchInputRef.current.value);
    const transcribePrefix = mode === 'transcribe' ? 'transcribe/' : '';
    const searchFieldPart = searchFieldValue ? `/search_field/${searchFieldValue}` : '';
    const searchPart = searchPhrase
      ? `search/${searchPhrase}${searchFieldPart}?s=${searchFieldValue ? `${searchFieldValue}:` : ''}${searchPhrase}`
      : '';
    navigate(
      `/${transcribePrefix}${searchPart}`,
    );
  };

  const getSearchSuggestions = () => {
    const path = config.matomoApiUrl;
    const { searchSuggestionsParams } = config;
    // add params to path
    const url = new URL(path);
    Object.keys(searchSuggestionsParams)
      .forEach((key) => url.searchParams.append(key, searchSuggestionsParams[key]));
    // read data from json api and store to window object
    fetch(url, { mode: 'cors' }).then((response) => response.json()).then((json) => {
      // for every row in json, copy row["label"] to row["value"]
      const newJson = json.map((row) => ({ ...row, value: row.label }));
      setSearchSuggestions(newJson);
    });
  };

  const getPersonAutocomplete = (keyword) => {
    const path = config.apiUrl;
    // fetch data from api, sending the keyword as query "search" parameter to /autocomplete/person
    fetch(`${path}autocomplete/persons?search=${keyword}`, { mode: 'cors' }).then((response) => response.json()).then(({ data }) => {
      // for every row in data, add row["name"] to search suggestions
      const suggestions = data.map((row) => ({
        // label is the attribute "name", if there is an attribute "birth_year" add it to the label
        label: row.name + (row.birth_year ? ` (född ${row.birth_year})` : ''),
        value: row.id,
      }));
      const filteredSuggestions = suggestions
        .filter(
          // filter out "p-personer"
          // checks if the value starts with "p" and then a number
          // and if it does, it returns false, otherwise true
          (suggestion) => !suggestion.value.match(/^p\d+$/),
        ).filter(
          // filter duplicates from suggestions
          // for every suggestion, check if the value of the suggestion
          // is the same as the value of any other suggestion
          // if it is, return false, otherwise true
          (suggestion, index, self) => self.findIndex(
            (s) => s.value === suggestion.value,
          ) === index,
        );

      setPersonSuggestions(filteredSuggestions);
    });
  };

  const getPlaceAutocomplete = (keyword) => {
    const path = config.apiUrl;
    // fetch data from api, sending the keyword as query "search" parameter to /autocomplete/socken
    fetch(`${path}autocomplete/socken?search=${keyword}`, { mode: 'cors' }).then((response) => response.json()).then(({ data }) => {
      // for every row in data, add row["name"] to search suggestions
      const suggestions = data.map((row) => ({
        // label is the attribute "name"
        label: row.name + (row.landskap ? ` (${row.landskap})` : ''),
        value: row.id,
        comment: row.comment,
      }));
      setPlaceSuggestions(suggestions);
    });
  };

  const getProvinceAutocomplete = (keyword) => {
    const path = config.apiUrl;
    // fetch data from api, sending the keyword as query "search" parameter to /autocomplete/landskap
    fetch(`${path}autocomplete/landskap?search=${keyword}`, { mode: 'cors' }).then((response) => response.json()).then(({ data }) => {
      // for every row in data, add row["name"] to search suggestions
      const suggestions = data.map((row) => ({
        // label is the attribute "name"
        label: row.name,
        value: row.name,
      }));
      setProvinceSuggestions(suggestions);
    });
  };

  const getArchiveIdAutocomplete = (keyword) => {
    const path = config.apiUrl;
    // fetch data from api, sending the keyword as query "search" parameter to /autocomplete/archive_ids and add required params
    fetch(`${path}autocomplete/archive_ids?search=${keyword}`, { mode: 'cors' }).then((response) => response.json()).then(({ data }) => {
      // for every row in data, add row["name"] to search suggestions
      const suggestions = data.map((row) => ({
        value: row.id,
        label: makeArchiveIdHumanReadable(row.id),
        secondaryLabel: `(${row.id})`,
      }));
      setArchiveIdSuggestions(suggestions);
    });
  };

  const openButtonClickHandler = () => {
    if (window.eventBus) {
      window.eventBus.dispatch('routePopup.show');
    }
  };

  useEffect(() => {
    // document.getElementById('app').addEventListener('click', windowClickHandler);
    if (window.eventBus) {
      // window.eventBus.addEventListener('Lang.setCurrentLang', languageChangedHandler);
      // window.eventBus.addEventListener('recordList.totalRecords', totalRecordsHandler);
      // window.eventBus.addEventListener('recordList.fetchingPage', fetchingPageHandler);
    }
    // populate search suggestions from matomo api
    getSearchSuggestions();
    // setSearchParamsState(routeHelper.createParamsFromSearchRoute(params['*']));
    setSearch(searchParam);
    // setSearchField(searchFieldParam);
    if (searchFieldParam === 'person') {
      const personFetchLocation = getPersonFetchLocation(searchParam);
      fetch(personFetchLocation)
        .then((response) => response.json())
        .then((data) => {
          setPerson(data);
        });
    } else if (searchFieldParam === 'place') {
      const placeFetchLocation = getPlaceFetchLocation(searchParam);
      fetch(placeFetchLocation).then((response) => {
        const status = response.headers.get('status');
        if (status !== 200) {
          setPlace({
            name: searchParam,
          });
        }
        return response.json();
      }).then((data) => {
        setPlace(data);
      });
    }
  }, []);

  useEffect(() => {
    // setSearchField(searchFieldParam);
    if (searchFieldParam === 'person') {
      const personFetchLocation = getPersonFetchLocation(searchParam);
      fetch(personFetchLocation)
        .then((response) => response.json())
        .then((data) => {
          setPerson(data);
        });
    } else if (searchFieldParam === 'place') {
      const placeFetchLocation = getPlaceFetchLocation(searchParam);
      fetch(placeFetchLocation).then((response) => {
        const status = response.headers.get('status');
        if (status !== 200) {
          setPlace({
            name: searchParam,
          });
        }
        return response.json();
      }).then((data) => {
        setPlace(data);
      });
    } else {
      setSearch(searchParam);
      setPerson(null);
    }
  }, [searchParam, searchFieldParam]);

  const openButtonKeyUpHandler = (e) => {
    if (e.keyCode === 13) {
      openButtonClickHandler(e);
    }
  };

  const filterAndSortSuggestions = (suggestions) => (
    suggestions
      // filter out suggestions that don't contain the search input value
      // why was this here?
      // sort the suggestions so that the ones that start with the search input value are first
      .sort((a, b) => {
        const aStartsWithSearch = a.label.toLowerCase().indexOf(search?.toLowerCase() || '') === 0;
        const bStartsWithSearch = b.label.toLowerCase().indexOf(search?.toLowerCase() || '') === 0;
        if (aStartsWithSearch && !bStartsWithSearch) {
          return -1;
        }
        if (!aStartsWithSearch && bStartsWithSearch) {
          return 1;
        }
        return 0;
      })
  );

  // filter keywords by search input value
  const filteredSearchSuggestions = () => searchSuggestions
    // filter out keywords that don't contain the search input value
    .filter((keyword) => keyword.label.toLowerCase().indexOf(search?.toLowerCase() || '') > -1)
    // remove out keywords that are duplicates, but only different in case
    .filter((item, index, arr) => {
      const label = item.label.toLowerCase();
      return arr.findIndex((i) => i.label.toLowerCase() === label) === index;
    });

  const filteredPersonSuggestions = () => filterAndSortSuggestions(personSuggestions);
  const filteredPlaceSuggestions = () => filterAndSortSuggestions(placeSuggestions);
  const filteredProvinceSuggestions = () => filterAndSortSuggestions(provinceSuggestions);
  const filteredArchiveIdSuggestions = () => filterAndSortSuggestions(archiveIdSuggestions);

  const closeSuggestionsHandler = () => {
    searchInputRef.current.focus();
    setPersonSuggestions([]);
    setPlaceSuggestions([]);
    setProvinceSuggestions([]);
    setArchiveIdSuggestions([]);
    setSuggestionsVisible(false);
  };

  const inputKeyPressHandler = (e) => {
    // check if event.target is the search input that has the ref "searchInputRef"
    if (e.key === 'Enter' && (e.target === searchInputRef.current)) {
      // navigate(`/search/${searchInputRef.current.value}`);
      setSuggestionsVisible(false);
      executeSearch();
    }
    if (e.key === 'Enter'
      && suggestionsRef.current && suggestionsRef.current.contains(e.target)) {
      setSuggestionsVisible(false);
      // navigate(`/search/${e.target.dataset.value}`);
      executeSearch(e.target.dataset.value, e.target.dataset.field);
    }
    if (e.key === 'Escape') {
      closeSuggestionsHandler();
    }
    // if keydown and suggestionsRef.current.contains(event.target)), change to next suggestion
    if (e.key === 'ArrowDown'
      && suggestionsRef.current && suggestionsRef.current.contains(e.target)) {
      // const next = e.target.nextElementSibling;
      // define a variable next which is the next li sibling of the e.target
      let next = e.target.nextElementSibling;
      while (next && next.tagName !== 'LI') {
        next = next.nextElementSibling;
      }
      if (next) {
        next.focus();
      }
    }
    // if keyup and suggestionsRef.current.contains(event.target)), change to previous suggestion
    if (e.key === 'ArrowUp'
      && suggestionsRef.current && suggestionsRef.current.contains(e.target)) {
      // const prev = e.target.previousElementSibling;
      // define a variable prev which is the previous li sibling of the e.target
      let prev = e.target.previousElementSibling;
      while (prev && prev.tagName !== 'LI') {
        prev = prev.previousElementSibling;
      }
      if (prev) {
        prev.focus();
      }
    }
    // if keyup and (event.target === searchInputRef.current), change focus to first suggestion
    if (e.key === 'ArrowDown' && suggestionsRef.current && (e.target === searchInputRef.current)) {
      // const first = suggestionsRef.current.firstElementChild;
      // define a const first, which is the first li-element in the suggestionsRef
      const first = suggestionsRef.current.querySelector('li');
      if (first) {
        first.focus();
      }
    }
    // if keydown and focus is on first suggestion, change focus to searchInputRef
    if (e.key === 'ArrowUp'
      && suggestionsRef.current && suggestionsRef.current.contains(e.target)) {
      const first = suggestionsRef.current.querySelector('li');
      if (e.target === first) {
        searchInputRef.current.focus();
      }
    }
    // if any key except keydown, keyup, enter, escape is pressed
    // and suggestionsRef.current.contains(event.target)),
    // set focus to searchInputRef and add the character to the search input
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp' && e.key !== 'Enter' && e.key !== 'Escape'
      && suggestionsRef.current && suggestionsRef.current.contains(e.target)) {
      searchInputRef.current.focus();
    }
  };

  const personClickHandler = ({ personLabel, personValue }) => {
    setSuggestionsVisible(false);
    // already change input field, before search results are returned
    setSearch(personLabel);
    setPerson(true);
    executeSearch(personValue, 'person');
  };

  const placeClickHandler = ({ placeLabel, placeValue }) => {
    setSuggestionsVisible(false);
    // already change input field, before search results are returned
    setSearch(placeLabel);
    setPlace(placeLabel);
    executeSearch(placeValue, 'place');
  };

  const provinceClickHandler = ({ provinceLabel, provinceValue }) => {
    setSuggestionsVisible(false);
    // already change input field, before search results are returned
    setSearch(provinceLabel);
    setPlace(provinceLabel);
    executeSearch(provinceValue, 'place');
  };

  const archiveIdClickHandler = ({ archiveidLabel, archiveidValue }) => {
    setSuggestionsVisible(false);
    // already change input field, before search results are returned
    setSearch(archiveidValue);
    executeSearch(archiveidValue);
  };

  const suggestionClickHandler = ({ searchValue }) => {
    setSuggestionsVisible(false);
    // already change input field, before search results are returned
    setSearch(searchValue);
    // setSearch(keyword);
    executeSearch(searchValue);
  };

  // set suggestionsVisible to true when the search input is focused
  const searchInputFocusHandler = () => {
    setSuggestionsVisible(true);
  };

  // set suggestionsVisible to false when the search input is blurred
  // but retain focus if the suggestionsCloseButton is clicked. do
  // not close the suggestions if the focus is moved to the suggestions list or the search input
  const searchInputBlurHandler = (e) => {
    // const refocusSearchField = e.relatedTarget === suggestionsCloseRef.current;
    let close = !!suggestionsRef.current;
    if (close) {
      close = !suggestionsRef.current.contains(e.relatedTarget);
      close = close && e.relatedTarget !== suggestionsCloseRef.current;
    }

    // https://stackoverflow.com/a/9886348
    // Vi can't set focus in the same event handler that the blur event is fired in
    // so we have to use setTimeout
    window.setTimeout(() => {
      // if (refocusSearchField) {
      //   searchInputRef.current.focus();
      // }
      if (close) {
        setSuggestionsVisible(false);
      }
    }, 0);
  };

  // ändrat värde i sökfältet
  const searchValueChangeHandler = (e) => {
    const { value } = e.target;
    setSearch(value);

    if (value.length > 1) {
      // we use a promise because we want to wait for all the promises to resolve
      Promise.all([
        getPersonAutocomplete(value),
        getPlaceAutocomplete(value),
        getProvinceAutocomplete(value),
        getArchiveIdAutocomplete(value),
      ]);
    } else {
      setPersonSuggestions([]);
      setPlaceSuggestions([]);
      setProvinceSuggestions([]);
      setArchiveIdSuggestions([]);
    }
  };

  const clearSearch = () => {
    setPersonSuggestions([]);
    setPlaceSuggestions([]);
    setProvinceSuggestions([]);
    setArchiveIdSuggestions([]);
    setPerson(null);
    setPlace(null);
    setSearch(
      '',
    );
    executeSearch('');
    document.getElementById('searchInputMapMenu').value = '';
    document.getElementById('searchInputMapMenu').focus();
  };

  const searchLabelText = () => {
    let label = '';
    if (search) {
      label = 'Innehåll: ';
      if (person) {
        label = 'Person: ';
      } else if (place) {
        label = 'Ort: ';
      }
    } else {
      label = '';
    }
    return label;
  };

  return (
    <>
      <div
        className={
          // `search-box map-floating-control${expanded ? ' expanded' : ''}
          // ${searchParamsState.recordtype === 'one_record' ? ' advanced' : ''}`}>
          'search-box map-floating-control expanded'
        }
      >
        <div>
          <input
            className={(person && 'person') || (place && 'place') || 'keyword'}
            id="searchInputMapMenu"
            ref={searchInputRef}
            type="text"
            value={search}
            onInput={searchValueChangeHandler}
            onKeyDown={inputKeyPressHandler}
            placeholder="Sök i Folke"
            onFocus={searchInputFocusHandler}
            onBlur={searchInputBlurHandler}
            aria-autocomplete="both"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck="false"
            tabIndex={0}
          />

          <div
            className={`search-label ${(person && 'person') || (place && 'place') || 'keyword'}`}
            style={{
              fontSize: '0.9rem',
              textOverflow: 'ellipsis',
              overflow: 'hidden',
              whiteSpace: 'nowrap',
              maxWidth: 227,
              display: 'block',
            }}
          >
            {
              searchLabelText()
            }
            <strong>
              {
                person
                  ? `${person.name || search}${person.birth_year ? ` (född ${person.birth_year})` : ''}`
                  : place
                    ? `${place.name || search} ${place.landskap ? `(${place.landskap})` : ''}`
                    : search
              }
            </strong>
            <br />
            <small>
              {/* {
              searchParamsState.category
                ? searchParamsState.category.split(',').map(
                  (c) => categories.getCategoryName(c),
                ).join(', ') : ''
            } */}
            </small>
          </div>
          {
            suggestionsVisible // && searchSuggestions.length > 0
            // check if keywords filtered by search input value is not empty
            && (
              filteredSearchSuggestions().length > 0
              || filteredPersonSuggestions().length > 0
              || filteredPlaceSuggestions().length > 0
              || filteredProvinceSuggestions().length > 0
              || filteredArchiveIdSuggestions().length > 0
            )
            // if true, show suggestions
            && (
              <SearchSuggestions
                ref={suggestionsRef}
                closeSuggestionsHandler={closeSuggestionsHandler}
                filteredPersonSuggestions={filteredPersonSuggestions}
                filteredPlaceSuggestions={filteredPlaceSuggestions}
                filteredProvinceSuggestions={filteredProvinceSuggestions}
                filteredArchiveIdSuggestions={filteredArchiveIdSuggestions}
                filteredSearchSuggestions={filteredSearchSuggestions}
                inputKeyPressHandler={inputKeyPressHandler}
                search={search}
                personClickHandler={personClickHandler}
                placeClickHandler={placeClickHandler}
                provinceClickHandler={provinceClickHandler}
                archiveIdClickHandler={archiveIdClickHandler}
                suggestionClickHandler={suggestionClickHandler}
              />
            )
          }
        </div>
        <div className="search-field-buttons">
          {/* only show clear button when there is text to clear or if there is text in the input field */}
          {
            (search || document.getElementById('searchInputMapMenu')?.value)
            && <button className="clear-button" onClick={clearSearch} type="button" aria-label="Rensa sökning" />
          }
          {
            !loading
            && (
              <button
                className="search-button"
                onClick={executeSearch}
                type="button"
                aria-label="Sök"
                style={{
                  visibility: person || place ? 'hidden' : 'unset',
                }}
              />
            )
          }
          {
            loading
            && (
              <button
                className="search-spinner"
                style={{
                  visibility: person || place ? 'hidden' : 'unset',
                }}
              />
            )
          }
        </div>
      </div>
      {
        audioTotal
        &&
        <span
          className="audioTotal"
          // position: relative;
    // border-width: 0;
    // height: 60px;
    // left: 20px;
    // letter-spacing: normal;
    // line-height: normal;
    // margin-bottom: 0;
    // text-decoration: none;
    // color: #005462;
    // color: white;
    // cursor: pointer;
    // opacity: 0;
          style={{
            position: 'relative',
            borderWidth: 0,
            height: 60,
            left: 20,
            letterSpacing: 'normal',
            lineHeight: 'normal',
            marginBottom: 0,
            textDecoration: 'none',
            color: 'white',
            cursor: 'pointer',
            // opacity: 0,
          }}
          >
          {audioTotal.value} Inspelningar
        </span>
      }
      {
        total//! fetchingPage
        && (
          <div className="popup-wrapper">
            {
              total.value > 0
              && !loading
              && (
                <div
                  className={[
                    'popup-open-button',
                    'visible',
                    'ignore-expand-menu',
                  ].join(' ')}
                  onClick={openButtonClickHandler}
                  onKeyUp={openButtonKeyUpHandler}
                  tabIndex={0}
                  type="button"
                >
                  <span className="ignore-expand-menu">
                    <FontAwesomeIcon icon={faList} />
                    {' '}
                    Visa
                    {' '}
                    {total.value}
                    {total.relation === 'gte' ? '+' : ''}
                    {' '}
                    sökträffar som lista
                  </span>
                </div>
              )
            }
            {loading
              && (
                <div className="popup-open-button visible ignore-expand-menu" style={{ cursor: 'unset' }}>
                  <span className="ignore-expand-menu">Söker...</span>
                </div>
              )}
            {
              total.value === 0
              && !loading
              && (
                <div className="popup-open-button visible ignore-expand-menu" style={{ cursor: 'unset' }}>
                  <span className="ignore-expand-menu">0 sökträffar</span>
                </div>
              )
            }
          </div>
        )
      }
    </>
  );
}
