/* global expect, jest, test */
import { buildCollectionApiParams, validateCollectionResponse } from '../collectionHelper';
import { buildResultApiParams } from '../resultFilterHelper';
import { getMapFetchLocation, getRecordsCountLocation, getRecordsFetchLocation } from '../helpers';
import RecordsApiClient from '../../features/RecordList/api/RecordsApiClient';

jest.mock('d3-array', () => ({ max: jest.fn() }));
jest.mock('../../config', () => ({
  apiUrl: 'https://api.test/es/',
  requiredParams: {
    type: 'arkiv',
    categorytypes: 'tradark',
    has_media: 'true',
    recordtype: 'one_accession_row',
    publishstatus: 'published',
  },
}));

test('Folkes vanliga grundurval bevaras även när klienten skickar undefined', () => {
  expect(buildCollectionApiParams({ type: undefined, recordtype: undefined, has_media: undefined }))
    .toEqual({
      type: 'arkiv',
      categorytypes: 'tradark',
      has_media: 'true',
      recordtype: 'one_accession_row',
      publishstatus: 'published',
    });
});

test('Matkult omfattar publicerade recept utan media och utan accessionstvång', () => {
  const params = buildCollectionApiParams(buildResultApiParams({ theme: 'matkult' }, {
    materialRecordtype: 'one_accession_row',
  }));
  expect(params).toEqual({
    type: 'matkarta', publishstatus: 'published', mark_metadata: 'sitevision_url,matkarta_edited',
  });
});

test('samma Matkult-urval används för lista, karta och antal', async () => {
  const params = buildResultApiParams({ theme: 'matkult', search: 'bröd', category: 'MK-3' });
  const responses = [getMapFetchLocation, getRecordsCountLocation, getRecordsFetchLocation]
    .map((createUrl) => new URL(createUrl(params)).searchParams);
  responses.forEach((query) => {
    expect(query.get('type')).toBe('matkarta');
    expect(query.get('category')).toBe('MK-3');
    expect(query.get('search')).toBe('bröd');
    ['theme', 'has_media', 'recordtype', 'categorytypes', 'transcriptionstatus'].forEach((key) => {
      expect(query.has(key)).toBe(false);
    });
  });
  global.fetch = jest.fn(async () => ({ ok: true, json: async () => ({ data: [] }) }));
  await new RecordsApiClient(jest.fn()).fetch(params);
  const query = new URL(global.fetch.mock.calls[0][0]).searchParams;
  expect(query.get('type')).toBe('matkarta');
  expect(query.has('has_media')).toBe(false);
  expect(query.has('recordtype')).toBe(false);
});

test('sparade ID:n kan innehålla både Matkult- och Folke-material', async () => {
  global.fetch = jest.fn(async () => ({ ok: true, json: async () => ({ data: [] }) }));
  await new RecordsApiClient(jest.fn()).fetch({ record_ids: ['mk-kb875', 'folke1'] });
  const query = new URL(global.fetch.mock.calls[0][0]).searchParams;
  expect(query.get('documents')).toBe('mk-kb875,folke1');
  expect(query.get('publishstatus')).toBe('published');
  expect(query.has('type')).toBe(false);
  expect(query.has('has_media')).toBe(false);
});

test('receptunderkategorier kräver båda kategorierna i lista, karta och antal', async () => {
  const params = { theme: 'matkult', category: 'MK-10,MK-12', search: 'stek' };
  [getMapFetchLocation, getRecordsCountLocation, getRecordsFetchLocation].forEach((createUrl) => {
    const query = new URL(createUrl(params)).searchParams;
    expect(query.get('category')).toBe('MK-10,MK-12');
    expect(query.get('category_match')).toBe('all');
  });
  global.fetch = jest.fn(async () => ({
    ok: true, json: async () => ({ data: [], metadata: { category_match: 'all' } }),
  }));
  await new RecordsApiClient(jest.fn()).fetch(params);
  const query = new URL(global.fetch.mock.calls[0][0]).searchParams;
  expect(query.get('category')).toBe('MK-10,MK-12');
  expect(query.get('category_match')).toBe('all');
  expect(buildCollectionApiParams({ category: 'L,H' })).not.toHaveProperty('category_match');
});

test('äldre API får inte visa OR-träffar som receptunderkategori', async () => {
  const params = { theme: 'matkult', category: 'MK-10,MK-12' };
  const data = { data: [], metadata: { total: { value: 1256 } } };
  expect(() => validateCollectionResponse(data, params)).toThrow('Välj Alla recept');
  expect(validateCollectionResponse(data, { theme: 'matkult', category: 'MK-10' })).toBe(data);
  const onComplete = jest.fn();
  const onError = jest.fn();
  const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
  global.fetch = jest.fn(async () => ({ ok: true, json: async () => data }));
  await new RecordsApiClient(onComplete, onError).fetch(params);
  expect(onComplete).not.toHaveBeenCalled();
  expect(onError).toHaveBeenCalledWith(expect.objectContaining({ code: 'CATEGORY_MATCH_UNSUPPORTED' }));
  consoleError.mockRestore();
});
