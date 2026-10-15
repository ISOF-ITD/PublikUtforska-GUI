/* global afterEach, beforeEach, expect, jest, test */
import { createRef, StrictMode } from 'react';
import {
  act, cleanup, fireEvent, render, screen, waitFor,
} from '@testing-library/react';
import L from 'leaflet';
import userEvent from '@testing-library/user-event';
import MapBase, { SWEDEN_BOUNDS } from '../MapBase';
import MapView from '../MapView';
import SimpleMap from '../SimpleMap';
import { isTabNavigationActive } from '../../../utils/focusHelper';

jest.mock('../../../lib/leaflet-heat', () => ({}));

let width;
let height;
let resize;
let mapSpy;
const originalResizeObserver = global.ResizeObserver;
const originalSvg = L.Browser.svg;
const originalMatchMedia = window.matchMedia;

beforeEach(() => {
  width = 1000;
  height = 800;
  L.Browser.svg = true;
  mapSpy = jest.spyOn(L, 'map');
  jest.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockImplementation(() => width);
  jest.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockImplementation(() => height);
  jest.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockImplementation(() => width);
  jest.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockImplementation(() => height);
  jest.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(() => ({
    x: 0, y: 0, left: 0, top: 0, right: width, bottom: height, width, height,
  }));
  global.ResizeObserver = class ResizeObserver {
    constructor(callback) { resize = callback; }

    observe() { this.observed = true; }

    disconnect() { this.observed = false; }
  };
});

afterEach(() => {
  cleanup();
  jest.restoreAllMocks();
  global.ResizeObserver = originalResizeObserver;
  L.Browser.svg = originalSvg;
  window.matchMedia = originalMatchMedia;
  document.body.classList.remove('tab-navigation');
});

test('initializes EPSG:3006 at explicit zoom zero with only overlay checkboxes', async () => {
  const ref = createRef();
  render(<MapBase ref={ref} center={[59.33, 18.07]} zoom={0} />);
  expect(ref.current.map.options.crs.code).toBe('EPSG:3006');
  expect(ref.current.map.getZoom()).toBe(0);
  expect(ref.current.map.getMinZoom()).toBe(0);
  expect(ref.current.map.getMaxZoom()).toBe(13);
  expect(document.querySelectorAll('.leaflet-control-layers-base input')).toHaveLength(0);
  expect(document.querySelectorAll('.leaflet-control-layers-overlays input')).toHaveLength(5);
  expect(document.querySelector('.leaflet-control-layers-overlays')).not.toHaveTextContent('1960');
  expect(SWEDEN_BOUNDS.contains([69.06, 20.55])).toBe(true);
  await userEvent.click(screen.getByRole('button', { name: 'Layers' }));
  const menu = document.querySelector('.leaflet-control-layers-list');
  // The bottom-anchored menu moves upward when opened; leaving its old position
  // must not immediately close it before a user can select an overlay.
  fireEvent.mouseLeave(menu);
  expect(menu.style.display).toBe('block');
  await userEvent.click(screen.getByRole('checkbox', { name: 'Generalstabskartan' }));
  expect(screen.getByRole('checkbox', { name: 'Generalstabskartan' })).toBeChecked();
  fireEvent.keyDown(menu, { key: 'Escape' });
  expect(menu.style.display).toBe('none');
});

test('fits a hidden container once it becomes visible and preserves subsequent panning', async () => {
  width = 0;
  height = 0;
  const ref = createRef();
  render(<MapBase ref={ref} />);
  expect(ref.current.fitInitialBounds()).toBe(false);
  width = 390;
  height = 700;
  act(() => resize());
  await waitFor(() => expect(ref.current.fitInitialBounds()).toBe(false));
  act(() => ref.current.map.setView([65.835, 24.137], 4, { animate: false }));
  width = 1000;
  act(() => resize());
  await waitFor(() => expect(ref.current.map.getSize().x).toBe(1000));
  expect(ref.current.map.getZoom()).toBe(4);
  expect(ref.current.map.getCenter().lat).toBeCloseTo(65.835, 4);
});

test('mounts correctly under StrictMode and clamps unsupported zoom levels', () => {
  const ref = createRef();
  render(<StrictMode><MapBase ref={ref} zoom={18} maxZoom={18} /></StrictMode>);
  expect(ref.current.map.options.crs.code).toBe('EPSG:3006');
  expect(ref.current.map.getZoom()).toBe(13);
  expect(document.querySelectorAll('.leaflet-map-pane')).toHaveLength(1);
});

