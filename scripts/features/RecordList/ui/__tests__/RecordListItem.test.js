/* global expect, jest, test */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import RecordListItem from '../RecordListItem';

jest.mock('d3-array', () => ({}));
jest.mock('../../../../config', () => ({
  imageUrl: 'https://example.test/images/',
  apiUrl: 'https://example.test/api/',
  siteOptions: { recordList: {} },
}));
jest.mock('../../../../lang/Lang', () => ({ l: (text) => text }));

function renderAudioRecord(media, innerHits) {
  const data = {
    id: '04416:3_253674',
    title: 'Inspelning',
    archive: { archive_id_display_search: ['ULMA 4416:3'] },
    recordtype: 'one_audio_record',
    media,
    metadata: [],
    persons: [],
    places: [],
  };
  return render(
    <MemoryRouter>
      <table>
        <tbody>
          <RecordListItem
            id={data.id}
            item={{ _source: data, inner_hits: innerHits }}
            searchParams={{}}
            columns={['title']}
            shouldRenderColumn={(column) => column === 'title'}
          />
        </tbody>
      </table>
    </MemoryRouter>,
  );
}

test.each([
  [undefined, 'Ljudavskrift'],
  ['asr', 'Automatisk ljudavskrift'],
  ['manual', 'Manuell ljudavskrift'],
  ['ocr+align', 'Ljudavskrift'],
])('listprofilens etikett och sökträff använder processtypen %s', (type, expected) => {
  const data = {
    id: 'bd10106_253556',
    title: 'Inspelning med Mats Börs Ersson',
    archive: { archive_id_display_search: ['ULMA BD 10106'] },
    recordtype: 'one_audio_record',
    media: [{
      id: 1571201,
      type: 'audio',
      source: 'bd10106.mp3',
      has_transcription: true,
      utterances: { metadata: { process: [{ type }] } },
    }],
    metadata: [],
    persons: [],
    places: [],
  };
  const innerHits = {
    'media.utterances.utterances': {
      hits: {
        hits: [{
          _id: data.id,
          _nested: { field: 'media', offset: 0 },
          _source: { start: 0 },
          highlight: { 'media.utterances.utterances.text': ['En <em>berättelse</em>.'] },
        }],
      },
    },
  };
  render(
    <MemoryRouter>
      <table>
        <tbody>
          <RecordListItem
            id={data.id}
            item={{ _source: data, inner_hits: innerHits }}
            searchParams={{}}
            columns={['title']}
            shouldRenderColumn={(column) => column === 'title'}
          />
        </tbody>
      </table>
    </MemoryRouter>,
  );

  expect(screen.getByText(expected)).toBeVisible();
  expect(screen.getByText(`${expected} (00:00):`)).toBeVisible();
  expect(screen.getByText('berättelse')).toBeVisible();
});

test.each([
  ['ASR-metadata utan text', false, undefined],
  ['tom avskrift trots gammal indikator', true, []],
  ['tomma textsegment', true, [{ text: ' \n ' }]],
])('%s ger ingen avskriftsetikett i tabellen', (label, hasTranscription, segments) => {
  const utterances = { metadata: { process: [{ type: 'asr' }] } };
  if (segments !== undefined) utterances.utterances = segments;
  renderAudioRecord([{
    type: 'audio', source: '4416_3.mp3', has_transcription: hasTranscription, utterances,
  }]);

  expect(screen.queryByText(/ljudavskrift/i)).not.toBeInTheDocument();
});

test('blandade avskrifter sammanfattas neutralt men sökträffen använder rätt ljudfil', () => {
  const media = ['manual', 'asr'].map((type, index) => ({
    id: index,
    type: 'audio',
    source: `${index}.mp3`,
    has_transcription: true,
    utterances: { metadata: { process: [{ type }] } },
  }));
  renderAudioRecord(media, {
    'media.utterances.utterances': {
      hits: {
        hits: [{
          _id: 'hit',
          _nested: { field: 'media', offset: 1 },
          _source: { start: 0 },
          highlight: { 'media.utterances.utterances.text': ['En <em>berättelse</em>.'] },
        }],
      },
    },
  });

  expect(screen.getByText('Ljudavskrift')).toBeVisible();
  expect(screen.getByText('Automatisk ljudavskrift (00:00):')).toBeVisible();
});

test.each([
  ['needsimprovement', 'Sidor 7-8 Tjänare.'],
  ['readytotranscribe', 'Sidor 7-8 Tjänare kan skrivas av.'],
])('segmentetiketten tar hänsyn till accessionens %s-status', async (transcriptionstatus, label) => {
  const user = userEvent.setup();
  const data = {
    id: 'record-a',
    title: 'Uppteckning',
    archive: { archive_id_display_search: ['IFGH 2567'], archive_id_row: 'ifgh02567' },
    recordtype: 'one_accession_row',
    transcriptiontype: 'sida',
    transcriptionstatus,
    media: [7, 8].map((page) => ({
      id: `image-${page}`,
      type: 'image',
      source: `page_${page}.jpg`,
      pagenumber: String(page),
      title: page === 7 ? 'Tjänare' : '',
      transcriptionstatus: 'readytotranscribe',
    })),
    segments: [{ id: 'segment-a', start_media_id: 'image-7' }],
    metadata: [],
    persons: [],
    places: [],
  };
  render(
    <MemoryRouter>
      <table>
        <tbody>
          <RecordListItem
            id={data.id}
            item={{ _source: data }}
            searchParams={{ archive_id: 'IFGH 2567' }}
            columns={['title']}
            shouldRenderColumn={(column) => column === 'title'}
          />
        </tbody>
      </table>
    </MemoryRouter>,
  );

  await user.click(await screen.findByRole('button', { name: /Visa Uppteckningar/ }));
  const segmentLink = screen.getByRole('link', { name: label });
  const target = new URL(segmentLink.href);
  expect(target.pathname).toBe('/records/record-a');
  expect(target.searchParams.get('media')).toBe('0');
  expect(target.searchParams.get('archive_id')).toBe('IFGH 2567');
  expect(data.media.map((page) => page.transcriptionstatus))
    .toEqual(['readytotranscribe', 'readytotranscribe']);
});
