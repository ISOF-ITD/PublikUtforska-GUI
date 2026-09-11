import { useState } from 'react';
import PropTypes from 'prop-types';
import {
  Menu, MenuButton, MenuItem, MenuItems,
} from '@headlessui/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCheck, faChevronDown, faGrip, faTable,
} from '@fortawesome/free-solid-svg-icons';
import { l } from '../../../lang/Lang';
import { RESULT_TOOLBAR_BUTTON_CLASS } from './resultListStyles';

const VIEW_OPTIONS = [
  {
    value: 'table',
    label: 'Tabell',
    icon: faTable,
  },
  {
    value: 'cards',
    label: 'Kort',
    icon: faGrip,
  },
];

export default function RecordViewToggle({ value, onChange }) {
  const [viewAnnouncement, setViewAnnouncement] = useState('');
  const currentOption = VIEW_OPTIONS.find((option) => option.value === value)
    || VIEW_OPTIONS[0];
  const buttonLabel = `${l('Visa som')}: ${l(currentOption.label)}`;

  const handleChange = (option) => {
    onChange(option.value);
    setViewAnnouncement(
      `${l('Visningsläge ändrat till')} ${l(option.label)}.`,
    );
  };

  return (
    <Menu as="div" className="relative hidden md:block">
      <MenuButton
        type="button"
        className={RESULT_TOOLBAR_BUTTON_CLASS}
      >
        <FontAwesomeIcon icon={currentOption.icon} aria-hidden="true" />
        <span>{buttonLabel}</span>
        <FontAwesomeIcon icon={faChevronDown} aria-hidden="true" />
      </MenuButton>

      <MenuItems
        transition
        className={[
          'absolute right-0 z-20 mt-2 w-max min-w-full rounded border border-border',
          'bg-surface p-1 text-body shadow-lg transition duration-100 ease-out',
          'focus:outline-none data-[closed]:scale-95 data-[closed]:opacity-0',
        ].join(' ')}
      >
        {VIEW_OPTIONS.map((option) => {
          const isSelected = option.value === value;

          return (
            <MenuItem key={option.value}>
              {({ focus }) => (
                <button
                  type="button"
                  aria-current={isSelected ? 'true' : undefined}
                  onClick={() => handleChange(option)}
                  className={[
                    'flex w-full items-center gap-2 whitespace-nowrap rounded px-3 py-2 text-left',
                    focus ? 'bg-surface-hover' : '',
                    'focus:outline-none',
                  ].join(' ')}
                >
                  <span className="inline-flex w-4 justify-center" aria-hidden="true">
                    {isSelected && <FontAwesomeIcon icon={faCheck} />}
                  </span>
                  <FontAwesomeIcon icon={option.icon} aria-hidden="true" />
                  <span>{l(option.label)}</span>
                  {isSelected && (
                    <span className="sr-only">{` (${l('valt')})`}</span>
                  )}
                </button>
              )}
            </MenuItem>
          );
        })}
      </MenuItems>

      <p className="sr-only" aria-live="polite" aria-atomic="true">
        {viewAnnouncement}
      </p>
    </Menu>
  );
}

RecordViewToggle.propTypes = {
  value: PropTypes.oneOf(['table', 'cards']).isRequired,
  onChange: PropTypes.func.isRequired,
};
