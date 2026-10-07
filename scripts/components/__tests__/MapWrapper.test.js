/* global afterEach, beforeEach, expect, jest, test */
import PropTypes from 'prop-types';
import {
  act, fireEvent, render, screen, within,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, useLocation } from 'react-router-dom';
import MapWrapper from '../MapWrapper';
import SearchControls from '../SearchControls';
import MapView from '../views/MapView';
import useSearchRouting from '../../features/Search/hooks/useSearchRouting';
import { parseResultSearch } from '../../utils/routeHelper';

jest.mock('../SearchControls', () => ({ __esModule: true, default: jest.fn() }));
jest.mock('../views/MapView', () => ({ __esModule: true, default: jest.fn() }));
jest.mock('../../features/RecordList/RecordListWrapper', () => function RecordList() {
  return (
    <>
      <h2 id="record-list-heading">Sökträffar</h2>
      <button type="button">Öppna post</button>
    </>
  );
});

function TestSearchControls({ activeResultView, onResultViewChange, showResultViewControl }) {
  const location = useLocation();
  const resultParams = parseResultSearch(location.search);
  const { navigateToSearch, toggleCategory } = useSearchRouting({
    categories: resultParams.category?.split(',') || [],
    setCategories: () => {},
    person: resultParams.person,
    place: resultParams.place,
    archiveId: resultParams.archive_id,
  });

  return (
    <section aria-label="Sök och filter">
      <button type="button" onClick={() => navigateToSearch('ny sökning')}>Sök</button>
      <button type="button" onClick={() => toggleCategory('musik', resultParams.search)}>
        Filtrera
      </button>
      {showResultViewControl && (
        <>
          <button
            type="button"
            aria-pressed={activeResultView === 'list'}
            onClick={() => onResultViewChange('list')}
          >
            Lista
          </button>
          <button
            type="button"
            aria-pressed={activeResultView === 'map'}
            onClick={() => onResultViewChange('map')}
          >
            Karta
          </button>
        </>
      )}
    </section>
  );
}

TestSearchControls.propTypes = {
  activeResultView: PropTypes.string.isRequired,
  onResultViewChange: PropTypes.func.isRequired,
  showResultViewControl: PropTypes.bool.isRequired,
};

function TestMap({ layout, isMobileViewport, onMarkerClick }) {
  return (
    <div data-testid="map-instance" data-layout={layout} data-mobile={isMobileViewport}>
      <label htmlFor="test-map-zoom">
        Kartans zoom
        <input id="test-map-zoom" type="range" min="4" max="18" defaultValue="5" />
      </label>
      <button type="button" onClick={() => onMarkerClick('559')}>Välj ort</button>
    </div>
  );
}

TestMap.propTypes = {
  layout: PropTypes.string.isRequired,
  isMobileViewport: PropTypes.bool.isRequired,
  onMarkerClick: PropTypes.func.isRequired,
};

function LocationProbe() {
  const location = useLocation();
  return (
    <output data-testid="location">
      {`${location.pathname}${location.search}${location.hash}`}
    </output>
  );
}

const originalMatchMedia = window.matchMedia;
const mediaQueries = new Map();
const mapMarkerClick = jest.fn();

function resizeViewport(width) {
  act(() => {
    Array.from(mediaQueries.keys()).forEach((key) => {
      const query = mediaQueries.get(key);
      const matches = key === '(min-width: 1440px)' ? width >= 1440 : width <= 1023;
      if (query.matches === matches) return;
      query.matches = matches;
      query.listeners.forEach((listener) => listener({ matches }));
    });
  });
}

function renderResults(
  initialEntry = '/search?q=visa&person=acc4948&custom=bevara#resultat',
  { loading = false } = {},
) {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <MapWrapper
        active
        loading={loading}
        mapMarkerClick={mapMarkerClick}
        mapData={{ data: [{ id: '559', name: 'Uppsala' }] }}
        recordsData={{ metadata: { total: { value: 1, relation: 'eq' } } }}
      />
      <LocationProbe />
    </MemoryRouter>,
  );
}

function currentLocation() {
  return new URL(screen.getByTestId('location').textContent, 'http://localhost');
}