test.each([false, true])('uses the themed EPSG:3006 tiles and preserves the map on theme changes (dark: %s)', async (initiallyDark) => {
  const colorScheme = Object.assign(new EventTarget(), { matches: initiallyDark });
  const addListener = jest.spyOn(colorScheme, 'addEventListener');
  const removeListener = jest.spyOn(colorScheme, 'removeEventListener');
  window.matchMedia = jest.fn(() => colorScheme);
  const { unmount } = render(<MapView mapData={{ data: [{ id: 'stockholm', name: 'Stockholm', location: [59.3293, 18.0686] }] }} />);
  const map = mapSpy.mock.results[0].value;
  const backgrounds = () => {
    const layers = [];
    map.eachLayer((layer) => {
      if (layer instanceof L.TileLayer && !(layer instanceof L.TileLayer.WMS)) layers.push(layer);
    });
    return layers;
  };
  const [background] = backgrounds();
  const expectTheme = (dark) => {
    expect(backgrounds()).toEqual([background]);
    const tileUrl = background.getTileUrl({ x: 0, y: 0 });
    if (dark) {
      expect(tileUrl).toContain('LAYER=topowebb_nedtonad');
      expect(tileUrl).toContain('TILEMATRIXSET=3006');
    } else {
      expect(tileUrl).toBe(`https://ull.isof.se/folkeservice/api/lm_proxy/${map.getZoom()}/0/0.png`);
    }
  };
  expect(window.matchMedia).toHaveBeenCalledWith('(prefers-color-scheme: dark)');
  expectTheme(initiallyDark);
  await userEvent.click(screen.getByRole('button', { name: 'Layers' }));
  await userEvent.click(screen.getByRole('checkbox', { name: 'Generalstabskartan' }));
  const overlays = [];
  map.eachLayer((layer) => { if (layer instanceof L.TileLayer.WMS) overlays.push(layer); });
  expect(overlays).toHaveLength(1);
  const region = screen.getByRole('region', { name: 'Interaktiv sökkarta' });
  region.focus();
  fireEvent.keyDown(region, { key: 'Enter' });
  const focusedCircle = document.activeElement;
  const center = map.getCenter();
  const zoom = map.getZoom();
  const { crs } = map.options;
  [!initiallyDark, initiallyDark].forEach((dark) => {
    act(() => colorScheme.dispatchEvent(Object.assign(new Event('change'), { matches: dark })));
    expectTheme(dark);
    expect(map.hasLayer(overlays[0])).toBe(true);
    expect(map.getCenter()).toEqual(center);
    expect(map.getZoom()).toBe(zoom);
    expect(map.options.crs).toBe(crs);
    expect(focusedCircle).toHaveFocus();
  });
  expect(document.querySelectorAll('.leaflet-control-layers-base input')).toHaveLength(0);
  unmount();
  expect(removeListener).toHaveBeenCalledWith('change', addListener.mock.calls[0][1]);
});

test('deferred search fitting takes precedence over the national start view', async () => {
  width = 0;
  height = 0;
  render(<MapView mapData={{ data: [{ id: 'malmo', name: 'Malmö', location: [55.605, 13.004] }] }} />);
  const map = mapSpy.mock.results[0].value;
  width = 390;
  height = 512;
  act(() => resize());
  await waitFor(() => expect(map.getZoom()).toBe(3));
  expect(map.getCenter().lat).toBeCloseTo(55.605, 5);
  expect(map.getCenter().lng).toBeCloseTo(13.004, 5);
});

test('detail maps keep WGS84 marker positions', () => {
  render(<SimpleMap marker={{ location: { lat: '67.8558', lon: '20.2253' }, name: 'Kiruna' }} />);
  const map = mapSpy.mock.results[0].value;
  const layers = [];
  map.eachLayer((layer) => { if (layer instanceof L.Marker) layers.push(layer); });
  expect(layers).toHaveLength(1);
  expect(layers[0].getLatLng()).toEqual(L.latLng(67.8558, 20.2253));
  expect(map.options.crs.code).toBe('EPSG:3006');
});

