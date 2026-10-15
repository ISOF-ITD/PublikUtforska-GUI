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
