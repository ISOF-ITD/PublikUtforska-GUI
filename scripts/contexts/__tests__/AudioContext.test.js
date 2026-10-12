/* global beforeEach, afterEach, expect, jest, test */
import { useContext } from 'react';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AudioContext, AudioProvider } from '../AudioContext';

jest.mock('../../config', () => ({ audioUrl: 'https://example.test/audio/' }));

const record = { id: 'record-a', title: 'Accession' };
const first = { id: 1, source: 'first.mp3' };
const second = { id: 2, source: 'second.mp3' };
const queueItems = [{ audio: first, title: 'Första filen' }, { audio: second, title: 'Andra filen' }];
let player;
let nextPlayError;

function Controls() {
  const {
    playAudio, togglePlay, playing, currentTime, durationTime, currentAudio,
    queue, currentIndex, playPrevious, playNext, autoAdvance, setAutoAdvance,
    closeAudio, visible, playbackError, playbackStatus,
    playbackRate, setPlaybackRate,
  } = useContext(AudioContext);
  return (
    <>
      <button
        type="button"
        onClick={() => playAudio({
          record, audio: first, time: 10.5, queue: queueItems,
        })}
      >
        Första filen
      </button>
      <button
        type="button"
        onClick={() => playAudio({
          record, audio: second, time: 20, queue: queueItems,
        })}
      >
        Andra filen
      </button>
      <button type="button" onClick={() => playAudio({ record, audio: first, time: 15 })}>Tidsstämpel utan kö</button>
      <button type="button" onClick={() => playAudio({ record: { ...record, id: 'other' }, audio: first, queue: queueItems })}>Annan accession</button>
      <button type="button" onClick={() => playAudio({ record: { ...record, id: 'legacy' }, audio: first })}>Ensam fil</button>
      <button type="button" onClick={playPrevious}>Föregående fil</button>
      <button type="button" onClick={playNext}>Nästa fil</button>
      <button type="button" onClick={closeAudio}>Stäng</button>
      <button type="button" onClick={() => setPlaybackRate(1.4)}>Hastighet 1,4</button>
      <label htmlFor="auto-advance">
        <input id="auto-advance" type="checkbox" checked={autoAdvance} onChange={(event) => setAutoAdvance(event.target.checked)} />
        Automatisk fortsättning
      </label>
      <button type="button" onClick={togglePlay}>{playing ? 'Pausa' : 'Spela'}</button>
      <output aria-label="Tid">{currentTime}</output>
      <output aria-label="Längd">{durationTime}</output>
      <output aria-label="Fil">{currentAudio?.audio.source}</output>
      <output aria-label="Kö">{`${currentIndex + 1}/${queue.length}`}</output>
      <output aria-label="Synlig">{String(visible)}</output>
      <output aria-label="Fel">{playbackError}</output>
      <output aria-label="Status">{playbackStatus}</output>
      <output aria-label="Hastighet">{playbackRate}</output>
    </>
  );
}

beforeEach(() => {
  nextPlayError = null;
  jest.spyOn(window, 'Audio').mockImplementation(() => {
    const audio = new EventTarget();
    const error = nextPlayError;
    nextPlayError = null;
    Object.assign(audio, {
      src: '',
      currentTime: 0,
      duration: 60,
      ended: false,
      playbackRate: 1,
      defaultPlaybackRate: 1,
      play: jest.fn(() => {
        audio.ended = false;
        audio.dispatchEvent(new Event('play'));
        return error ? Promise.reject(error) : Promise.resolve();
      }),
      pause: jest.fn(() => audio.dispatchEvent(new Event('pause'))),
      load: jest.fn(),
    });
    player = audio;
    return audio;
  });
  window.eventBus = { dispatch: jest.fn() };
});

afterEach(() => jest.restoreAllMocks());

