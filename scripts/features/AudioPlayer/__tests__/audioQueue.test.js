/* global expect, jest, test */
import { buildAudioQueue, getAudioItems } from '../audioQueue';
import { getAudioTitle } from '../../../utils/helpers';

jest.mock('../../../utils/helpers', () => ({ getAudioTitle: jest.fn((title) => title) }));

const first = {
  id: 1, type: 'audio', source: 'z.mp3', title: 'Första',
};
const second = {
  id: 2, type: 'audio', source: 'a.mp3', title: 'Andra',
};

test.each([
  { utterances: [{ text: 'Avskrift' }] },
  { utterances: { utterances: [{ text: 'Avskrift' }] } },
  { description: [{ text: 'Beskrivning' }] },
  { has_transcription: true },
])('deduplicering behåller listordningen och väljer innehållsrik referens %j', (content) => {
  const rich = { ...first, id: 3, ...content };
  const media = [first, { type: 'image', source: 'image.jpg' }, second, rich, first];
  expect(getAudioItems(media)).toEqual([rich, second]);
  expect(buildAudioQueue({ media })).toEqual([
    { audio: rich, title: 'Första' }, { audio: second, title: 'Andra' },
  ]);
});

test('saknad data och filer utan källa ger en tom kö; titellösa filer får listans nummer', () => {
  expect(buildAudioQueue(null)).toBeUndefined();
  expect(buildAudioQueue({ media: null })).toEqual([]);
  expect(getAudioItems()).toEqual([]);
  const invalid = [{ type: 'audio' }, { type: 'audio', source: ' ' }];
  expect(getAudioItems(invalid)).toEqual([]);
  expect(buildAudioQueue({ media: [{ ...first, title: ' ' }, { ...second, title: '' }] })
    .map((entry) => entry.title)).toEqual(['Inspelning 1', 'Inspelning 2']);
});

test('kötitlar använder samma metadata och titelformatering som ljudlistan', () => {
  const record = {
    media: [first],
    contents: 'Innehåll',
    archive: { archive_org: 'Uppsala', archive: 'AFU' },
    year: 1957,
    persons: [{ name: 'Anna' }],
  };
  buildAudioQueue(record);
  expect(getAudioTitle).toHaveBeenLastCalledWith(first.title, record.contents, 'Uppsala', 'AFU', first.source, 1957, record.persons);
});