test.each([
  ['/search?q=visa', 'record-list-panel'],
  ['/search?q=visa&showmap=1', 'map-result-panel'],
])('resultatläget %s har ett main utan sökheadern', (entry, panelId) => {
  renderResults(entry);
  expect(screen.getAllByRole('main')).toHaveLength(1);
  const main = screen.getByRole('main');
  expect(main).toHaveAttribute('id', panelId);
  expect(main).not.toContainElement(screen.getByRole('region', { name: 'Sök och filter' }));
  expect(SearchControls.mock.calls.at(-1)[0]).toMatchObject({ active: true });
});

test('den inaktiva sökvyn döljer main och inaktiverar sökheadern', () => {
  const { container } = render(
    <MemoryRouter initialEntries={['/records/record-a']}>
      <MapWrapper active={false} mapMarkerClick={mapMarkerClick} loading={false} />
    </MemoryRouter>,
  );
  expect(container.querySelector('main')).not.toBeVisible();
  expect(screen.queryByRole('main')).not.toBeInTheDocument();
  expect(SearchControls.mock.calls.at(-1)[0]).toMatchObject({ active: false });
});

beforeEach(() => {
  mediaQueries.clear();
  window.matchMedia = jest.fn((key) => {
    if (!mediaQueries.has(key)) {
      const listeners = new Set();
      mediaQueries.set(key, {
        matches: key === '(min-width: 1440px)',
        listeners,
        addEventListener: (event, listener) => listeners.add(listener),
        removeEventListener: (event, listener) => listeners.delete(listener),
      });
    }
    return mediaQueries.get(key);
  });
  SearchControls.mockImplementation(TestSearchControls);
  MapView.mockImplementation(TestMap);
});

afterEach(() => {
  window.matchMedia = originalMatchMedia;
});

test('förstorar och förminskar desktopkartan med bevarad adress, zoom och knappfokus', async () => {
  const user = userEvent.setup();
  renderResults();
  const mapInstance = await screen.findByTestId('map-instance');
  const button = screen.getByRole('button', { name: 'Förstora karta' });
  const mapPanel = screen.getByRole('region', { name: 'Sökträffar på karta' });
  const listPanel = screen.getByRole('main', { name: 'Sökträffar' });
  const results = document.getElementById('results-viewport');
  const zoom = screen.getByRole('slider', { name: 'Kartans zoom' });

  expect(mapPanel).toContainElement(button);
  expect(button).toHaveAttribute('aria-controls', mapPanel.id);
  expect(button).toHaveAttribute('aria-expanded', 'false');
  expect(mapInstance).toHaveAttribute('data-layout', 'desktop-split');
  expect(results.style.gridTemplateColumns).not.toBe('');
  expect(screen.queryByRole('button', { name: 'Karta', exact: true })).not.toBeInTheDocument();

  fireEvent.change(zoom, { target: { value: '9' } });
  await user.click(button);

  expect(screen.getByRole('button', { name: 'Förminska karta' })).toBe(button);
  expect(button).toHaveFocus();
  expect(button).toHaveAttribute('aria-expanded', 'true');
  expect(listPanel).not.toBeVisible();
  expect(listPanel).toHaveAttribute('inert');
  expect(listPanel).toHaveAttribute('aria-hidden', 'true');
  expect(screen.queryByRole('button', { name: 'Öppna post' })).not.toBeInTheDocument();
  expect(screen.getByRole('region', { name: 'Sök och filter' })).toBeVisible();
  expect(results.style.gridTemplateColumns).toBe('');
  expect(results.style.height).toBe('100dvh');
  expect(mapInstance).toHaveAttribute('data-layout', 'full');
  expect(screen.getByTestId('map-instance')).toBe(mapInstance);
  expect(zoom.value).toBe('9');
  expect(currentLocation().searchParams.get('showmap')).toBe('1');
  expect(currentLocation().searchParams.get('q')).toBe('visa');
  expect(currentLocation().searchParams.get('person')).toBe('acc4948');
  expect(currentLocation().searchParams.get('custom')).toBe('bevara');
  expect(currentLocation().hash).toBe('#resultat');
  expect(screen.getByText(/Visar sökträffar på karta\./)).toBeInTheDocument();

  await user.click(screen.getByRole('button', { name: 'Välj ort' }));
  expect(mapMarkerClick).toHaveBeenCalledWith('559');
  await user.click(button);

  expect(screen.getByRole('button', { name: 'Förstora karta' })).toBe(button);
  expect(button).toHaveFocus();
  expect(button).toHaveAttribute('aria-expanded', 'false');
  expect(listPanel).toBeVisible();
  expect(listPanel).not.toHaveAttribute('inert');
  expect(mapInstance).toHaveAttribute('data-layout', 'desktop-split');
  expect(zoom.value).toBe('9');
  expect(currentLocation().searchParams.has('showmap')).toBe(false);
  expect(currentLocation().searchParams.get('custom')).toBe('bevara');
  expect(currentLocation().hash).toBe('#resultat');
  expect(screen.getByText(/Visar sökträffar som lista med karta\./)).toBeInTheDocument();
});