test('search circles preserve clicks, keyboard navigation and zoom-dependent appearance', async () => {
  const onMarkerClick = jest.fn();
  const data = [{
    id: 'stockholm', name: 'Stockholm sn', location: [59.3293, 18.0686], doc_count: 140,
  }];
  render(<MapView mapData={{ data }} onMarkerClick={onMarkerClick} />);
  const map = mapSpy.mock.results[0].value;
  const circles = () => {
    const found = [];
    map.eachLayer((layer) => { if (layer instanceof L.CircleMarker) found.push(layer); });
    return found;
  };
  expect(map.getZoom()).toBe(3);
  expect(circles()[0].getLatLng()).toEqual(L.latLng(...data[0].location));
  expect(circles()[0].options.fillOpacity).toBe(0.65);
  const initialRadius = circles()[0].getRadius();
  const region = screen.getByRole('region', { name: 'Interaktiv sökkarta' });
  await waitFor(() => expect(region.querySelector('[data-map-marker-kind]')).not.toBeNull());
  region.focus();
  fireEvent.keyDown(region, { key: 'Enter' });
  expect(document.activeElement.dataset.mapMarkerKind).toBe('socken');
  fireEvent.keyDown(document.activeElement, { key: 'Enter' });
  expect(onMarkerClick).toHaveBeenCalledWith('stockholm');
  fireEvent.keyDown(document.activeElement, { key: 'Escape' });
  expect(region).toHaveFocus();
  act(() => map.setZoom(4, { animate: false }));
  expect(circles()[0].getRadius()).toBeGreaterThan(initialRadius);
  expect(circles()[0].options.fillOpacity).toBe(0.9);
});

test('tabbing to the map describes Enter and supports entering and leaving circle navigation', async () => {
  const user = userEvent.setup();
  render(<MapView mapData={{ data: [{ id: 'stockholm', name: 'Stockholm', location: [59.3293, 18.0686] }] }} />);
  const region = screen.getByRole('region', { name: 'Interaktiv sökkarta' });
  expect(region).toHaveAccessibleDescription(
    /^Tryck Enter för att aktivera navigering bland cirklarna\./,
  );
  expect(region).toHaveAttribute('aria-keyshortcuts', 'Enter');
  expect(region).toHaveAccessibleDescription(/Plus och minus zoomar även när en cirkel har fokus/);
  expect(region).toHaveAccessibleDescription(/Escape för att återgå till att flytta kartan/);
  expect(region).not.toHaveAccessibleDescription(/panorera/);
  expect(screen.getByText('Kartan har tangentbordsfokus.').closest('[aria-hidden]'))
    .toHaveAttribute('aria-hidden', 'true');
  expect(region.querySelector('[data-map-marker-kind]')).toHaveAttribute('tabindex', '-1');

  await user.tab();
  expect(region).toHaveFocus();
  const map = mapSpy.mock.results[0].value;
  const initialZoom = map.getZoom();
  await user.keyboard('{Enter}');
  expect(document.activeElement).toHaveAttribute('data-map-marker-kind', 'socken');
  expect(document.activeElement).toHaveClass('focus-visible:stroke-focus', 'focus-visible:[outline-style:none]');
  expect(screen.getByRole('status')).toHaveTextContent(/zooma med plus eller minus/);
  expect(screen.getByText(/Byt cirkel med piltangenterna\. Enter visar träffarna\./))
    .toHaveAttribute('aria-hidden', 'true');
  await user.keyboard('{Escape}');
  expect(region).toHaveFocus();
  fireEvent.keyDown(region, { key: '+', keyCode: 187 });
  expect(map.getZoom()).toBeGreaterThan(initialZoom);
  await user.tab();
  expect(region).not.toHaveFocus();
  expect(document.activeElement).not.toHaveAttribute('data-map-marker-kind');
});

test('zoom keys preserve the selected circle and allow further navigation after redraws', async () => {
  const user = userEvent.setup();
  const onMarkerClick = jest.fn();
  const data = [
    { id: 'stockholm', name: 'Stockholm', location: [59.3293, 18.0686] },
    { id: 'uppsala', name: 'Uppsala', location: [59.8586, 17.6389] },
  ];
  render(<MapView mapData={{ data }} onMarkerClick={onMarkerClick} />);
  const map = mapSpy.mock.results[0].value;
  const initialZoom = map.getZoom();
  await user.tab();
  await user.keyboard('{Enter}{ArrowRight}');
  const originalCircle = document.activeElement;
  expect(originalCircle).toHaveAttribute('data-map-marker-id', 'uppsala');
  await user.keyboard('+');
  expect(map.getZoom()).toBe(initialZoom + 1);
  await waitFor(() => expect(document.activeElement).toHaveAttribute('data-map-marker-id', 'uppsala'));
  expect(originalCircle).not.toBeInTheDocument();
  await user.keyboard('-');
  expect(map.getZoom()).toBe(initialZoom);
  await waitFor(() => expect(document.activeElement).toHaveAttribute('data-map-marker-id', 'uppsala'));
  await user.keyboard('{ArrowLeft}{Enter}');
  expect(onMarkerClick).toHaveBeenCalledWith('stockholm');
});

