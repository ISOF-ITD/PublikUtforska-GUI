import { forwardRef } from 'react';
import PropTypes from 'prop-types';

import config from '../config';

const SearchSuggestions = forwardRef(
  (
    {
      closeSuggestionsHandler,
      filteredPersonSuggestions,
      filteredPlaceSuggestions,
      filteredSearchSuggestions,
      inputKeyPressHandler,
      search,
      personClickHandler,
      placeClickHandler,
      suggestionClickHandler,
    },
    ref,
  ) => {
    SearchSuggestions.propTypes = {
      closeSuggestionsHandler: PropTypes.func.isRequired,
      filteredPersonSuggestions: PropTypes.func.isRequired,
      filteredPlaceSuggestions: PropTypes.func.isRequired,
      filteredSearchSuggestions: PropTypes.func.isRequired,
      inputKeyPressHandler: PropTypes.func.isRequired,
      search: PropTypes.string.isRequired,
      personClickHandler: PropTypes.func.isRequired,
      placeClickHandler: PropTypes.func.isRequired,
      suggestionClickHandler: PropTypes.func.isRequired,
    };

    return (
      <ul className="suggestions" ref={ref}>
        <span
          className="suggestions-close"
          onClick={closeSuggestionsHandler}
          tabIndex="0"
        >
          &times;
        </span>
        {
        filteredPersonSuggestions().length !== 0
        && <span className="suggestions-label">Personer</span>
      }
        {
        // filter persons by search input value
        filteredPersonSuggestions()
          .slice(0, config.numberOfPersonSuggestions).map((person) => (
            <li
              className="suggestions-item"
              key={person.value}
              onClick={() => personClickHandler({ personLabel: person.label, personValue: person.value })}
              tabIndex="0"
              onKeyDown={inputKeyPressHandler}
              data-value={person.value}
              data-field="person"
            >
              {/* make matching characters bold */}
              {
                person.label.split(new RegExp(`(${search})`, 'gi')).map((part, i) => (
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
        {
        filteredPlaceSuggestions().length !== 0
        && <span className="suggestions-label">Orter</span>
      }
        {
        // filter places by search input value
        filteredPlaceSuggestions()
          .slice(0, config.numberOfPlaceSuggestions).map((place) => (
            <li
              className="suggestions-item"
              key={place.value}
              onClick={() => placeClickHandler({ placeLabel: place.label, placeValue: place.value })}
              tabIndex="0"
              onKeyDown={inputKeyPressHandler}
              data-value={place.value}
              data-field="place"
            >
              {/* make matching characters bold */}
              {
                place.label.split(new RegExp(`(${search})`, 'gi')).map((part, i) => (
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
        {
        filteredSearchSuggestions().length !== 0
        && <span className="suggestions-label">Vanligaste sökningar</span>
      }
        {
        // filter keywords by search input value
        filteredSearchSuggestions()
          .slice(0, config.numberOfSearchSuggestions).map((suggestion) => (
            <li
              className="suggestions-item"
              key={suggestion.label}
              onClick={() => suggestionClickHandler(suggestion)}
              tabIndex="0"
              onKeyDown={inputKeyPressHandler}
              data-value={suggestion.label}
            >
              {/* make matching characters bold */}
              {
                suggestion.label.split(new RegExp(`(${search})`, 'gi')).map((part, i) => (
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

        {/* </div> */}
      </ul>
    );
  },
);

export default SearchSuggestions;
