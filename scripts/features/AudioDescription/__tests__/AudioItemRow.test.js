/* global beforeEach, afterEach, expect, jest, test */
import { useContext } from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, useLocation } from 'react-router-dom';
import AudioItemRow from '../AudioItemRow';
import { AudioContext, AudioProvider } from '../../../contexts/AudioContext';

jest.mock('../../../config', () => ({ audioUrl: 'https://example.test/audio/' }));
jest.mock('../../../utils/helpers', () => ({ getAudioTitle: (title) => title }));
jest.mock('../hooks/useAudioDuration', () => () => 1935);

const first = {
  id: 1, type: 'audio', source: 'first.mp3', title: 'Emil Claesson intervju',
};
const second = {
  id: 2, type: 'audio', source: 'second.mp3', title: 'Andra inspelningen',
};
const record = { id: 'record-a', media: [first, second] };

function audioRow(item, highlightData) {
  return (
    <AudioItemRow
      item={item}
      audioTitle={item.title}
      highlightData={highlightData}
      recordId={record.id}
      recordData={record}
      openItems={{}}
      onToggle={jest.fn()}
      showAddForm={{}}
      onToggleAddForm={jest.fn()}
      isLocked={false}
      hasSession={false}
      serverHasOngoingSession={false}
      startTranscribe={jest.fn()}
      cancelTranscribe={jest.fn()}
      config={{}}
      formData={{}}
      setFormData={jest.fn()}
      setInitialFormData={jest.fn()}
      handleSave={jest.fn()}
      hasUnsavedChanges={false}
      setHasUnsavedChanges={jest.fn()}
      handleDelete={jest.fn()}
      canContribute={false}
    />
  );
}

function hit(start, text = 'En <em>ko</em>, gammal ko.', field = 'media.utterances.utterances.text') {
  return { id: String(start), _source: { start }, highlight: { [field]: [text] } };
}

let player;

function PlaybackStatus() {
  const { playing, currentAudio, queue } = useContext(AudioContext);
  const location = useLocation();
  return (
    <>
      <output aria-label="Uppspelning">{playing ? 'spelar' : 'paus'}</output>
      <output aria-label="Fil">{currentAudio?.audio.source}</output>
      <output aria-label="Kö">{queue.map((entry) => entry.audio.source).join(',')}</output>
      <output aria-label="URL">{`${location.pathname}${location.search}${location.hash}`}</output>
    </>
  );
}

function setup(highlightData = [hit(1439), hit(424)]) {
  render(
    <MemoryRouter initialEntries={['/records/record-a?k=start&q=ko&category=contentG5']}>
      <AudioProvider>
        <table>
          <tbody>
            {audioRow(first, highlightData)}
            {audioRow(second, [hit(424)])}
          </tbody>
        </table>
        <PlaybackStatus />
      </AudioProvider>
    </MemoryRouter>,
  );
  return userEvent.setup();
}

beforeEach(() => {
  window.eventBus = { dispatch: jest.fn() };
  jest.spyOn(window, 'Audio').mockImplementation(() => {
    const audio = new EventTarget();
    Object.assign(audio, {
      src: '',
      currentTime: 0,
      playbackRate: 1,
      defaultPlaybackRate: 1,
      play: jest.fn(() => {
        audio.dispatchEvent(new Event('play'));
        return Promise.resolve();
      }),
      pause: jest.fn(() => audio.dispatchEvent(new Event('pause'))),
      load: jest.fn(),
    });
    player = audio;
    return audio;
  });
});

afterEach(() => jest.restoreAllMocks());

test('sökträffens tid startar rätt ljudfil och behåller kön och sökkontexten', async () => {
  const user = setup();
  expect(player.play).not.toHaveBeenCalled();
  const timestamp = screen.getByRole('button', { name: 'Spela Emil Claesson intervju från 23:59' });
  expect(timestamp).toHaveAttribute('type', 'button');
  expect(timestamp.querySelector('time')).toHaveAttribute('datetime', 'PT1439S');
  expect(timestamp).toHaveTextContent('23:59');
  expect(timestamp.closest('div').querySelector('em')).toHaveTextContent('ko');

  await user.click(timestamp);
  expect(player.src).toBe('https://example.test/audio/first.mp3');
  expect(player.currentTime).toBe(1439);
  expect(player.play).toHaveBeenCalledTimes(1);
  expect(screen.getByLabelText('Uppspelning')).toHaveTextContent('spelar');
  expect(screen.getByLabelText('Kö')).toHaveTextContent('first.mp3,second.mp3');
  expect(screen.getByLabelText('URL')).toHaveTextContent('/records/record-a?k=start&q=ko&category=contentG5');
  expect(timestamp).toHaveFocus();

  await user.click(screen.getByRole('button', { name: 'Spela Emil Claesson intervju från 07:04' }));
  expect(player.currentTime).toBe(424);
  await user.click(timestamp);
  expect(player.currentTime).toBe(1439);
  expect(player.play).toHaveBeenCalledTimes(3);
  expect(screen.getByLabelText('Uppspelning')).toHaveTextContent('spelar');
});