test('repeated arrows do not cycle between Fryksände and Vitsand when focus shifts their measured bounds', () => {
  const data = [
    { id: 'fryksande', name: 'Fryksände', location: [60.14, 13.01] },
    { id: 'vitsand', name: 'Vitsand', location: [60.28, 13.01] },
    { id: 'lysvik', name: 'Lysvik', location: [60.02, 13.14] },
  ];
  render(<MapView mapData={{ data }} />);
  const region = screen.getByRole('region', { name: 'Interaktiv sökkarta' });
  const positions = new Map([
    ['vitsand', { x: 200, y: 190 }],
    ['fryksande', { x: 200, y: 200 }],
    ['lysvik', { x: 240, y: 200 }],
  ]);
  Element.prototype.getBoundingClientRect.mockImplementation(function getBounds() {
    const position = positions.get(this.dataset.mapMarkerId);
    if (!position) {
      return {
        x: 0, y: 0, left: 0, top: 0, right: width, bottom: height, width, height,
      };
    }
    // Simulate the subpixel shift that focus rendering can introduce in SVG bounds.
    const x = position.x - (document.activeElement === this ? 0.25 : 0);
    const { y } = position;
    return {
      x, y, left: x, top: y, right: x + 6, bottom: y + 6, width: 6, height: 6,
    };
  });
  region.focus();
  fireEvent.keyDown(region, { key: 'Enter' });
  expect(document.activeElement).toHaveAttribute('data-map-marker-id', 'vitsand');
  fireEvent.keyDown(document.activeElement, { key: 'ArrowRight' });
  expect(document.activeElement).toHaveAttribute('data-map-marker-id', 'fryksande');
  fireEvent.keyDown(document.activeElement, { key: 'ArrowRight' });
  expect(document.activeElement).toHaveAttribute('data-map-marker-id', 'lysvik');
  fireEvent.keyDown(document.activeElement, { key: 'ArrowRight' });
  expect(document.activeElement).toHaveAttribute('data-map-marker-id', 'lysvik');
  fireEvent.keyDown(document.activeElement, { key: 'ArrowLeft' });
  expect(document.activeElement).toHaveAttribute('data-map-marker-id', 'fryksande');
  fireEvent.keyDown(document.activeElement, { key: 'ArrowLeft' });
  expect(document.activeElement).toHaveAttribute('data-map-marker-id', 'vitsand');
  positions.set('lysvik', { x: 180, y: 200 });
  act(() => mapSpy.mock.results[0].value.fire('moveend'));
  fireEvent.keyDown(document.activeElement, { key: 'Home' });
  expect(document.activeElement).toHaveAttribute('data-map-marker-id', 'lysvik');
});

test('circle zoom respects the zoom limits and leaves browser shortcuts alone', async () => {
  render(<MapView mapData={{ data: [{ id: 'stockholm', name: 'Stockholm', location: [59.3293, 18.0686] }] }} />);
  const map = mapSpy.mock.results[0].value;
  const region = screen.getByRole('region', { name: 'Interaktiv sökkarta' });
  act(() => map.setZoom(13, { animate: false }));
  region.focus();
  fireEvent.keyDown(region, { key: 'Enter' });
  const circleAtMaximum = document.activeElement;
  fireEvent.keyDown(circleAtMaximum, { key: '+' });
  expect(map.getZoom()).toBe(13);
  expect(circleAtMaximum).toHaveFocus();
  fireEvent.keyDown(circleAtMaximum, { key: '-', ctrlKey: true });
  expect(map.getZoom()).toBe(13);
  act(() => map.setZoom(0, { animate: false }));
  region.focus();
  fireEvent.keyDown(region, { key: 'Enter' });
  const circleAtMinimum = document.activeElement;
  fireEvent.keyDown(circleAtMinimum, { key: '-' });
  expect(map.getZoom()).toBe(0);
  expect(circleAtMinimum).toHaveFocus();
});

