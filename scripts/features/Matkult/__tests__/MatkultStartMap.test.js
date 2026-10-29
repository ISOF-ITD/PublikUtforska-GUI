/* global afterEach, beforeEach, expect, jest, test */
import 'whatwg-fetch';
import PropTypes from 'prop-types';
import {
  act, fireEvent, render, screen,
} from '@testing-library/react';
import {
  createMemoryRouter, Outlet, RouterProvider, useLocation,
} from 'react-router-dom';
import MatkultStartMap from '../MatkultStartMap';
import RoutePageShell from '../../../components/RoutePageShell';
import MapView from '../../../components/views/MapView';

jest.mock('../../../components/views/MapView', () => ({ __esModule: true, default: jest.fn() }));

function TestMap({ onMarkerClick, mapData }) {
  return (
    <button type="button" onClick={() => onMarkerClick(mapData.data[0].id)}>
      Välj ort på kartan
    </button>
  );
}
TestMap.propTypes = {
  onMarkerClick: PropTypes.func.isRequired,
  mapData: PropTypes.object.isRequired,
};

function LocationProbe() {
  const location = useLocation();
  return (
    <output aria-label="Aktuell adress">
      {location.pathname}
      {location.search}
    </output>
  );
}

let media;
const mapData = { data: [{ id: '817', name: 'Näsum sn' }] };

async function renderStart({ wide = true, results = Promise.resolve([mapData, {}]) } = {}) {
  media.matches = wide;
  const router = createMemoryRouter([{
    id: 'root',
    path: '/',
    loader: () => ({ results }),
    hydrateFallbackElement: <p>Laddar</p>,
    element: (
      <>
        <Outlet />
        <LocationProbe />
      </>
    ),
    children: [
      {
        path: 'matkult',
        element: (
          <RoutePageShell sidePanel={<MatkultStartMap />}>
            <h1>Matkult-start</h1>
          </RoutePageShell>
        ),
      },
      { path: 'places/:id', element: <h1>Ort</h1> },
    ],
  }], { initialEntries: ['/matkult'] });
  render(<RouterProvider router={router} />);
  await screen.findByRole('heading', { name: 'Matkult-start' });
  return router;
}

beforeEach(() => {
  media = { matches: true, listeners: new Set() };
  media.addEventListener = (event, listener) => media.listeners.add(listener);
  media.removeEventListener = (event, listener) => media.listeners.delete(listener);
  window.matchMedia = jest.fn(() => media);
  global.fetch = jest.fn(() => new Promise(() => {}));
  Element.prototype.scrollTo = jest.fn();
  Element.prototype.scrollBy = jest.fn();
  MapView.mockImplementation(TestMap);
});

afterEach(() => jest.restoreAllMocks());

test('bred start visar samma Matkult-platser som root-loadern utan ett nytt dataanrop', async () => {
  await renderStart();
  expect(await screen.findByRole('button', { name: 'Välj ort på kartan' })).toBeVisible();
  expect(screen.getByRole('complementary', { name: 'Matkult på karta' })).toBeInTheDocument();
  expect(screen.getAllByRole('main')).toHaveLength(1);
  expect(MapView).toHaveBeenCalledWith(expect.objectContaining({
    mapData, active: true, layout: 'desktop-split', isMobileViewport: false,
  }), undefined);
  expect(global.fetch.mock.calls.every(([url]) => !url.includes('socken/'))).toBe(true);
  const fullMap = new URL(screen.getByRole('link', { name: 'Öppna helkartan' }).href);
  expect(fullMap.searchParams.get('theme')).toBe('matkult');
  expect(fullMap.searchParams.get('showmap')).toBe('1');
});

test('kartans ortval behåller Matkult och återgång till kartan', async () => {
  await renderStart();
  fireEvent.click(await screen.findByRole('button', { name: 'Välj ort på kartan' }));
  await screen.findByRole('heading', { name: 'Ort' });
  const destination = new URL(screen.getByLabelText('Aktuell adress').textContent, 'https://folke.test');
  expect(destination.pathname).toBe('/places/817');
  expect(destination.searchParams.get('theme')).toBe('matkult');
  expect(destination.searchParams.get('showmap')).toBe('1');
});

test('smal start monterar ingen karta men följer breddändringar vid Folkes brytpunkt', async () => {
  await renderStart({ wide: false });
  expect(MapView).not.toHaveBeenCalled();
  expect(window.matchMedia).toHaveBeenCalledWith('(min-width: 1440px)');
  act(() => {
    media.matches = true;
    media.listeners.forEach((listener) => listener({ matches: true }));
  });
  expect(await screen.findByRole('button', { name: 'Välj ort på kartan' })).toBeVisible();
  act(() => {
    media.matches = false;
    media.listeners.forEach((listener) => listener({ matches: false }));
  });
  expect(screen.queryByRole('button', { name: 'Välj ort på kartan' })).not.toBeInTheDocument();
});

test('ett misslyckat kartanrop lämnar starten läsbar och ger ett felmeddelande', async () => {
  let reject;
  const results = new Promise((resolve, fail) => { reject = fail; });
  await renderStart({ results });
  await act(async () => reject(new Error('API-fel')));
  expect(await screen.findByRole('alert')).toHaveTextContent('Kartan kunde inte hämtas');
  expect(screen.getByRole('heading', { name: 'Matkult-start' })).toBeVisible();
});