test('tiden kan nås med Tab och aktiveras med Enter och mellanslag, även efter filbyte och paus', async () => {
  const user = setup();
  await user.tab();
  expect(screen.getAllByRole('button', { name: 'Spela upp', exact: true })[0]).toHaveFocus();
  await user.tab();
  const timestamp = screen.getByRole('button', { name: 'Spela Emil Claesson intervju från 23:59' });
  expect(timestamp).toHaveFocus();
  await user.keyboard('{Enter}');
  expect(player.currentTime).toBe(1439);

  await user.click(screen.getAllByRole('button', { name: 'Spela upp', exact: true })[0]);
  expect(screen.getByLabelText('Fil')).toHaveTextContent('second.mp3');
  expect(player.src).toBe('https://example.test/audio/second.mp3');
  const previousPlayer = player;
  timestamp.focus();
  await user.keyboard(' ');
  expect(previousPlayer.pause).toHaveBeenCalled();
  expect(player.src).toBe('https://example.test/audio/first.mp3');
  expect(player.currentTime).toBe(1439);
  expect(timestamp).toHaveFocus();

  await user.click(screen.getByRole('button', { name: 'Pausa uppspelning' }));
  expect(screen.getByLabelText('Uppspelning')).toHaveTextContent('paus');
  timestamp.focus();
  await user.keyboard('{Enter}');
  expect(player.currentTime).toBe(1439);
  expect(screen.getByLabelText('Uppspelning')).toHaveTextContent('spelar');
});

test('noll och numeriska strängar med decimaler behåller rätt starttid', async () => {
  const user = setup([hit(0), hit('424.5')]);
  const zero = screen.getByRole('button', { name: 'Spela Emil Claesson intervju från 00:00' });
  expect(zero.querySelector('time')).toHaveAttribute('datetime', 'PT0S');
  await user.click(zero);
  expect(player.currentTime).toBe(0);
  const fractional = screen.getByRole('button', { name: 'Spela Emil Claesson intervju från 07:04' });
  expect(fractional.querySelector('time')).toHaveAttribute('datetime', 'PT424.5S');
  await user.click(fractional);
  expect(player.currentTime).toBe(424.5);
});

test('blandade sökträffar håller isär innehållsbeskrivningar och avskrifter och ignorerar ogiltiga tider', () => {
  setup([
    hit(1439),
    hit('02:10', 'Beskrivning av en <em>ko</em>.', 'media.description.text'),
    ...[undefined, null, '', ' ', 'ogiltig', -1, Infinity, true].map((start) => hit(start)),
    { id: 'missing-source', highlight: { 'media.utterances.utterances.text': ['Text'] } },
    { id: 'missing-highlight', _source: { start: 10 } },
    { id: 'empty-highlight', _source: { start: 20 }, highlight: { 'media.utterances.utterances.text': [] } },
  ]);
  const row = screen.getByRole('heading', { name: first.title }).closest('tr');
  expect(within(row).getAllByRole('button', { name: /Spela .* från/ })).toHaveLength(1);
  expect(within(row).getByText(/Innehållsbeskrivning: 02:10/)).toBeVisible();
  expect(within(row).getAllByText(/^Ljudavskrift/)).toHaveLength(1);
});

test.each([
  ['manuell', [{ type: 'Manual' }], 'Manuell ljudavskrift'],
  ['ASR', [{ type: 'asr' }], 'Automatisk ljudavskrift'],
  ['ASR med versaler', [{ type: 'ASR' }], 'Automatisk ljudavskrift'],
  ['OCR', [{ type: 'ocr+align' }], 'Ljudavskrift'],
  ['okänd typ', [{ type: 'other' }], 'Ljudavskrift'],
  ['saknad metadata', undefined, 'Ljudavskrift'],
  ['manuell och ASR', [{ type: 'asr' }, { type: 'manual' }], 'Manuell ljudavskrift'],
])('sökträff i ljudfil med %s process får rätt etikett', (label, process, expected) => {
  const item = { ...first, utterances: { metadata: { process } } };
  render(
    <MemoryRouter>
      <AudioProvider>
        <table><tbody>{audioRow(item, [hit(0)])}</tbody></table>
      </AudioProvider>
    </MemoryRouter>,
  );

  expect(screen.getByText(new RegExp(`^${expected}`))).toBeVisible();
  if (expected !== 'Automatisk ljudavskrift') {
    expect(screen.queryByText(/Automatisk ljudavskrift/)).not.toBeInTheDocument();
  }
});

test('sökträffarnas etiketter använder respektive ljudfils process', () => {
  const manual = { ...first, utterances: { metadata: { process: [{ type: 'manual' }] } } };
  const asr = { ...second, utterances: { metadata: { process: [{ type: 'asr' }] } } };
  render(
    <MemoryRouter>
      <AudioProvider>
        <table>
          <tbody>
            {audioRow(manual, [hit(0)])}
            {audioRow(asr, [hit(10)])}
          </tbody>
        </table>
      </AudioProvider>
    </MemoryRouter>,
  );

  const manualRow = screen.getByRole('heading', { name: first.title }).closest('tr');
  const asrRow = screen.getByRole('heading', { name: second.title }).closest('tr');
  expect(within(manualRow).getByText(/^Manuell ljudavskrift/)).toBeVisible();
  expect(within(asrRow).getByText(/^Automatisk ljudavskrift/)).toBeVisible();
});