test('finishing a circle zoom does not steal focus from another map control', async () => {
  render(<MapView mapData={{ data: [{ id: 'stockholm', name: 'Stockholm', location: [59.3293, 18.0686] }] }} />);
  const region = screen.getByRole('region', { name: 'Interaktiv sökkarta' });
  region.focus();
  fireEvent.keyDown(region, { key: 'Enter' });
  fireEvent.keyDown(document.activeElement, { key: '+' });
  const zoomControl = screen.getByRole('button', { name: 'Zoom in' });
  zoomControl.focus();
  await act(async () => {
    await new Promise((resolve) => {
      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(resolve);
      });
    });
  });
  expect(zoomControl).toHaveFocus();
});

test('map instructions use Tab navigation detection and hide again on pointer input', async () => {
  const user = userEvent.setup();
  jest.spyOn(window, 'scrollTo').mockImplementation(() => {});
  render(<MapView mapData={{ data: [{ id: 'stockholm', name: 'Stockholm', location: [59.3293, 18.0686] }] }} />);
  const region = screen.getByRole('region', { name: 'Interaktiv sökkarta' });
  const mapCue = screen.getByText('Kartan har tangentbordsfokus.').closest('[aria-hidden]');
  const circleCue = screen.getByText(/Byt cirkel med piltangenterna\. Enter visar träffarna\./);
  expect(mapCue).toHaveClass('[.tab-navigation_&]:peer-focus-visible:block');
  expect(circleCue).toHaveClass('[.tab-navigation_&]:peer-has-[[data-map-marker-kind]:focus-visible]:block');
  await user.click(region);
  expect(isTabNavigationActive()).toBe(false);
  await user.keyboard('{Shift>}{Tab}{/Shift}');
  await user.tab();
  expect(region).toHaveFocus();
  expect(isTabNavigationActive()).toBe(true);
  fireEvent.pointerDown(region);
  expect(isTabNavigationActive()).toBe(false);
});

test.each([
  ['normal', 403, 1037, 0],
  ['enlarged', 1440, 0, 280],
])('Enter focuses the first visible circle in the %s map, accounting for map offsets', async (layoutName, mapWidth, left, top) => {
  width = mapWidth;
  const data = [
    { id: 'stockholm', name: 'Stockholm', location: [59.3293, 18.0686] },
    { id: 'kiruna', name: 'Kiruna', location: [67.8558, 20.2253] },
    { id: 'malmo', name: 'Malmö', location: [55.605, 13.004] },
    { id: 'outside', name: 'Outside the map', location: [80, 0] },
  ];
  render(<MapView mapData={{ data }} />);
  const map = mapSpy.mock.results[0].value;
  const region = screen.getByRole('region', { name: 'Interaktiv sökkarta' });
  const circleLocations = new Map();
  map.eachLayer((layer) => {
    if (layer instanceof L.CircleMarker) {
      circleLocations.set(layer.getElement(), layer.getLatLng());
    }
  });
  Element.prototype.getBoundingClientRect.mockImplementation(function getBounds() {
    const location = circleLocations.get(this);
    const position = location ? map.latLngToContainerPoint(location) : null;
    const x = left + (position ? position.x - 3 : 0);
    const y = top + (position ? position.y - 3 : 0);
    const elementWidth = position ? 6 : width;
    const elementHeight = position ? 6 : height;
    return {
      x,
      y,
      left: x,
      top: y,
      width: elementWidth,
      height: elementHeight,
      right: x + elementWidth,
      bottom: y + elementHeight,
    };
  });
  region.focus();
  fireEvent.keyDown(region, { key: 'Enter' });
  expect(document.activeElement).toHaveAccessibleName(/^Kiruna:/);
  fireEvent.keyDown(document.activeElement, { key: 'ArrowRight' });
  expect(document.activeElement).toHaveAccessibleName(/^Stockholm:/);
});

test('empty results describe the lack of circles instead of promising Enter navigation', () => {
  render(<MapView mapData={{ data: [] }} />);
  const region = screen.getByRole('region', { name: 'Interaktiv sökkarta' });
  expect(region).toHaveAccessibleDescription(/^Inga cirklar finns i det här urvalet\./);
  expect(region).not.toHaveAccessibleDescription(/Tryck Enter/);
});
