/* global afterEach, expect, test */
import L from 'leaflet';
import mapHelper, {
  fitLocations, fitProjectedBounds, SWEDEN_PROJECTED_BOUNDS, SWEREF_RESOLUTIONS,
} from '../mapHelper';

let map;
let container;

function createMap(width = 1000, height = 800) {
  container = document.createElement('div');
  Object.defineProperties(container, {
    clientWidth: { value: width },
    clientHeight: { value: height },
  });
  document.body.append(container);
  map = L.map(container, {
    crs: mapHelper.getSweref99crs(),
    center: [62, 17],
    zoom: 0,
    minZoom: 0,
    maxZoom: 13,
    zoomSnap: 0.25,
    zoomAnimation: false,
  });
  return map;
}

afterEach(() => {
  map?.remove();
  container?.remove();
});

test('projects the independent Lantmäteriet SWEREF 99 TM control point', () => {
  // Lantmäteriet: svenska-transformationer-i-proj-web.pdf, SWEREF 99 TM example.
  const crs = mapHelper.getSweref99crs();
  const location = L.latLng(60.666369395, 17.132577526);
  const projected = crs.project(location);
  expect(projected.x).toBeCloseTo(616536, 2);
  expect(projected.y).toBeCloseTo(6727518, 2);
  expect(crs.unproject(projected).lat).toBeCloseTo(location.lat, 7);
  expect(crs.unproject(projected).lng).toBeCloseTo(location.lng, 7);
});

test('uses the WMTS origin, finite matrix bounds and row/column order', () => {
  const crs = mapHelper.getSweref99crs();
  expect(crs.options.resolutions).toEqual(SWEREF_RESOLUTIONS);
  expect(crs.getProjectedBounds(0).min).toEqual(L.point(0, 0));
  expect(crs.getProjectedBounds(0).max).toEqual(L.point(1024, 1024));
  const location = L.latLng(60.666369395, 17.132577526);
  const pixel = crs.latLngToPoint(location, 13);
  const tile = L.point(Math.floor(pixel.x / 256), Math.floor(pixel.y / 256), 13);
  tile.z = 13;
  const layer = Object.values(mapHelper.createLayers())[0];
  createMap();
  layer.addTo(map);
  // 0.5 m/pixel * 256 = 128 m/tile.
  expect(tile.x).toBe(14191);
  expect(tile.y).toBe(13847);
  map.setZoom(13);
  expect(layer.getTileUrl(tile)).toBe(
    'https://ull.isof.se/folkeservice/api/lm_proxy/13/13847/14191.png',
  );
  layer.setUrl(mapHelper.tileLayers[0].darkModeUrl);
  const darkUrl = new URL(layer.getTileUrl(tile));
  expect(darkUrl.origin + darkUrl.pathname).toBe('https://ull.isof.se/folkeservice/api/lm_proxy/');
  expect(Object.fromEntries(darkUrl.searchParams)).toEqual({
    SERVICE: 'WMTS',
    REQUEST: 'GetTile',
    VERSION: '1.0.0',
    LAYER: 'topowebb_nedtonad',
    STYLE: 'default',
    TILEMATRIXSET: '3006',
    TILEMATRIX: '13',
    TILEROW: '13847',
    TILECOL: '14191',
    FORMAT: 'image/png',
  });
  expect(layer.options).toMatchObject({ minZoom: 0, maxZoom: 13, noWrap: true });
  expect(Object.keys(mapHelper.createLayers())).toEqual(['Lantmäteriet topografisk karta']);
});

test.each([[1000, 800], [390, 700]])('fits all locations in a %s × %s map', (width, height) => {
  createMap(width, height);
  const locations = [
    [55.605, 13.004], // Malmö
    [59.3293, 18.0686], // Stockholm
    [65.835, 24.137], // Haparanda: farther east in projection than the NE geographic corner
    [69.06, 20.55], // Treriksröset
  ];
  expect(fitLocations(map, locations, { maxZoom: 3 })).toBe(true);
  locations.forEach((location) => {
    const pixel = map.latLngToContainerPoint(location);
    expect(pixel.x).toBeGreaterThanOrEqual(23);
    expect(pixel.x).toBeLessThanOrEqual(width - 23);
    expect(pixel.y).toBeGreaterThanOrEqual(23);
    expect(pixel.y).toBeLessThanOrEqual(height - 23);
  });
  expect(map.getZoom()).toBeLessThanOrEqual(3);
});

test('fits the national extent, a single location, and empty/hidden maps safely', () => {
  createMap();
  expect(fitProjectedBounds(map, SWEDEN_PROJECTED_BOUNDS)).toBe(true);
  expect(fitLocations(map, [[59.3293, 18.0686]], { maxZoom: 3 })).toBe(true);
  expect(map.getZoom()).toBe(3);
  expect(map.getCenter().lat).toBeCloseTo(59.3293, 6);
  expect(map.getCenter().lng).toBeCloseTo(18.0686, 6);
  expect(fitLocations(map, [])).toBe(false);
  map.remove();
  container.remove();
  createMap(0, 0);
  expect(fitProjectedBounds(map, SWEDEN_PROJECTED_BOUNDS)).toBe(false);
});

test('fractional fitting encloses locations with Proj4Leaflet scale interpolation', () => {
  const originalAny3d = L.Browser.any3d;
  L.Browser.any3d = true;
  try {
    createMap(390, 700);
    fitProjectedBounds(map, SWEDEN_PROJECTED_BOUNDS);
    expect(map.getZoom()).toBe(0.5);
    const pixels = [SWEDEN_PROJECTED_BOUNDS.min, SWEDEN_PROJECTED_BOUNDS.max]
      .map((point) => map.latLngToContainerPoint(map.options.crs.unproject(point)));
    pixels.forEach((pixel) => {
      expect(pixel.x).toBeGreaterThanOrEqual(23);
      expect(pixel.x).toBeLessThanOrEqual(367);
      expect(pixel.y).toBeGreaterThanOrEqual(23);
      expect(pixel.y).toBeLessThanOrEqual(677);
    });
  } finally {
    L.Browser.any3d = originalAny3d;
  }
});

test('WMS overlays request EPSG:3006 with projected BBOX and adjusted zoom levels', () => {
  createMap();
  const overlays = mapHelper.createOverlayLayers();
  const layer = overlays.Generalstabskartan;
  layer.addTo(map);
  expect(layer.options).toMatchObject({ minZoom: 0, maxZoom: 13 });
  expect(overlays.Sockengränser.options.minZoom).toBe(7);
  expect(overlays['Lantmäteriet Ortofoto'].options.minZoom).toBe(2);
  const url = new URL(layer.getTileUrl(Object.assign(L.point(1, 1), { z: 0 })));
  expect(url.searchParams.get('srs')).toBe('EPSG:3006');
  const bbox = url.searchParams.get('bbox').split(',').map(Number);
  [-151424, 6402848, 897152, 7451424].forEach((value, index) => {
    expect(bbox[index]).toBeCloseTo(value, 5);
  });
});