test('mediehändelser uppdaterar tid och längd även efter filbyte, utan automatisk ljudstart', async () => {
  const user = userEvent.setup();
  render(<AudioProvider><Controls /></AudioProvider>);
  expect(player.play).not.toHaveBeenCalled();
  await user.click(screen.getByRole('button', { name: 'Första filen' }));
  expect(player.currentTime).toBe(10.5);
  expect(screen.getByLabelText('Tid')).toHaveTextContent('10500');
  act(() => player.dispatchEvent(new Event('loadedmetadata')));
  expect(screen.getByLabelText('Längd')).toHaveTextContent('60000');
  player.currentTime = 14.75;
  act(() => player.dispatchEvent(new Event('timeupdate')));
  expect(screen.getByLabelText('Tid')).toHaveTextContent('14750');
  await user.click(screen.getByRole('button', { name: 'Andra filen' }));
  expect(player.src).toBe('https://example.test/audio/second.mp3');
  expect(screen.getByLabelText('Fil')).toHaveTextContent(second.source);
  player.currentTime = 22;
  act(() => player.dispatchEvent(new Event('timeupdate')));
  expect(screen.getByLabelText('Tid')).toHaveTextContent('22000');
  act(() => player.dispatchEvent(new Event('pause')));
  expect(screen.getByRole('button', { name: 'Spela' })).toBeVisible();
  await user.click(screen.getByRole('button', { name: 'Spela' }));
  expect(screen.getByRole('button', { name: 'Pausa' })).toBeVisible();
});

test('paus och återupptagning behåller tidsstämpelns position', async () => {
  const user = userEvent.setup();
  render(<AudioProvider><Controls /></AudioProvider>);
  await user.click(screen.getByRole('button', { name: 'Första filen' }));
  player.currentTime = 14;
  act(() => player.dispatchEvent(new Event('timeupdate')));
  await user.click(screen.getByRole('button', { name: 'Pausa' }));
  expect(player.pause).toHaveBeenCalledTimes(1);
  await user.click(screen.getByRole('button', { name: 'Spela' }));
  expect(player.play).toHaveBeenCalledTimes(2);
  expect(player.currentTime).toBe(14);
  expect(screen.getByLabelText('Tid')).toHaveTextContent('14000');
});

function finishAudio(audio = player) {
  const finishedPlayer = audio;
  act(() => {
    finishedPlayer.currentTime = finishedPlayer.duration;
    finishedPlayer.ended = true;
    finishedPlayer.dispatchEvent(new Event('pause'));
    finishedPlayer.dispatchEvent(new Event('ended'));
  });
}

test('nästa och föregående startar vid början och behåller uppspelning, hastighet och gränser', async () => {
  const user = userEvent.setup();
  render(<AudioProvider><Controls /></AudioProvider>);
  await user.click(screen.getByRole('button', { name: 'Första filen' }));
  await user.click(screen.getByRole('button', { name: 'Hastighet 1,4' }));
  expect(player.defaultPlaybackRate).toBe(1.4);
  await user.click(screen.getByRole('button', { name: 'Föregående fil' }));
  expect(player.currentTime).toBe(10.5);
  await user.click(screen.getByRole('button', { name: 'Nästa fil' }));
  expect(player.currentTime).toBe(0);
  expect(player.playbackRate).toBe(1.4);
  expect(screen.getByLabelText('Hastighet')).toHaveTextContent('1.4');
  expect(player.play).toHaveBeenCalledTimes(1);
  expect(screen.getByLabelText('Kö')).toHaveTextContent('2/2');
  expect(screen.getByLabelText('Längd')).toHaveTextContent('0');
  expect(screen.getByLabelText('Status')).toHaveTextContent('Inspelning 2 av 2: Andra filen');
  const lastPlayer = player;
  await user.click(screen.getByRole('button', { name: 'Nästa fil' }));
  expect(player).toBe(lastPlayer);
  await user.click(screen.getByRole('button', { name: 'Föregående fil' }));
  expect(screen.getByLabelText('Fil')).toHaveTextContent(first.source);
  expect(player.currentTime).toBe(0);
});

