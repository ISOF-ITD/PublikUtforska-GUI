/* global expect, jest, test */
import buildSegments from '../buildSegments';

jest.mock('../../lang/Lang', () => ({ l: (text) => text }));

test.each(['readytotranscribe', 'published'])(
  'spärrade segment behåller sidornas %s-status och ändrar inte framstegsräkningen',
  (transcriptionstatus) => {
    const images = [0, 1].map((index) => Object.freeze({
      id: `image-${index}`, transcriptionstatus,
    }));
    const [segment] = buildSegments({
      mediaImages: images,
      rawSegments: [{ id: 'segment-a', start_media_id: 'image-0' }],
      transcriptionstatus: 'needsimprovement',
    });

    expect(segment.title).toBe('Sidor 1–2');
    expect(segment.segmentTranscriptionstatus).toBe(transcriptionstatus);
    segment.items.forEach((item, index) => {
      expect(item).toBe(images[index]);
      expect(item.transcriptionstatus).toBe(transcriptionstatus);
    });
  },
);

test('tillåtna segment behåller uppmaningen att skriva av', () => {
  const [segment] = buildSegments({
    mediaImages: [{ id: 'image-0', transcriptionstatus: 'readytotranscribe' }],
    rawSegments: [{ id: 'segment-a', start_media_id: 'image-0' }],
    transcriptionstatus: 'readytotranscribe',
  });

  expect(segment.title).toBe('Sida 1: kan skrivas av');
  expect(segment.segmentTranscriptionstatus).toBe('readytotranscribe');
});
