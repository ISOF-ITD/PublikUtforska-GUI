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
      filteredProvinceSuggestions,
      inputKeyPressHandler,
      search,
      personClickHandler,
      placeClickHandler,
      provinceClickHandler,
      suggestionClickHandler,
    },
    ref,
  ) => {
    SearchSuggestions.propTypes = {
      closeSuggestionsHandler: PropTypes.func.isRequired,
      filteredPersonSuggestions: PropTypes.func.isRequired,
      filteredPlaceSuggestions: PropTypes.func.isRequired,
      filteredSearchSuggestions: PropTypes.func.isRequired,
      filteredProvinceSuggestions: PropTypes.func.isRequired,
      inputKeyPressHandler: PropTypes.func.isRequired,
      search: PropTypes.string.isRequired,
      personClickHandler: PropTypes.func.isRequired,
      placeClickHandler: PropTypes.func.isRequired,
      provinceClickHandler: PropTypes.func.isRequired,
      suggestionClickHandler: PropTypes.func.isRequired,
    };

    const renderSuggestions = (title, label, suggestions, clickHandler, field, maxHeight) => {
      const filteredSuggestions = config[`numberOf${title}Suggestions`]
        ? suggestions().filter((suggestion, index) => index < config[`numberOf${title}Suggestions`])
        : suggestions();
      if (filteredSuggestions.length === 0) {
        return null;
      }
      return (
        <div style={{ maxHeight, overflowY: 'auto' }}>
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
                item.label.split(new RegExp(`(${search
                  // put all special characters in a character class
                  ? search.replace(/([.*+?^=!:${}()|[\\/\\])/g, '[$1]')
                  : ''})`, 'gi')).map((part, i) => (
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
              {/* make matching characters in item.comment bold. */}
              <br />
              {
                // show comment if it exists and if it matches the search
                item.comment?.toLowerCase().includes(search.toLowerCase())
                && item.comment.split(new RegExp(`(${search})`, 'gi')).map((part, i) => (
                  <small
                    key={i}
                    style={{
                      fontWeight: part.toLowerCase() === (search ? search.toLowerCase() : '') ? 'bold' : 'normal',
                    }}
                  >
                    {part}
                  </small>
                ))
              }
            </li>
          ))}
        </div>
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
        {renderSuggestions('Search', 'Vanligaste sökningar', filteredSearchSuggestions, suggestionClickHandler, 350)}
        {renderSuggestions('Person', 'Personer', filteredPersonSuggestions, personClickHandler, 'person', 175)}
        {renderSuggestions('Place', 'Orter', filteredPlaceSuggestions, placeClickHandler, 'place', 175)}
        {renderSuggestions('Province', 'Landskap', filteredProvinceSuggestions, provinceClickHandler, 'place', 175)}
      </ul>
    );
  },
);

export default SearchSuggestions;