test('vald hastighet behålls efter tidsstämpel, annan accession och stängning utan att starta ljud', async () => {
  const user = userEvent.setup();
  render(<AudioProvider><Controls /></AudioProvider>);
  await user.click(screen.getByRole('button', { name: 'Hastighet 1,4' }));
  expect(player.play).not.toHaveBeenCalled();
  await user.click(screen.getByRole('button', { name: 'Första filen' }));
  expect(player.playbackRate).toBe(1.4);
  await user.click(screen.getByRole('button', { name: 'Tidsstämpel utan kö' }));
  expect(player.playbackRate).toBe(1.4);
  await user.click(screen.getByRole('button', { name: 'Annan accession' }));
  expect(player.playbackRate).toBe(1.4);
  await user.click(screen.getByRole('button', { name: 'Stäng' }));
  expect(screen.getByLabelText('Hastighet')).toHaveTextContent('1.4');
  await user.click(screen.getByRole('button', { name: 'Ensam fil' }));
  expect(player.playbackRate).toBe(1.4);
});

test('filbyte under paus väljer rätt fil utan ljudstart och återupptagning spelar den nya filen', async () => {
  const user = userEvent.setup();
  render(<AudioProvider><Controls /></AudioProvider>);
  await user.click(screen.getByRole('button', { name: 'Första filen' }));
  await user.click(screen.getByRole('button', { name: 'Pausa' }));
  await user.click(screen.getByRole('button', { name: 'Nästa fil' }));
  expect(screen.getByLabelText('Fil')).toHaveTextContent(second.source);
  expect(player.currentTime).toBe(0);
  expect(player.play).not.toHaveBeenCalled();
  await user.click(screen.getByRole('button', { name: 'Spela' }));
  expect(player.play).toHaveBeenCalledTimes(1);
});

test('automatik är av från början och sista filen stannar utan återupprepning', async () => {
  const user = userEvent.setup();
  render(<AudioProvider><Controls /></AudioProvider>);
  const auto = screen.getByRole('checkbox');
  expect(auto).not.toBeChecked();
  await user.click(screen.getByRole('button', { name: 'Första filen' }));
  finishAudio();
  expect(screen.getByLabelText('Fil')).toHaveTextContent(first.source);
  expect(screen.getByRole('button', { name: 'Spela' })).toBeVisible();
  await user.click(auto);
  expect(player.play).toHaveBeenCalledTimes(1);
  await user.click(screen.getByRole('button', { name: 'Första filen' }));
  finishAudio();
  expect(screen.getByLabelText('Fil')).toHaveTextContent(second.source);
  expect(screen.getByRole('button', { name: 'Pausa' })).toBeVisible();
  expect(player.currentTime).toBe(0);
  finishAudio();
  expect(screen.getByLabelText('Kö')).toHaveTextContent('2/2');
  expect(screen.getByRole('button', { name: 'Spela' })).toBeVisible();
});

test('automatik och kö behålls vid tidsstämpel men återställs för annan accession och stängning', async () => {
  const user = userEvent.setup();
  render(<AudioProvider><Controls /></AudioProvider>);
  await user.click(screen.getByRole('button', { name: 'Första filen' }));
  await user.click(screen.getByRole('checkbox'));
  await user.click(screen.getByRole('button', { name: 'Tidsstämpel utan kö' }));
  expect(screen.getByRole('checkbox')).toBeChecked();
  expect(screen.getByLabelText('Kö')).toHaveTextContent('1/2');
  expect(player.currentTime).toBe(15);
  await user.click(screen.getByRole('button', { name: 'Annan accession' }));
  expect(screen.getByRole('checkbox')).not.toBeChecked();
  await user.click(screen.getByRole('checkbox'));
  const closedPlayer = player;
  await user.click(screen.getByRole('button', { name: 'Stäng' }));
  finishAudio(closedPlayer);
  expect(screen.getByRole('checkbox')).not.toBeChecked();
  expect(screen.getByLabelText('Kö')).toHaveTextContent('0/0');
  expect(screen.getByLabelText('Synlig')).toHaveTextContent('false');
  expect(screen.getByLabelText('Fil')).toBeEmptyDOMElement();
  expect(window.eventBus.dispatch).toHaveBeenCalledWith('audio.playerhidden');
});

