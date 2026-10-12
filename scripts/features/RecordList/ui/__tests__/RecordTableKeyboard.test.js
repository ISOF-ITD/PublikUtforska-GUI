/* global expect, jest, test */
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { AudioContext } from '../../../../contexts/AudioContext';
import config from '../../../../config';
import RecordTable from '../RecordTable';

jest.mock('../../../../utils/helpers', () => ({
  fetchRecordMediaCount: () => {},
  getPlaceString: () => '',
  getSegmentTitle: () => '',
  getTitle: (title) => title,
  getAudioTitle: (title) => title,
  pageFromTo: ({ _source: { archive } }) => archive.page,
}));

function createRecord(id, title, accession) {
  return {
    _id: id,
    _source: {
      archive: {
        archive_id_display_search: [accession],
        archive_id_row: `${accession}-row`,
        page: '1',
      },
      contents: '',
      id,
      materialtype: '',
      media: [],
      metadata: [],
      persons: [],
      places: [],
      recordtype: 'one_record',
      taxonomy: [],
      text: '',
      title,
      transcribedby: '',
      transcriptionstatus: 'published',
      transcriptiontype: 'sida',
      year: '',
    },
  };
}

function renderTable(records = [
  createRecord('record-1', 'Första posten', 'ACC 1'),
  createRecord('record-2', 'Andra posten', 'ACC 2'),
], audioContext = {}) {
  const archiveIdClick = jest.fn();
  const onRecordActivate = jest.fn();
  const visibleColumns = ['title', 'archive_id'];

  render(
    <AudioContext.Provider value={audioContext}>
      <MemoryRouter>
        <button type="button">Före tabellen</button>
        <RecordTable
          records={records}
          uniqueId="keyboard-test"
          params={{}}
          shouldRenderColumn={(column) => visibleColumns.includes(column)}
          archiveIdClick={archiveIdClick}
          columns={visibleColumns}
          onRecordActivate={onRecordActivate}
        />
        <button type="button">Efter tabellen</button>
      </MemoryRouter>
    </AudioContext.Provider>,
  );

  return { archiveIdClick, onRecordActivate };
}

test('Tab och Shift+Tab går mellan radens interaktiva element utan att fokusera raden', async () => {
  const user = userEvent.setup();
  renderTable();

  const beforeTable = screen.getByRole('button', { name: 'Före tabellen' });
  const firstTitle = screen.getByRole('link', { name: 'Första posten' });
  const firstAccession = screen.getByRole('button', { name: 'ACC 1:1' });
  const secondTitle = screen.getByRole('link', { name: 'Andra posten' });
  const secondAccession = screen.getByRole('button', { name: 'ACC 2:1' });
  const afterTable = screen.getByRole('button', { name: 'Efter tabellen' });

  expect(firstTitle.closest('tr')).not.toHaveAttribute('tabindex');
  expect(secondTitle.closest('tr')).not.toHaveAttribute('tabindex');

  await user.tab();
  expect(beforeTable).toHaveFocus();
  await user.tab();
  expect(firstTitle).toHaveFocus();
  await user.tab();
  expect(firstAccession).toHaveFocus();
  await user.tab();
  expect(secondTitle).toHaveFocus();
  await user.tab();
  expect(secondAccession).toHaveFocus();
  await user.tab();
  expect(afterTable).toHaveFocus();
  await user.tab({ shift: true });
  expect(secondAccession).toHaveFocus();
  await user.tab({ shift: true });
  expect(secondTitle).toHaveFocus();
});

test('radens native-kontroller behåller tangentbordsaktivering utan radens pilhantering', async () => {
  const user = userEvent.setup();
  const { archiveIdClick, onRecordActivate } = renderTable();
  const firstTitle = screen.getByRole('link', { name: 'Första posten' });
  const firstAccession = screen.getByRole('button', { name: 'ACC 1:1' });

  firstAccession.focus();
  expect(fireEvent.keyDown(firstAccession, { key: 'ArrowDown' })).toBe(true);
  expect(firstAccession).toHaveFocus();

  await user.keyboard('{Enter}');
  expect(archiveIdClick).toHaveBeenCalledTimes(1);

  firstTitle.focus();
  await user.keyboard('{Enter}');
  expect(onRecordActivate).toHaveBeenCalledWith('record-1');
});

test('uppspelning från sökresultat skickar accessionens hela ljudkö även utan avskriftstext', async () => {
  const user = userEvent.setup();
  const previousOptions = config.siteOptions.recordList;
  config.siteOptions.recordList = { ...previousOptions, displayPlayButton: true };
  try {
    const result = createRecord('record-1', 'Ljudaccession', 'ACC 1');
    const { _source: data } = result;
    data.media = [
      {
        id: 1, type: 'audio', source: 'a.mp3', title: 'Första filen', has_transcription: true,
      },
      {
        id: 2, type: 'audio', source: 'b.mp3', title: 'Andra filen', has_transcription: true,
      },
    ];
    const playAudio = jest.fn();
    renderTable([result], { playAudio, playing: false });
    await user.click(screen.getByRole('button', { name: 'Spela upp' }));
    expect(playAudio).toHaveBeenCalledWith(expect.objectContaining({
      queue: data.media.map((audio) => ({ audio, title: audio.title })),
    }));
  } finally {
    config.siteOptions.recordList = previousOptions;
  }
});
