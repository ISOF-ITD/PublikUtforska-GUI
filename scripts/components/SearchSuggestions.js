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

    const renderSuggestions = (title, label, suggestions, clickHandler, field) => {
      const filteredSuggestions = suggestions().filter((suggestion, index) => index < config[`numberOf${title}Suggestions`]);
      if (filteredSuggestions.length === 0) {
        return null;
      }
      return (
        <>
          <span className="suggestions-label">{label}</span>
          {filteredSuggestions.map((item) => (
            <li
              className="suggestions-item"
              key={item.value}
              onClick={() => clickHandler({ [`${title.toLowerCase()}Label`]: item.label, [`${title.toLowerCase()}Value`]: item.value })}
              tabIndex="0"
              onKeyDown={inputKeyPressHandler}
              data-value={item.value}
              data-field={field}
            >
              {/* make matching characters bold */}
              {
                item.label.split(new RegExp(`(${search})`, 'gi')).map((part, i) => (
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
          ))}
        </>
      );
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
        {renderSuggestions('Search', 'Vanligaste sökningar', filteredSearchSuggestions, suggestionClickHandler)}
        {renderSuggestions('Person', 'Personer', filteredPersonSuggestions, personClickHandler, 'person')}
        {renderSuggestions('Place', 'Orter', filteredPlaceSuggestions, placeClickHandler, 'place')}
      </ul>
    );
  },
);

export default SearchSuggestions;