test('stöder Enter och blanksteg och låter Tab gå vidare till kartan efter förstoring', async () => {
  const user = userEvent.setup();
  renderResults();
  await screen.findByTestId('map-instance');
  await user.tab();
  await user.tab();
  await user.tab();
  await user.tab();
  const button = screen.getByRole('button', { name: 'Förstora karta' });
  expect(button).toHaveFocus();

  await user.keyboard('{Enter}');
  expect(button).toHaveFocus();
  expect(button).toHaveAccessibleName('Förminska karta');
  await user.tab();
  expect(screen.getByRole('slider', { name: 'Kartans zoom' })).toHaveFocus();
  await user.tab({ shift: true });
  await user.keyboard(' ');
  expect(button).toHaveFocus();
  expect(button).toHaveAccessibleName('Förstora karta');
});

test('öppnar direktlänk i stort kartläge och behåller läget vid sökning och filtrering', async () => {
  const user = userEvent.setup();
  renderResults('/search?q=visa&person=acc4948&showmap=1&custom=bevara');
  await screen.findByTestId('map-instance');

  expect(screen.getByRole('button', { name: 'Förminska karta' })).toHaveAttribute('aria-expanded', 'true');
  expect(screen.queryByRole('main', { name: 'Sökträffar' })).not.toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'Sök', exact: true }));
  await user.click(screen.getByRole('button', { name: 'Filtrera' }));

  expect(currentLocation().searchParams.get('showmap')).toBe('1');
  expect(currentLocation().searchParams.get('q')).toBe('ny sökning');
  expect(currentLocation().searchParams.get('person')).toBe('acc4948');
  expect(currentLocation().searchParams.get('category')).toBe('musik');
  expect(currentLocation().searchParams.get('custom')).toBe('bevara');
  expect(screen.getByRole('button', { name: 'Förminska karta' })).toBeVisible();
});

test('behåller kartläget över desktopgränsen och mobilens befintliga vyväxling', async () => {
  const user = userEvent.setup();
  renderResults('/search?showmap=1');
  const mapInstance = await screen.findByTestId('map-instance');

  resizeViewport(1439);
  expect(screen.queryByRole('button', { name: 'Förminska karta' })).not.toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Karta', exact: true })).toHaveAttribute('aria-pressed', 'true');
  expect(mapInstance).toHaveAttribute('data-layout', 'full');
  expect(mapInstance).toHaveAttribute('data-mobile', 'false');

  resizeViewport(800);
  expect(mapInstance).toHaveAttribute('data-mobile', 'true');
  resizeViewport(1440);
  expect(screen.getByRole('button', { name: 'Förminska karta' })).toBeVisible();
  expect(screen.getByTestId('map-instance')).toBe(mapInstance);

  resizeViewport(800);
  await user.click(screen.getByRole('button', { name: 'Lista', exact: true }));
  expect(screen.getByRole('main', { name: 'Sökträffar' })).toBeVisible();
  expect(screen.queryByRole('region', { name: 'Sökträffar på karta' })).not.toBeInTheDocument();
  resizeViewport(1440);
  expect(screen.getByRole('button', { name: 'Förstora karta' })).toBeVisible();
  expect(mapInstance).toHaveAttribute('data-layout', 'desktop-split');
  expect(currentLocation().searchParams.has('showmap')).toBe(false);
});

test('förstoringsknappen är tillgänglig även medan kartan laddas', async () => {
  const user = userEvent.setup();
  renderResults('/search?q=visa', { loading: true });
  const button = screen.getByRole('button', { name: 'Förstora karta' });
  const mapPanel = screen.getByRole('region', { name: 'Sökträffar på karta' });

  expect(mapPanel).toHaveAttribute('aria-busy', 'true');
  expect(button).toBeEnabled();
  await user.click(button);
  expect(button).toHaveAccessibleName('Förminska karta');
  expect(currentLocation().searchParams.get('showmap')).toBe('1');
  expect(within(mapPanel).getByRole('button', { name: 'Förminska karta' })).toBe(button);
});
