/* global expect, jest, test */
import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import RecordCardItem from '../RecordCardItem';
import TranscriptionStatus from '../TranscriptionStatus';

jest.mock('../../../../utils/helpers', () => ({
  getPlaceString: () => '',
  getTitle: (title) => title,
  pageFromTo: () => '',
}));

jest.mock('../RecordCardSnippet', () => ({
  __esModule: true,
  default: () => null,
  selectBestCardSnippet: () => null,
  toSemanticHighlightHtml: (text) => text,
}));

test('ljudavskriftens etikett behåller gul bakgrund i ljust läge och följer mörkt tema', () => {
  render(
    <MemoryRouter>
      <RecordCardItem
        item={{
          _source: {
            id: 'audio-1',
            title: 'Inspelning med avskrift',
            recordtype: 'one_audio_record',
            media: [{ type: 'audio', has_transcription: true }],
          },
        }}
        searchParams={{}}
      />
    </MemoryRouter>,
  );

  expect(screen.getByText('Automatisk ljudavskrift')).toHaveClass(
    'bg-yellow-50',
    'dark:bg-surface-muted',
    'text-body',
  );
});

// IFGH 3461 has four published page images, but stale accession counters.
function createPageRecord(overrides = {}) {
  return {
    _source: {
      id: 'ifgh03461_201460',
      title: 'Häxor och trollkarlar.',
      recordtype: 'one_accession_row',
      transcriptiontype: 'sida',
      transcriptionstatus: 'published',
      numberofpages: 2,
      numberoftranscribedpages: 0,
      numberoftranscribedonerecord: 0,
      media: [
        { id: 280146, type: 'pdf', transcriptionstatus: 'accession' },
        ...[12, 13, 30, 31].map((page) => ({
          id: page,
          type: 'image',
          pagenumber: String(page),
          transcriptionstatus: 'published',
        })),
      ],
      ...overrides,
    },
  };
}

function renderCard(item) {
  return render(
    <MemoryRouter>
      <RecordCardItem item={item} searchParams={{}} />
    </MemoryRouter>,
  );
}

test('IFGH 3461 visar fyra av fyra sidor trots gamla räknare och inkluderad PDF', () => {
  renderCard(createPageRecord());

  expect(screen.getByText('4 av 4 sidor')).toBeInTheDocument();
  expect(screen.queryByText('0 av 2 sidor')).not.toBeInTheDocument();
  const progress = screen.getByRole('progressbar', { name: 'Avskrivna: 4 av 4 sidor' });
  expect(progress).toHaveAttribute('aria-valuemin', '0');
  expect(progress).toHaveAttribute('aria-valuemax', '4');
  expect(progress).toHaveAttribute('aria-valuenow', '4');
  expect(progress.firstElementChild).toHaveStyle({ width: '100%' });
});

test.each([0, 2, 4])('kort och tabell visar samma framsteg med %i publicerade sidor', (done) => {
  const { _source: originalSource } = createPageRecord();
  const source = {
    ...originalSource,
    media: originalSource.media.map((page, index) => (
      page.type === 'pdf' ? page : {
        ...page,
        transcriptionstatus: index <= done ? 'published' : 'readytotranscribe',
      }
    )),
  };
  const item = { _source: source };
  render(
    <MemoryRouter>
      <RecordCardItem item={item} searchParams={{}} />
      <TranscriptionStatus
        status={source.transcriptionstatus}
        media={source.media}
        transcriptiontype={source.transcriptiontype}
      />
    </MemoryRouter>,
  );

  const label = `${done} av 4 sidor`;
  const card = within(screen.getByRole('article'));
  const tableStatus = within(screen.getByRole('group', { name: 'Avskrivna sidor' }));
  expect(card.getByText(label)).toBeInTheDocument();
  expect(tableStatus.getByText(label)).toBeInTheDocument();
  [card, tableStatus].forEach((view) => {
    const progress = view.getByRole('progressbar');
    expect(progress).toHaveAttribute('aria-valuemax', '4');
    expect(progress).toHaveAttribute('aria-valuenow', String(done));
    expect(progress.firstElementChild).toHaveStyle({ width: `${(done / 4) * 100}%` });
  });
});

test.each([
  ['tom medielista', []],
  ['enbart PDF', [{ type: 'pdf', transcriptionstatus: 'published' }]],
  ['null', null],
])('visar ingen sidräknare för %s trots gamla sammanfattningsfält', (label, media) => {
  renderCard(createPageRecord({ media }));

  expect(screen.queryByText('Avskrivna')).not.toBeInTheDocument();
  expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
});

test.each([
  ['ljudtyp', { transcriptiontype: 'audio' }],
  ['ljudpost', { recordtype: 'one_audio_record' }],
  ['ljudfil', { media: [{ type: 'audio', transcriptionstatus: 'published' }] }],
  ['MP3-fil', { media: [{ type: 'file', source: 'recording.mp3' }] }],
  ['bidragsstatus', { transcriptionstatus: 'readytocontribute' }],
])('visar ingen sidräknare för %s', (label, overrides) => {
  renderCard(createPageRecord(overrides));

  expect(screen.queryByText('Avskrivna')).not.toBeInTheDocument();
  expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
});