test('manuell paus och sena ended-händelser startar inte nästa fil', async () => {
  const user = userEvent.setup();
  render(<AudioProvider><Controls /></AudioProvider>);
  await user.click(screen.getByRole('button', { name: 'Första filen' }));
  await user.click(screen.getByRole('checkbox'));
  await user.click(screen.getByRole('button', { name: 'Pausa' }));
  finishAudio();
  expect(screen.getByLabelText('Fil')).toHaveTextContent(first.source);
  await user.click(screen.getByRole('button', { name: 'Första filen' }));
  const oldPlayer = player;
  await user.click(screen.getByRole('button', { name: 'Nästa fil' }));
  oldPlayer.currentTime = 500;
  act(() => {
    oldPlayer.dispatchEvent(new Event('timeupdate'));
    oldPlayer.dispatchEvent(new Event('error'));
  });
  finishAudio(oldPlayer);
  expect(screen.getByLabelText('Fil')).toHaveTextContent(second.source);
  expect(screen.getByLabelText('Tid')).toHaveTextContent('0');
  expect(screen.getByLabelText('Fel')).toBeEmptyDOMElement();
  expect(screen.getByRole('button', { name: 'Pausa' })).toBeVisible();
});

test('sena play-avslag påverkar inte den nya filen eller en manuell paus', async () => {
  const user = userEvent.setup();
  render(<AudioProvider><Controls /></AudioProvider>);
  let rejectPlay;
  player.play.mockImplementationOnce(() => new Promise((resolve, reject) => {
    rejectPlay = reject;
  }));
  await user.click(screen.getByRole('button', { name: 'Första filen' }));
  await user.click(screen.getByRole('button', { name: 'Nästa fil' }));
  await act(async () => rejectPlay(new Error('Old request')));
  expect(screen.getByLabelText('Fel')).toBeEmptyDOMElement();
  expect(screen.getByRole('button', { name: 'Pausa' })).toBeVisible();
  player.play.mockImplementationOnce(() => new Promise((resolve, reject) => {
    rejectPlay = reject;
  }));
  await user.click(screen.getByRole('button', { name: 'Andra filen' }));
  await user.click(screen.getByRole('button', { name: 'Pausa' }));
  await act(async () => rejectPlay(new Error('Cancelled request')));
  expect(screen.getByLabelText('Fel')).toBeEmptyDOMElement();
  expect(screen.getByRole('button', { name: 'Spela' })).toBeVisible();
});

test('fel vid automatisk uppspelning stoppar kön och ger återkoppling utan att hoppa vidare', async () => {
  const user = userEvent.setup();
  render(<AudioProvider><Controls /></AudioProvider>);
  await user.click(screen.getByRole('button', { name: 'Första filen' }));
  await user.click(screen.getByRole('checkbox'));
  nextPlayError = new Error('Playback blocked');
  finishAudio();
  expect(await screen.findByText(/Inspelningen kunde inte spelas upp/)).toBeVisible();
  expect(screen.getByLabelText('Fil')).toHaveTextContent(second.source);
  expect(screen.getByRole('button', { name: 'Spela' })).toBeVisible();
  finishAudio();
  expect(screen.getByLabelText('Kö')).toHaveTextContent('2/2');
});

test('mediafel stoppar ljudet och anrop utan kö fungerar som en ensam fil', async () => {
  const user = userEvent.setup();
  render(<AudioProvider><Controls /></AudioProvider>);
  await user.click(screen.getByRole('button', { name: 'Ensam fil' }));
  expect(screen.getByLabelText('Kö')).toHaveTextContent('1/1');
  act(() => player.dispatchEvent(new Event('error')));
  expect(screen.getByLabelText('Fel')).toHaveTextContent('Inspelningen kunde inte spelas upp');
  expect(screen.getByRole('button', { name: 'Spela' })).toBeVisible();
});
