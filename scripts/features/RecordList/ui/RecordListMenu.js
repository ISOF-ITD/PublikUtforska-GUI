import {
  useEffect, useId, useRef, useState,
} from 'react';
import PropTypes from 'prop-types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faChevronDown } from '@fortawesome/free-solid-svg-icons';

const getOptionLabel = (option) => option.displayLabel || option.label;

export default function RecordListMenu({
  buttonIcon,
  buttonLabel,
  className,
  onSelect,
  options,
}) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const rootRef = useRef(null);
  const buttonRef = useRef(null);
  const itemRefs = useRef([]);
  const pendingFocusIndex = useRef(null);
  const searchRef = useRef('');
  const searchTimerRef = useRef(null);
  const buttonId = useId();
  const menuId = useId();

  const focusItem = (index) => {
    pendingFocusIndex.current = index;
    setActiveIndex(index);
  };

  const openMenu = (index = 0) => {
    focusItem(index);
    setOpen(true);
  };

  const closeMenu = (restoreFocus = false) => {
    setOpen(false);
    searchRef.current = '';

    if (restoreFocus) {
      buttonRef.current?.focus();
    }
  };

  useEffect(() => {
    if (!open || pendingFocusIndex.current === null) {
      return;
    }

    itemRefs.current[pendingFocusIndex.current]?.focus();
    pendingFocusIndex.current = null;
  }, [activeIndex, open]);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const handleOutsidePointerDown = (event) => {
      if (!rootRef.current?.contains(event.target)) {
        closeMenu();
      }
    };

    document.addEventListener('pointerdown', handleOutsidePointerDown);
    return () => document.removeEventListener('pointerdown', handleOutsidePointerDown);
  }, [open]);

  useEffect(() => () => window.clearTimeout(searchTimerRef.current), []);

  const handleButtonClick = () => {
    if (open) {
      closeMenu(true);
      return;
    }

    openMenu();
  };

  const handleButtonKeyDown = (event) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      openMenu();
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      openMenu(options.length - 1);
    }
  };

  const handleMenuKeyDown = (event) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      focusItem((activeIndex + 1) % options.length);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      focusItem((activeIndex - 1 + options.length) % options.length);
    } else if (event.key === 'Home') {
      event.preventDefault();
      focusItem(0);
    } else if (event.key === 'End') {
      event.preventDefault();
      focusItem(options.length - 1);
    } else if (event.key === 'Escape') {
      event.preventDefault();
      closeMenu(true);
    } else if (event.key === 'Tab') {
      setOpen(false);
      buttonRef.current?.focus();
    } else if (event.key.length === 1 && !event.altKey && !event.ctrlKey && !event.metaKey) {
      searchRef.current += event.key.toLocaleLowerCase();
      window.clearTimeout(searchTimerRef.current);
      searchTimerRef.current = window.setTimeout(() => {
        searchRef.current = '';
      }, 350);

      const matchingIndex = options.findIndex(
        (option) => getOptionLabel(option)
          .toLocaleLowerCase()
          .startsWith(searchRef.current),
      );

      if (matchingIndex !== -1) {
        focusItem(matchingIndex);
      }
    }
  };

  const handleSelect = (option) => {
    onSelect(option);
    closeMenu(true);
  };

  return (
    <div ref={rootRef} className={className}>
      <button
        ref={buttonRef}
        id={buttonId}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={handleButtonClick}
        onKeyDown={handleButtonKeyDown}
        className={[
          'flex items-center gap-2 rounded border border-border bg-surface px-3 py-1 text-body',
          'hover:bg-surface-hover focus-visible:outline focus-visible:outline-2',
          'focus-visible:outline-offset-2 focus-visible:outline-focus',
        ].join(' ')}
      >
        <FontAwesomeIcon icon={buttonIcon} aria-hidden="true" />
        <span>{buttonLabel}</span>
        <FontAwesomeIcon icon={faChevronDown} aria-hidden="true" />
      </button>

      {open && (
        <div
          id={menuId}
          role="menu"
          tabIndex={-1}
          aria-labelledby={buttonId}
          onKeyDown={handleMenuKeyDown}
          className={[
            'absolute right-0 z-20 mt-2 w-max min-w-full rounded border border-border',
            'bg-surface p-1 text-body shadow-lg focus:outline-none',
          ].join(' ')}
        >
          {options.map((option, index) => (
            <button
              key={option.key}
              ref={(element) => {
                itemRefs.current[index] = element;
              }}
              type="button"
              role="menuitemradio"
              aria-checked={option.selected}
              tabIndex={-1}
              onClick={() => handleSelect(option)}
              onFocus={() => setActiveIndex(index)}
              onMouseEnter={() => setActiveIndex(index)}
              className={[
                'flex w-full items-center gap-2 whitespace-nowrap rounded px-3 py-2 text-left',
                activeIndex === index ? 'bg-surface-hover' : '',
                'focus:outline-none',
              ].join(' ')}
            >
              <span className="inline-flex w-4 justify-center" aria-hidden="true">
                {option.selected && <FontAwesomeIcon icon={faCheck} />}
              </span>
              {option.icon && <FontAwesomeIcon icon={option.icon} aria-hidden="true" />}
              <span>{getOptionLabel(option)}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

RecordListMenu.propTypes = {
  buttonIcon: PropTypes.object.isRequired,
  buttonLabel: PropTypes.string.isRequired,
  className: PropTypes.string.isRequired,
  onSelect: PropTypes.func.isRequired,
  options: PropTypes.arrayOf(PropTypes.shape({
    displayLabel: PropTypes.string,
    icon: PropTypes.object,
    key: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
    selected: PropTypes.bool.isRequired,
  })).isRequired,
};
