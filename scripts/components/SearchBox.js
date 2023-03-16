import { useNavigate, useRouteLoaderData, useLoaderData } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faList } from '@fortawesome/free-solid-svg-icons';
import { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';

import config from '../config';

import Lang from '../../ISOF-React-modules/lang/Lang';
import { createParamsFromSearchRoute } from '../utils/routeHelper';

export default function SearchBox({ mode, params, recordsData }) {
  SearchBox.propTypes = {
    // expanded: PropTypes.bool.isRequired,
    mode: PropTypes.string.isRequired,
    params: PropTypes.object.isRequired,
    recordsData: PropTypes.object.isRequired,
  };

  const searchInputRef = useRef();
  const suggestionsRef = useRef();
  const suggestionsCloseRef = useRef();

  // const [fetchingPage, setFetchingPage] = useState(false);
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const [suggestionsVisible, setSuggestionsVisible] = useState(false);
  const [search, setSearch] = useState('');

  const { search: searchParam } = createParamsFromSearchRoute(params['*']);
  const navigate = useNavigate();

  // const { metadata: { total: totalFromSearchRoute }} = useRouteLoaderData('search') || { metadata: { total: null } };
  // const { metadata: { total: totalFromRecordsRoute }} = useRouteLoaderData('records') || { metadata: { total: null } };
  // const { metadata: { total: totalFromRootRoute }}= useRouteLoaderData('/') || { metadata: { total: null } };
  // const { metadata: { total: totalFromTranscribeRoute }}= useRouteLoaderData('transcribe') || { metadata: { total: null } };

  // const dataFromRecordsRoute = useRouteLoaderData('records');
  // const dataFromRootRoute = useRouteLoaderData('/');
  // const dataFromTranscribeRoute = useRouteLoaderData('transcribe');

  // const total = mode === 'transcribe'
  const { metadata: { total } } = recordsData;
  // : totalFromSearchRoute || totalFromRecordsRoute || totalFromRootRoute;

  const l = Lang.get;

  const executeSearch = (keyword) => {
    // if keyword is a string, use it as search phrase
    // otherwise use the value of the search input field
    const searchPhrase = typeof keyword === 'string' ? keyword : searchInputRef.current.value;
    const transcribePrefix = mode === 'transcribe' ? 'transcribe/' : '';
    const searchPart = searchPhrase ? `search/${searchPhrase}?s=${searchPhrase}` : '';
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
      setSearchSuggestions(json);
    });
  };

  // const totalRecordsHandler = (e) => {
  //   setTotalRecords(e.target);
  // };

  const openButtonClickHandler = () => {
    if (window.eventBus) {
      window.eventBus.dispatch('routePopup.show');
    }
  };

  // const fetchingPageHandler = (e) => {
  //   setFetchingPage(e.target);
  // };

  // useEffect(() => {
  //   if (location.pathname.indexOf('/places') === 0) {
  //     executeSearch();
  //   }
  // }, [searchParamsState.has_media, searchParamsState.has_transcribed_records]);

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
  }, []);

  useEffect(() => {
    setSearch(searchParam);
  }, [searchParam]);

  // useEffect(() => {
  //   // setSearchParamsState(routeHelper.createParamsFromSearchRoute(params['*']));
  //   // setSearch(routeHelper.createParamsFromSearchRoute(params['*']).search);
  // }, [location.pathname]);

  const openButtonKeyUpHandler = (e) => {
    if (e.keyCode === 13) {
      openButtonClickHandler(e);
    }
  };

  // filter keywords by search input value
  const filteredSearchSuggestions = () => searchSuggestions.filter((keyword) => keyword.label.toLowerCase().indexOf(search?.toLowerCase() || '') > -1);

  const closeSuggestionsHandler = () => {
    searchInputRef.current.focus();
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
      executeSearch(e.target.dataset.value);
    }
    if (e.key === 'Escape') {
      closeSuggestionsHandler();
    }
    // if keydown and suggestionsRef.current.contains(event.target)), change to next suggestion
    if (e.key === 'ArrowDown'
      && suggestionsRef.current && suggestionsRef.current.contains(e.target)) {
      const next = e.target.nextElementSibling;
      if (next) {
        next.focus();
      }
    }
    // if keyup and suggestionsRef.current.contains(event.target)), change to previous suggestion
    if (e.key === 'ArrowUp'
      && suggestionsRef.current && suggestionsRef.current.contains(e.target)) {
      const prev = e.target.previousElementSibling;
      if (prev) {
        prev.focus();
      }
    }
    // if keyup and (event.target === searchInputRef.current), change focus to first suggestion
    if (e.key === 'ArrowDown' && suggestionsRef.current && (e.target === searchInputRef.current)) {
      const first = suggestionsRef.current.firstElementChild;
      if (first) {
        first.focus();
      }
    }
    // if keydown and focus is on first suggestion, change focus to searchInputRef
    if (e.key === 'ArrowUp'
      && suggestionsRef.current && suggestionsRef.current.contains(e.target)) {
      const first = suggestionsRef.current.firstElementChild;
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

  const suggestionClickHandler = (keyword) => {
    setSuggestionsVisible(false);
    // set the searchParamsState, but only update the search field
    // setSearch({
    //   search: keyword,
    // });
    // setSearch(keyword);
    executeSearch(keyword);
  };

  // set suggestionsVisible to true when the search input is focused
  const searchInputFocusHandler = () => {
    setSuggestionsVisible(true);
  };

  // set suggestionsVisible to false when the search input is blurred
  // but retain focus if the suggestionsCloseButton is clicked. do
  // not close the suggestions if the focus is moved to the suggestions list or the search input
  const searchInputBlurHandler = (e) => {
    const refocusSearchField = e.relatedTarget === suggestionsCloseRef.current;
    let close = !!suggestionsRef.current;
    if (close) {
      close = !suggestionsRef.current.contains(e.relatedTarget);
      close = close && e.relatedTarget !== suggestionsCloseRef.current;
    }

    // https://stackoverflow.com/a/9886348
    // Vi can't set focus in the same event handler that the blur event is fired in
    // so we have to use setTimeout
    window.setTimeout(() => {
      if (refocusSearchField) {
        searchInputRef.current.focus();
      }
      if (close) {
        setSuggestionsVisible(false);
      }
    }, 0);
  };

  // const categoryItemClickHandler = (e) => {
  //   // get the clicked category
  //   const selectedCategory = categories.categories[e.target.dataset.index].letter;
  //   // derive already selected categories from the current searchParams
  //   const currentSelectedCategories = searchParams.category && searchParams.category.split(',');
  //   let selectedCategories = [];
  //   // if the clicked category is part of the current search params,
  //   remove it from the current search params
  //   if (currentSelectedCategories && currentSelectedCategories.includes(selectedCategory)) {
  //     selectedCategories = currentSelectedCategories.filter((c) => c !== selectedCategory);
  //   // else, check if list of current selected categories is not empty
  //   // then add the clicked category
  //   } else if (currentSelectedCategories) {
  //     selectedCategories = currentSelectedCategories;
  //     selectedCategories.push(selectedCategory);
  //     // otherwise (no categories are in the search params), the new list of
  //      //selected categories will a list with a single item, i.e. the clicked category
  //   } else {
  //     selectedCategories = [selectedCategory];
  //   }

  //   // create a new params object and change its category to the newly created list
  //   const params = { ...searchParams };
  //   params.category = selectedCategories.join(',');

  //   // create a search route from the params object
  //   const path = `/places${routeHelper.createSearchRoute(params)}`;

  //   // set the route. All components that read from the route will change their state accordingly
  //   navigate(path);
  // };

  // Lägg nytt värde till state om valt värde ändras i sökfält, kategorilistan eller andra sökfält
  const searchValueChangeHandler = (e) => {
    if (e.target.value !== search) {
      setSearch(e.target.value);
    }
  };

  const clearSearch = () => {
    // const searchParams = { searchParamsState };
    // searchParams.search = '';
    setSearch(
      '',
    );
    executeSearch('');
    document.getElementById('searchInputMapMenu').value = '';
    document.getElementById('searchInputMapMenu').focus();
  };

  // const checkboxChangeHandler = (e) => {
  //   if (e.target.name === 'filter') {
  //     // for "Digitaliserat", "Avskrivet", "Allt"
  //     if (!searchParamsState[e.target.value]) {
  //       // const searchParams = { ...searchParamsState };
  //       // searchParams['has_media'] = undefined;
  //       // searchParams['has_transcribed_records'] = undefined;
  //       // if (e.target.value !== 'all') {
  //       //   searchParams[e.target.value] = 'true';
  //       // }
  //       setSearchParamsState({
  //         ...searchParamsState,
  //         has_media: undefined,
  //         has_transcribed_records: undefined,
  //         [e.target.value]: e.target.value !== 'all' ? 'true' : searchParamsState[e.target.value],
  //       });
  //     }
  //     // for "Innehåll", "Person", "Ort"
  //   } else if (e.target.value !== searchParamsState[e.target.name]) {
  //     // const searchParams = { ...searchParamsState };
  //     // if (e.target.value === 'false') {
  //     //   searchParams[e.target.name] = undefined;
  //     // } else {
  //     //   searchParams[e.target.name] = e.target.value;
  //     // }
  //     setSearchParamsState({
  //       ...searchParamsState,
  //       [e.target.name]: e.target.value === 'false' ? undefined : e.target.value,
  //     });
  //   }
  // };

  const searchLabelText = () => {
    let label = '';
    if (search) {
      label = 'Innehåll: ';
      // switch (searchParamsState.search_field) {
      //   case 'record':
      //     label = 'Innehåll: ';
      //     break;
      //   case 'person':
      //     label = 'Person: ';
      //     break;
      //   case 'place':
      //     label = 'Ort: ';
      //     break;
      //   default:
      //     label = '';
      // }
    } else {
      label = l('Sök i Folke');
    }
    return label;
  };

  const searchLabelTranscriptionStatusText = () => {
    const label = '';

    // if (searchParamsState.transcriptionstatus) {
    //   if (searchParamsState.transcriptionstatus === 'published') {
    //     label = ' (Avskrivna)';
    //   } else {
    //     label = ' (För avskrift)';
    //   }
    // } else {
    //   label = '';
    // }
    return label;
  };

  return (
    <div
      className={
        // `search-box map-floating-control${expanded ? ' expanded' : ''}${searchParamsState.recordtype === 'one_record' ? ' advanced' : ''}`}>
        'search-box map-floating-control expanded'
      }
    >
      <div>
        <input
          id="searchInputMapMenu"
          ref={searchInputRef}
          type="text"
          // defaultValue={search || ''}
          value={search || ''}
          // onChange={searchValueChangeHandler}
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
          className="search-label"
          style={{
            textOverflow: 'ellipsis',
            overflow: 'hidden',
            whiteSpace: 'nowrap',
            maxWidth: 275,
            display: 'block',
          }}
        >
          {
            searchLabelText()
          }
          <strong>
            {
              search || ''
            }
          </strong>
          {/* {
            searchParamsState.has_media ? ' (Digitaliserat)' : ''
          }
          {
            searchParamsState.has_transcribed_records ? ' (Avskrivet)' : ''
          } */}
          {
            searchLabelTranscriptionStatusText()
          }
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
          mode === 'material'
          && suggestionsVisible && searchSuggestions.length > 0
          // check if keywords filtered by search input value is not empty
          && filteredSearchSuggestions().length > 0
          // if true, show suggestions
          && (
            <div className="suggestions">
              <span className="suggestions-label">Vanligaste sökningar</span>
              <span
                className="suggestions-close"
                onClick={closeSuggestionsHandler}
                tabIndex="0"
                ref={suggestionsCloseRef}
              >
                &times;
              </span>
              <ul ref={suggestionsRef}>
                {
                  // filter keywords by search input value
                  filteredSearchSuggestions()
                    .slice(0, config.numberOfSearchSuggestions).map((keyword) => (
                      <li
                        className="suggestions-item"
                        key={keyword.label}
                        onClick={() => suggestionClickHandler(keyword.label)}
                        tabIndex="0"
                        onKeyDown={inputKeyPressHandler}
                        data-value={keyword.label}
                      >
                        {/* make matching characters bold */}
                        {
                          keyword.label.split(new RegExp(`(${search})`, 'gi')).map((part, i) => (
                            <span
                              key={i}
                              style={{
                                fontWeight: part.toLowerCase() === (search ? search.toLowerCase() : '') ? 'bold' : 'normal',
                              }}
                            >
                              {part}
                            </span>
                          ))
                        }

                      </li>
                    ))
                }

              </ul>
            </div>
          )
}
      </div>
      <div className="search-field-buttons">
        {/* only show clear button when there is text to clear */}
        {
          search && <button className="clear-button" onClick={clearSearch} type="button" aria-label="Rensa sökning" />
        }
        <button className="search-button" onClick={executeSearch} type="button" aria-label="Sök" />
      </div>

      <div className="expanded-content">

        <div className="advanced-content" style={{ display: 'none' }}>
          <h4>Kategorier</h4>
          <div tabIndex={-1} className="list-container minimal-scrollbar">
            {/* <Route
              path={['/places/:place_id([0-9]+)?', '/records/:record_id', '/person/:person_id']}
              render= {(props) => */}
            {/* <CategoryList
                  multipleSelect="true"
                  itemClickHandler={categoryItemClickHandler}
                  {...props}
                /> */}
            {/* }
            /> */}
          </div>
        </div>
        {/* <button className="button-primary" onClick={executeSearch}>{l('Sök')}</button> */}
      </div>
      {
        total//! fetchingPage
        && (
          <div className="popup-wrapper">
            {
              total.value > 0
              && (
                <button
                  className={[
                    'popup-open-button',
                    'map-floating-control',
                    'map-right-control',
                    'visible',
                    'ignore-expand-menu',
                  ].join(' ')}
                  onClick={openButtonClickHandler}
                  onKeyUp={openButtonKeyUpHandler}
                  tabIndex={0}
                  type="button"
                >
                  <strong className="ignore-expand-menu">
                    <FontAwesomeIcon icon={faList} />
                    {' '}
                    Visa
                    {' '}
                    {total.value}
                    {total.relation === 'gte' ? '+' : ''}
                    {' '}
                    sökträffar som lista
                  </strong>
                </button>
              )
            }
            {
              total.value === 0
              && (
                <div className="popup-open-button map-floating-control map-right-control visible ignore-expand-menu" style={{ cursor: 'unset' }}>
                  <strong className="ignore-expand-menu">0 sökträffar</strong>
                </div>
              )
            }
          </div>
        )
      }
    </div>

  );
}
