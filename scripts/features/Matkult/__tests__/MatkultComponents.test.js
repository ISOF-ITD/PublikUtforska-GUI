/* global afterEach, beforeEach, expect, jest, test */
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, useLocation } from 'react-router-dom';
import MatkultPage from '../MatkultPage';
import MatkultReading from '../MatkultReading';
import MatkultContextBar from '../MatkultContextBar';

jest.mock('../../../utils/helpers', () => ({
  getRecordFetchLocation: (id) => `https://api.test/document/${id}/`,
}));

const record = {
  id: 'mk-kb875',
  title: 'Leverpastej',
  publishstatus: 'published',
  metadata: [{ type: 'matkarta_content', value: 'Ingredienser\nGrädde och lever' }],
  taxonomy: [{ category: 'MK-10' }],
  archive: { archive_id: '29403:14', archive: 'Uppsala' },
  media: [],
};

beforeEach(() => {
  global.fetch = jest.fn(async () => ({
    ok: true, json: async () => ({ found: true, _source: record }),
  }));
});
afterEach(() => jest.restoreAllMocks());

function CurrentLocation() {
  const location = useLocation();
  return (
    <output aria-label="Aktuell adress">
      {location.pathname}
      {location.search}
    </output>
  );
}

test('starten visar dagens recept från API:t och interna länkar med matkontext', async () => {
  render(<MemoryRouter><MatkultPage /></MemoryRouter>);
  const recipeLink = await screen.findByRole('link', { name: 'Läs receptet' });
  expect(recipeLink.getAttribute('href')).toContain('/records/mk-kb875?theme=matkult');
  expect(screen.getByRole('link', { name: 'Öppna kokboken' }).getAttribute('href'))
    .toContain('category=MK-10');
  expect(global.fetch).toHaveBeenCalledTimes(4);
});

test('fel i dagens recept ger möjlighet att försöka igen och komma till kokboken', async () => {
  global.fetch.mockImplementation(async () => ({ ok: false }));
  render(<MemoryRouter><MatkultPage /></MemoryRouter>);
  expect(await screen.findByRole('alert')).toHaveTextContent('Det gick inte');
  expect(screen.getByRole('button', { name: 'Försök igen' })).toBeEnabled();
  expect(screen.getByRole('link', { name: 'Utforska kokboken' })).toHaveAttribute('href', expect.stringContaining('theme=matkult'));
});

test('kartan behåller aktuell kategori och söktext, och breddning görs uttryckligt', () => {
  render(<MemoryRouter initialEntries={['/search?theme=matkult&category=MK-3&q=kaffe']}><MatkultContextBar /></MemoryRouter>);
  const mapQuery = new URL(screen.getByRole('link', { name: 'Kartan' }).href).searchParams;
  expect(mapQuery.get('category')).toBe('MK-3');
  expect(mapQuery.get('q')).toBe('kaffe');
  expect(mapQuery.get('showmap')).toBe('1');
  const broadQuery = new URL(screen.getByRole('link', { name: 'Sök i hela Folke' }).href).searchParams;
  expect(broadQuery.get('q')).toBe('kaffe');
  expect(broadQuery.has('category')).toBe(false);
  expect(broadQuery.has('theme')).toBe(false);
});

test('kategorival går att använda med tangentbord', async () => {
  const user = userEvent.setup();
  render(<MemoryRouter initialEntries={['/search?theme=matkult']}><MatkultContextBar /></MemoryRouter>);
  const select = screen.getByRole('combobox', { name: 'Utforska kategori' });
  await user.selectOptions(select, 'MK-1');
  expect(select).toHaveValue('MK-1');
});

test('kokbokens underkategori behålls på kartan och kan rensas utan att lämna kokboken', async () => {
  const user = userEvent.setup();
  render(
    <MemoryRouter initialEntries={['/search?theme=matkult&category=MK-10&showmap=1&q=stek']}>
      <MatkultContextBar />
      <CurrentLocation />
    </MemoryRouter>,
  );
  const recipeCategory = screen.getByRole('combobox', { name: 'Receptkategori' });
  await user.selectOptions(recipeCategory, 'MK-12');
  expect(screen.getByRole('combobox', { name: 'Utforska kategori' })).toHaveValue('MK-10');
  expect(recipeCategory).toHaveValue('MK-12');
  const mapQuery = new URL(screen.getByRole('link', { name: 'Kartan' }).href).searchParams;
  expect(mapQuery.get('category')).toBe('MK-10,MK-12');
  expect(mapQuery.get('q')).toBe('stek');
  expect(mapQuery.get('showmap')).toBe('1');
  await user.selectOptions(recipeCategory, '');
  expect(screen.getByLabelText('Aktuell adress')).toHaveTextContent('category=MK-10&');
  expect(recipeCategory).toHaveValue('');
  await user.selectOptions(screen.getByRole('combobox', { name: 'Utforska kategori' }), 'MK-12');
  expect(screen.queryByRole('combobox', { name: 'Receptkategori' })).not.toBeInTheDocument();
  expect(new URL(screen.getByRole('link', { name: 'Kokboken' }).href).searchParams.get('category'))
    .toBe('MK-10,MK-12');
});

test('recept utan media får en öppen lästext och arkivreferens', () => {
  render(<MemoryRouter><MatkultReading data={record} /></MemoryRouter>);
  expect(screen.getByRole('heading', { name: 'Receptets lästext' })).toBeVisible();
  expect(screen.getByText(/Grädde och lever/)).toBeVisible();
  expect(screen.getByText('29403:14')).toBeVisible();
});

test('alla kategorier öppnas utan att lämna startsidan', async () => {
  render(<MemoryRouter><MatkultPage /></MemoryRouter>);
  await screen.findByRole('link', { name: 'Läs receptet' });
  fireEvent.click(screen.getByRole('button', { name: 'Alla kategorier' }));
  expect(screen.getByRole('link', { name: 'Honung' })).toBeVisible();
});
