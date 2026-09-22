/* global expect, jest, test */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import SearchPanel from '../SearchPanel';

jest.mock('../hooks/useSearchSuggestions', () => jest.fn(() => ({
  visibleSuggestionGroups: [{
    title: 'Search',
    label: 'Sökningar',
    items: [{ value: 'test', label: 'test' }],
    click: jest.fn(),
  }],
  flatSuggestions: [],
  hasSuggestions: true,
  loading: false,
})));
jest.mock('../hooks/useSelectionFromRoute', () => jest.fn(() => ({
  selectedPerson: null,
  selectedPlace: null,
  selectedArchiveId: null,
})));

const emptyRecords = { data: [], metadata: { total: { value: 0, relation: 'eq' } } };

function renderSearchPanel() {
  render(
    <MemoryRouter>
      <SearchPanel
        recordsData={emptyRecords}
        audioRecordsData={emptyRecords}
        pictureRecordsData={emptyRecords}
        loading={false}
      />
    </MemoryRouter>,
  );
}

test('sökförslagens stängknapp nås med Tab och fungerar med Enter och blanksteg', async () => {
  const user = userEvent.setup();
  renderSearchPanel();
  const input = screen.getByRole('combobox', { name: 'Sök i arkivmaterial' });

  await user.click(input);
  let closeButton = await screen.findByRole('button', { name: 'Stäng förslag' });
  await user.tab();
  expect(closeButton).toHaveFocus();
  await user.keyboard('{Enter}');

  expect(screen.queryByRole('button', { name: 'Stäng förslag' })).not.toBeInTheDocument();
  expect(input).toHaveFocus();

  screen.getByRole('button', { name: 'Sök' }).focus();
  await user.click(input);
  closeButton = await screen.findByRole('button', { name: 'Stäng förslag' });
  await user.tab();
  expect(closeButton).toHaveFocus();
  await user.keyboard(' ');

  expect(screen.queryByRole('button', { name: 'Stäng förslag' })).not.toBeInTheDocument();
  expect(input).toHaveFocus();
});

test('sökförslagen stängs när Tab eller Shift+Tab lämnar panelen', async () => {
  const user = userEvent.setup();
  renderSearchPanel();
  const input = screen.getByRole('combobox', { name: 'Sök i arkivmaterial' });
  const searchButton = screen.getByRole('button', { name: 'Sök' });

  await user.click(input);
  let closeButton = await screen.findByRole('button', { name: 'Stäng förslag' });
  await user.tab();
  expect(closeButton).toHaveFocus();
  await user.tab();

  expect(screen.queryByRole('button', { name: 'Stäng förslag' })).not.toBeInTheDocument();
  expect(searchButton).toHaveFocus();

  await user.click(input);
  closeButton = await screen.findByRole('button', { name: 'Stäng förslag' });
  await user.tab();
  expect(closeButton).toHaveFocus();
  await user.tab({ shift: true });

  expect(screen.queryByRole('button', { name: 'Stäng förslag' })).not.toBeInTheDocument();
  expect(input).toHaveFocus();
});
