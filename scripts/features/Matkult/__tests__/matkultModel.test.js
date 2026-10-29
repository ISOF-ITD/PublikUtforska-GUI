/* global expect, test */
import {
  createMatkultSearch, createWholeFolkeSearch, getDailyRecipeId,
  getMatkultSourceUrl, getMatkultText,
} from '../matkult';
import {
  createDetailLocation, createResultLocation, parseResultSearch,
} from '../../../utils/routeHelper';

test('Matkult-urval överlever sökning, detaljlänk och återgång', () => {
  const search = createMatkultSearch({ category: 'MK-3', search: 'kaffe' }, '?showmap=1');
  const query = new URL(search, 'https://folke.test').search;
  const detail = createDetailLocation({ resource: 'records', id: 'mk1', search: query });
  const result = createResultLocation(new URL(detail, 'https://folke.test').search);
  expect(parseResultSearch(new URL(result, 'https://folke.test').search)).toEqual({
    theme: 'matkult', search: 'kaffe', category: 'MK-3',
  });
  expect(result).toContain('showmap=1');
  expect(search).toContain('view=cards');
});

test('breddning till Folke behåller söktext och ort men tar bort temats kategori', () => {
  const result = createWholeFolkeSearch('?theme=matkult&category=MK-10&q=ost&place=817&showmap=1');
  const params = parseResultSearch(new URL(result, 'https://folke.test').search);
  expect(params).toEqual({ search: 'ost', place: '817' });
});

test('receptets båda kategorier överlever detaljvisning och återgång till kartan', () => {
  const query = new URL(createMatkultSearch({ category: 'MK-10,MK-12' }, '?showmap=1'), 'https://folke.test').search;
  const detail = createDetailLocation({ resource: 'records', id: 'mk1', search: query });
  const result = new URL(createResultLocation(new URL(detail, 'https://folke.test').search), 'https://folke.test');
  expect(result.searchParams.get('category')).toBe('MK-10,MK-12');
  expect(result.searchParams.get('showmap')).toBe('1');
});

test('dagens recept följer kalenderdagen i Stockholm över midnatt', () => {
  expect(getDailyRecipeId(new Date('2026-10-29T00:01:00+01:00')))
    .toBe(getDailyRecipeId(new Date('2026-10-29T23:59:00+01:00')));
  expect(getDailyRecipeId(new Date('2026-10-29T23:30:00Z')))
    .not.toBe(getDailyRecipeId(new Date('2026-10-29T21:30:00Z')));
});

test('lästext använder även metadata när textfältet saknas', () => {
  expect(getMatkultText({ text: null, metadata: [{ type: 'matkarta_content', value: '\nSmör\n' }] }))
    .toBe('Smör');
  expect(getMatkultText({ text: 'Recept', metadata: [] })).toBe('Recept');
});

test('redaktionella källänkar accepterar bara Matkults HTTPS-adresser', () => {
  const record = (value) => ({ metadata: [{ type: 'sitevision_url', value }] });
  expect(getMatkultSourceUrl(record('https://www.matkult.se/kokboken.html')))
    .toBe('https://www.matkult.se/kokboken.html');
  expect(getMatkultSourceUrl(record(['javascript', 'alert(1)'].join(':')))).toBeNull();
  expect(getMatkultSourceUrl(record('https://www.matkult.se.evil.test/'))).toBeNull();
});
