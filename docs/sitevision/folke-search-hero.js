/**
 * SiteVision adapter for Folke's intro search.
 *
 * Publish this file as folke-search-hero.js on /folke/start. Folke owns the
 * suggestion data and actions; this file only renders the cross-origin UI.
 */
(function () {
  'use strict';

  var HERO_ID = 'folke-iframe-search';
  var STYLE_ID = 'folke-iframe-search-styles';
  var INPUT_ID = 'folke-search-input';
  var LIST_ID = 'folke-search-suggestions';
  var OPTION_ID_PREFIX = 'folke-search-suggestion';
  var MAX_CAPABILITY_ATTEMPTS = 5;
  var parentOrigin = '*';
  var capabilityConfirmed = false;
  var retryTimer = null;
  var attempts = 0;
  var initialized = false;
  var suggestionsSupported = false;
  var latestRequestId = 0;
  var activeIndex = -1;
  var flatOptions = [];
  var input = null;
  var button = null;
  var listbox = null;
  var status = null;

  try {
    var referrerOrigin = new URL(document.referrer).origin;
    if (referrerOrigin && referrerOrigin !== 'null') {
      parentOrigin = referrerOrigin;
    }
  } catch (error) {
    // Use wildcard when the referrer is missing or cannot be parsed.
  }

  function postToParent(message) {
    window.parent.postMessage(message, parentOrigin);
  }

  function closeSuggestions() {
    activeIndex = -1;
    flatOptions = [];
    if (!input || !listbox) return;
    input.setAttribute('aria-expanded', 'false');
    input.removeAttribute('aria-activedescendant');
    listbox.hidden = true;
    listbox.replaceChildren();
  }

  function setActiveOption(nextIndex) {
    if (!flatOptions.length) return;
    activeIndex = (nextIndex + flatOptions.length) % flatOptions.length;
    flatOptions.forEach(function (option, index) {
      var selected = index === activeIndex;
      option.element.setAttribute('aria-selected', String(selected));
      option.element.classList.toggle('is-active', selected);
    });
    var activeOption = flatOptions[activeIndex];
    input.setAttribute('aria-activedescendant', activeOption.element.id);
    activeOption.element.scrollIntoView({ block: 'nearest' });
  }

  function selectOption(index) {
    var option = flatOptions[index];
    if (!option) return;
    status.textContent = 'Öppnar sökresultatet.';
    postToParent({
      type: 'introSearchSuggestionSelect',
      requestId: latestRequestId,
      suggestionId: option.suggestionId
    });
    closeSuggestions();
  }

  function appendHighlightedText(element, value, query) {
    var text = typeof value === 'string' ? value : '';
    var needle = query.trim();
    var matchIndex = needle
      ? text.toLocaleLowerCase('sv').indexOf(needle.toLocaleLowerCase('sv'))
      : -1;

    if (matchIndex < 0) {
      element.appendChild(document.createTextNode(text));
      return;
    }

    element.appendChild(document.createTextNode(text.slice(0, matchIndex)));
    var mark = document.createElement('mark');
    mark.textContent = text.slice(matchIndex, matchIndex + needle.length);
    element.appendChild(mark);
    element.appendChild(document.createTextNode(
      text.slice(matchIndex + needle.length)
    ));
  }

  function createOption(item, query, index) {
    var option = document.createElement('div');
    option.id = OPTION_ID_PREFIX + '-' + index;
    option.className = 'folke-search__option';
    option.setAttribute('role', 'option');
    option.setAttribute('aria-selected', 'false');

    var primary = document.createElement('span');
    appendHighlightedText(primary, item.label, query);
    option.appendChild(primary);

    if (item.secondaryLabel) {
      var secondary = document.createElement('small');
      secondary.appendChild(document.createTextNode(' '));
      appendHighlightedText(secondary, item.secondaryLabel, query);
      option.appendChild(secondary);
    }

    if (
      item.comment
      && item.comment.toLocaleLowerCase('sv')
        .includes(query.trim().toLocaleLowerCase('sv'))
    ) {
      var comment = document.createElement('small');
      comment.className = 'folke-search__comment';
      appendHighlightedText(comment, item.comment, query);
      option.appendChild(comment);
    }

    option.addEventListener('pointerdown', function (event) {
      event.preventDefault();
      selectOption(index);
    });
    option.addEventListener('pointerenter', function () {
      setActiveOption(index);
    });

    return option;
  }

  function renderSuggestions(groups, query, loading) {
    closeSuggestions();
    if (document.activeElement !== input) return;
    input.setAttribute('aria-busy', String(loading));

    groups.forEach(function (group) {
      if (!group || !Array.isArray(group.items) || !group.items.length) return;

      var groupElement = document.createElement('div');
      groupElement.className = 'folke-search__group';
      groupElement.setAttribute('role', 'group');
      groupElement.setAttribute('aria-label', group.label || 'Sökförslag');

      var heading = document.createElement('div');
      heading.className = 'folke-search__group-heading';
      heading.setAttribute('aria-hidden', 'true');
      heading.textContent = group.label || 'Sökförslag';
      groupElement.appendChild(heading);

      group.items.forEach(function (item) {
        if (!item || typeof item.id !== 'string' || typeof item.label !== 'string') {
          return;
        }
        var index = flatOptions.length;
        var optionElement = createOption(item, query, index);
        flatOptions.push({
          element: optionElement,
          suggestionId: item.id
        });
        groupElement.appendChild(optionElement);
      });

      if (groupElement.querySelector('[role="option"]')) {
        listbox.appendChild(groupElement);
      }
    });

    if (!flatOptions.length) {
      status.textContent = loading ? 'Söker efter förslag.' : 'Inga sökförslag.';
      return;
    }

    listbox.hidden = false;
    input.setAttribute('aria-expanded', 'true');
    status.textContent = flatOptions.length + (
      flatOptions.length === 1
        ? ' sökförslag tillgängligt.'
        : ' sökförslag tillgängliga.'
    );
  }

  function requestSuggestions() {
    if (!suggestionsSupported || !input) return;
    latestRequestId += 1;
    closeSuggestions();
    input.setAttribute('aria-busy', 'true');
    postToParent({
      type: 'introSearchSuggestionsRequest',
      requestId: latestRequestId,
      search: input.value
    });
  }

  function addStyles() {
    if (document.getElementById(STYLE_ID)) return;
    var style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      #${HERO_ID}, #${HERO_ID} * { box-sizing: border-box; }
      #${HERO_ID} {
        margin: 0 0 2rem;
        padding: clamp(1.75rem, 5vw, 3rem) 1rem;
        border-bottom: 1px solid #d1d5db;
        background: #fff;
        color: #111827;
        text-align: center;
      }
      #${HERO_ID} .folke-search__inner {
        width: 100%; max-width: 50rem; margin: 0 auto;
      }
      #${HERO_ID} .folke-search__heading {
        margin: 0 0 1.25rem; color: #111827; line-height: 1.2;
      }
      #${HERO_ID} .folke-search__form {
        display: grid; grid-template-columns: minmax(0, 1fr) auto;
        gap: .5rem; margin: 0;
      }
      #${HERO_ID} .folke-search__combobox { position: relative; min-width: 0; }
      #${HERO_ID} .folke-search__input {
        width: 100%; min-width: 0; min-height: 3rem; margin: 0;
        padding: .75rem; border: 1px solid #6b7280; border-radius: .375rem;
        background: #fff; color: #111827; font: inherit; font-size: 16px;
      }
      #${HERO_ID} .folke-search__input::placeholder { color: #6b7280; opacity: 1; }
      #${HERO_ID} .folke-search__button {
        display: inline-flex; min-height: 3rem; align-items: center;
        justify-content: center; gap: .5rem; margin: 0; padding: .75rem 1.25rem;
        border: 2px solid transparent; border-radius: .375rem;
        background: #005462; color: #fff; cursor: pointer;
        font: inherit; font-weight: 600;
      }
      #${HERO_ID} .folke-search__button:hover:not(:disabled) { background: #003f49; }
      #${HERO_ID} .folke-search__button:disabled {
        background: #d1d5db; color: #374151; cursor: not-allowed;
      }
      #${HERO_ID} .folke-search__input:focus-visible,
      #${HERO_ID} .folke-search__button:focus-visible {
        outline: 3px solid #005462; outline-offset: 2px;
      }
      #${HERO_ID} .folke-search__suggestions {
        position: absolute; z-index: 10; top: calc(100% + .5rem); right: 0; left: 0;
        max-height: 24rem; margin: 0; padding: .25rem 0; overflow-y: auto;
        border: 1px solid #9ca3af; border-radius: .5rem;
        background: #fff; color: #111827; text-align: left;
        box-shadow: 0 10px 20px rgb(0 0 0 / 18%);
      }
      #${HERO_ID} .folke-search__group { padding: .25rem 0; }
      #${HERO_ID} .folke-search__group-heading {
        position: sticky; top: 0; padding: .5rem 1rem .25rem;
        background: #fff; color: #4b5563; font-size: .75rem;
        font-weight: 600; letter-spacing: .04em; text-transform: uppercase;
      }
      #${HERO_ID} .folke-search__option {
        padding: .6rem 1rem; border-radius: .25rem; cursor: pointer;
      }
      #${HERO_ID} .folke-search__option:hover,
      #${HERO_ID} .folke-search__option.is-active { background: #e5f1f2; }
      #${HERO_ID} .folke-search__option mark {
        background: transparent; color: inherit; font-weight: 700;
      }
      #${HERO_ID} .folke-search__comment { display: block; color: #4b5563; }
      #${HERO_ID} .folke-search__assistive {
        position: absolute; width: 1px; height: 1px; margin: -1px; padding: 0;
        overflow: hidden; clip-path: inset(50%); white-space: nowrap; border: 0;
      }
      #${HERO_ID} .folke-search__icon { width: 1rem; height: 1rem; fill: currentColor; }
      @media (max-width: 639px) {
        #${HERO_ID} .folke-search__form { grid-template-columns: 1fr; }
      }
      @media (prefers-color-scheme: dark) {
        #${HERO_ID} {
          color-scheme: dark; border-bottom-color: #37535b;
          background: #111b20; color: #e7f2f0;
        }
        #${HERO_ID} .folke-search__heading { color: #e7f2f0; }
        #${HERO_ID} .folke-search__input {
          border-color: #466670; background: #0f1b20;
          color: #e7f2f0; caret-color: #e7f2f0;
        }
        #${HERO_ID} .folke-search__input::placeholder { color: #9fb4b0; }
        #${HERO_ID} .folke-search__button { background: #006f7c; }
        #${HERO_ID} .folke-search__button:hover:not(:disabled) { background: #005462; }
        #${HERO_ID} .folke-search__button:disabled {
          background: #293d45; color: #8fa19e;
        }
        #${HERO_ID} .folke-search__input:focus-visible,
        #${HERO_ID} .folke-search__button:focus-visible { outline-color: #8bf5e7; }
        #${HERO_ID} .folke-search__suggestions {
          border-color: #466670; background: #0f1b20; color: #e7f2f0;
        }
        #${HERO_ID} .folke-search__group-heading {
          background: #0f1b20; color: #9fb4b0;
        }
        #${HERO_ID} .folke-search__option:hover,
        #${HERO_ID} .folke-search__option.is-active { background: #293d45; }
        #${HERO_ID} .folke-search__comment { color: #9fb4b0; }
      }
    `;
    document.head.appendChild(style);
  }

  function initFolkeSearch(enableSuggestions) {
    if (initialized || window.parent === window) return;
    if (window.location.pathname.replace(/\/+$/, '') !== '/folke/start') return;
    var main = document.querySelector('main');
    if (!main || document.getElementById(HERO_ID)) return;

    initialized = true;
    suggestionsSupported = enableSuggestions;
    addStyles();

    var hero = document.createElement('section');
    hero.id = HERO_ID;
    hero.setAttribute('aria-labelledby', 'folke-search-heading');
    hero.innerHTML = `
      <div class="folke-search__inner">
        <h1 id="folke-search-heading" class="folke-search__heading">
          Sök i Isofs digitala arkiv
        </h1>
        <form class="folke-search__form" role="search"
          aria-labelledby="folke-search-heading" autocomplete="off">
          <label class="folke-search__assistive" for="${INPUT_ID}">Sök i Folke</label>
          <span id="folke-search-help" class="folke-search__assistive">
            Ange ett eller flera sökord.
          </span>
          <div class="folke-search__combobox">
            <input id="${INPUT_ID}" class="folke-search__input"
              name="folke-search-query" type="search" placeholder="Sök i Folke"
              autocomplete="off" inputmode="search" enterkeyhint="search"
              autocapitalize="none" spellcheck="false"
              aria-describedby="folke-search-help" data-1p-ignore="true"
              data-lpignore="true" data-bwignore="true" data-form-type="other">
            <div id="${LIST_ID}" class="folke-search__suggestions"
              role="listbox" aria-label="Sökförslag" hidden></div>
          </div>
          <button class="folke-search__button" type="submit" disabled>
            <svg class="folke-search__icon" viewBox="0 0 20 20"
              aria-hidden="true" focusable="false">
              <path d="M8.5 3a5.5 5.5 0 1 0 3.47 9.77l3.63 3.63 1.4-1.4-3.63-3.63A5.5 5.5 0 0 0 8.5 3Zm0 2a3.5 3.5 0 1 1 0 7 3.5 3.5 0 0 1 0-7Z"></path>
            </svg>
            Sök
          </button>
          <span id="folke-search-status" class="folke-search__assistive"
            role="status" aria-live="polite"></span>
        </form>
      </div>
    `;
    main.insertBefore(hero, main.firstChild);

    var form = hero.querySelector('.folke-search__form');
    input = hero.querySelector('.folke-search__input');
    button = hero.querySelector('.folke-search__button');
    listbox = hero.querySelector('.folke-search__suggestions');
    status = hero.querySelector('#folke-search-status');

    if (suggestionsSupported) {
      hero.querySelector('#folke-search-help').textContent =
        'Ange ett eller flera sökord. Sökförslag kan väljas med upp- och nedpil.';
      input.setAttribute('role', 'combobox');
      input.setAttribute('aria-autocomplete', 'list');
      input.setAttribute('aria-controls', LIST_ID);
      input.setAttribute('aria-expanded', 'false');
    }

    input.addEventListener('focus', requestSuggestions);
    input.addEventListener('input', function () {
      button.disabled = input.value.trim().length === 0;
      status.textContent = '';
      requestSuggestions();
    });
    input.addEventListener('blur', closeSuggestions);
    input.addEventListener('keydown', function (event) {
      if (event.key === 'ArrowDown' && flatOptions.length) {
        event.preventDefault();
        setActiveOption(activeIndex + 1);
      } else if (event.key === 'ArrowUp' && flatOptions.length) {
        event.preventDefault();
        setActiveOption(activeIndex < 0 ? flatOptions.length - 1 : activeIndex - 1);
      } else if (event.key === 'Enter' && activeIndex >= 0) {
        event.preventDefault();
        selectOption(activeIndex);
      } else if (event.key === 'Escape' && !listbox.hidden) {
        event.preventDefault();
        closeSuggestions();
      } else if (event.key === 'Tab') {
        closeSuggestions();
      }
    });

    form.addEventListener('submit', function (event) {
      event.preventDefault();
      var searchTerm = input.value.trim();
      if (!searchTerm) {
        input.focus();
        return;
      }
      closeSuggestions();
      status.textContent = 'Öppnar sökresultatet.';
      postToParent({ type: 'introSearch', search: searchTerm });
    });
  }

  function handleParentMessage(event) {
    if (event.source !== window.parent) return;
    if (parentOrigin !== '*' && event.origin !== parentOrigin) return;
    if (!event.data) return;

    if (
      event.data.type === 'introSearchCapabilityResponse'
      && event.data.supported === true
      && (event.data.version === 1 || event.data.version === 2)
    ) {
      capabilityConfirmed = true;
      if (retryTimer !== null) window.clearTimeout(retryTimer);
      initFolkeSearch(
        event.data.version >= 2 && event.data.suggestions === true
      );
      return;
    }

    if (
      event.data.type === 'introSearchSuggestionsResponse'
      && suggestionsSupported
      && event.data.requestId === latestRequestId
      && Array.isArray(event.data.groups)
    ) {
      renderSuggestions(
        event.data.groups,
        input.value,
        event.data.loading === true
      );
    }
  }

  function sendCapabilityRequest() {
    if (capabilityConfirmed) return;
    attempts += 1;
    postToParent({ type: 'introSearchCapabilityRequest', version: 2 });
    if (attempts < MAX_CAPABILITY_ATTEMPTS) {
      retryTimer = window.setTimeout(sendCapabilityRequest, 400);
    }
  }

  function requestIntroSearchCapability() {
    if (window.parent === window) return;
    if (window.location.pathname.replace(/\/+$/, '') !== '/folke/start') return;
    window.addEventListener('message', handleParentMessage);
    sendCapabilityRequest();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', requestIntroSearchCapability, {
      once: true
    });
  } else {
    requestIntroSearchCapability();
  }
}());
