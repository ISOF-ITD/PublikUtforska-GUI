import PropTypes from 'prop-types';
import {
  Menu, MenuButton, MenuItem, MenuItems,
} from '@headlessui/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCheck, faChevronDown, faSort,
} from '@fortawesome/free-solid-svg-icons';
import { l } from '../../../lang/Lang';

const SORT_OPTIONS = [
  {
    field: '_score',
    order: 'desc',
    label: 'Relevans',
  },
  {
    field: 'archive.archive_id_row.keyword',
    order: 'asc',
    label: 'Arkivnummer, stigande',
  },
  {
    field: 'archive.archive_id_row.keyword',
    order: 'desc',
    label: 'Arkivnummer, fallande',
  },
  {
    field: 'year',
    order: 'asc',
    label: 'År, äldst först',
  },
  {
    field: 'year',
    order: 'desc',
    label: 'År, nyast först',
  },
];

export default function RecordSortMenu({
  sort,
  order,
  onChange,
  showRelevance,
}) {
  const visibleSortOptions = showRelevance
    ? SORT_OPTIONS
    : SORT_OPTIONS.filter((option) => option.field !== '_score');
  const currentOption = visibleSortOptions.find(
    (option) => option.field === sort && option.order === order,
  ) || visibleSortOptions[0];
  const buttonLabel = `${l('Sortera')}: ${l(currentOption.label)}`;

  return (
    <Menu as="div" className="relative">
      <MenuButton
        className={[
          'flex items-center gap-2 rounded border border-border bg-surface px-3 py-1 text-body',
          'hover:bg-surface-hover focus-visible:outline focus-visible:outline-2',
          'focus-visible:outline-offset-2 focus-visible:outline-focus',
        ].join(' ')}
      >
        <FontAwesomeIcon icon={faSort} aria-hidden="true" />
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
        {visibleSortOptions.map((option) => {
          const isSelected = option.field === sort && option.order === order;

          return (
            <MenuItem key={`${option.field}-${option.order}`}>
              {({ focus }) => (
                <button
                  type="button"
                  aria-current={isSelected ? 'true' : undefined}
                  onClick={() => onChange(option)}
                  className={[
                    'flex w-full items-center gap-2 whitespace-nowrap rounded px-3 py-2 text-left',
                    focus ? 'bg-surface-hover' : '',
                    'focus:outline-none',
                  ].join(' ')}
                >
                  <span className="inline-flex w-4 justify-center" aria-hidden="true">
                    {isSelected && <FontAwesomeIcon icon={faCheck} />}
                  </span>
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
    </Menu>
  );
}

RecordSortMenu.propTypes = {
  sort: PropTypes.string.isRequired,
  order: PropTypes.oneOf(['asc', 'desc']).isRequired,
  onChange: PropTypes.func.isRequired,
  showRelevance: PropTypes.bool.isRequired,
};
