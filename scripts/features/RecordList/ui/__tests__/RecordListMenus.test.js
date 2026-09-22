/* global describe, expect, jest, test */
import {
  fireEvent, render, screen, waitFor, within,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { faSort } from '@fortawesome/free-solid-svg-icons';
import RecordListMenu from '../RecordListMenu';
import { SORT_OPTIONS, VIEW_OPTIONS } from '../recordListMenuOptions';

const menuCases = [
  {
    name: 'visningsmenyn',
    renderMenu: (onChange) => render(
      <>
        <RecordListMenu
          buttonIcon={VIEW_OPTIONS[0].icon}
          buttonLabel="Visa som: Tabell"
          className="relative"
          onSelect={onChange}
          options={VIEW_OPTIONS.map((option) => ({
            ...option,
            key: option.value,
            selected: option.value === 'table',
          }))}
        />
        <button type="button">Efter menyn</button>
      </>,
    ),
    buttonName: 'Visa som: Tabell',
    firstItemName: /Tabell/,
    secondItemName: 'Kort',
  },
  {
    name: 'sorteringsmenyn',
    renderMenu: (onChange) => render(
      <>
        <RecordListMenu
          buttonIcon={faSort}
          buttonLabel="Sortera: Relevans"
          className="relative"
          onSelect={onChange}
          options={SORT_OPTIONS.map((option) => ({
            ...option,
            key: `${option.field}-${option.order}`,
            selected: option.field === '_score' && option.order === 'desc',
          }))}
        />
        <button type="button">Efter menyn</button>
      </>,
    ),
    buttonName: 'Sortera: Relevans',
    firstItemName: /Relevans/,
    secondItemName: 'Accessionsnummer, stigande',
  },
];

describe.each(menuCases)('$name', ({
  renderMenu,
  buttonName,
  firstItemName,
  secondItemName,
}) => {
  test('öppnas med Enter och fokuserar första menyvalet', async () => {
    const user = userEvent.setup();
    renderMenu(jest.fn());
    const button = screen.getByRole('button', { name: buttonName });

    await user.tab();
    expect(button).toHaveFocus();
    await user.keyboard('{Enter}');

    const menu = await screen.findByRole('menu');
    const firstItem = within(menu).getByRole('menuitemradio', { name: firstItemName });
    expect(firstItem).toHaveFocus();
    expect(firstItem).toHaveAttribute('aria-checked', 'true');
  });

  test('öppnas av ett virtuellt klick efter musanvändning', async () => {
    const user = userEvent.setup();
    renderMenu(jest.fn());
    const button = screen.getByRole('button', { name: buttonName });

    expect(button.tagName).toBe('BUTTON');
    expect(button).toHaveAttribute('aria-haspopup', 'menu');
    await user.click(button);
    await user.click(button);
    expect(button).toHaveAttribute('aria-expanded', 'false');

    fireEvent.click(button, { detail: 0 });

    const menu = await screen.findByRole('menu');
    const firstItem = within(menu).getByRole('menuitemradio', { name: firstItemName });
    await waitFor(() => expect(firstItem).toHaveFocus());
  });

  test('behåller musaktivering och val', async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    renderMenu(onChange);
    const button = screen.getByRole('button', { name: buttonName });

    await user.click(button);
    const menu = await screen.findByRole('menu');
    await user.click(within(menu).getByRole('menuitemradio', { name: firstItemName }));

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(button).toHaveAttribute('aria-expanded', 'false');
    expect(button).toHaveFocus();
  });

  test('stödjer pilnavigation och Escape', async () => {
    const user = userEvent.setup();
    renderMenu(jest.fn());
    const button = screen.getByRole('button', { name: buttonName });

    await user.tab();
    await user.keyboard('{ArrowDown}');
    const menu = await screen.findByRole('menu');
    const secondItem = within(menu).getByRole('menuitemradio', { name: secondItemName });
    await user.keyboard('{ArrowDown}');
    expect(secondItem).toHaveFocus();

    await user.keyboard('{Escape}');
    expect(button).toHaveFocus();
    expect(button).toHaveAttribute('aria-expanded', 'false');
  });

  test('stänger med Tab och fortsätter i dokumentets fokusordning', async () => {
    const user = userEvent.setup();
    renderMenu(jest.fn());
    const button = screen.getByRole('button', { name: buttonName });

    await user.tab();
    await user.keyboard('{Enter}');
    await user.tab();

    expect(screen.getByRole('button', { name: 'Efter menyn' })).toHaveFocus();
    expect(button).toHaveAttribute('aria-expanded', 'false');
  });
});
