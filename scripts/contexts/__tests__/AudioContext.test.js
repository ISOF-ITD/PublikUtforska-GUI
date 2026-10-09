/* global beforeEach, afterEach, expect, jest, test */
import { useContext } from 'react';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AudioContext, AudioProvider } from '../AudioContext';

jest.mock('../../config', () => ({ audioUrl: 'https://example.test/audio/' }));

const record = { id: 'record-a', title: 'Accession' };
const first = { id: 1, source: 'first.mp3' };
const second = { id: 2, source: 'second.mp3' };
let player;

function Controls() {
  const {
    playAudio, togglePlay, playing, currentTime, durationTime, currentAudio,
  } = useContext(AudioContext);
  return (
    <>
      <button type="button" onClick={() => playAudio({ record, audio: first, time: 10.5 })}>Första filen</button>
      <button type="button" onClick={() => playAudio({ record, audio: second, time: 20 })}>Andra filen</button>
      <button type="button" onClick={togglePlay}>{playing ? 'Pausa' : 'Spela'}</button>
      <output aria-label="Tid">{currentTime}</output>
      <output aria-label="Längd">{durationTime}</output>
      <output aria-label="Fil">{currentAudio?.audio.source}</output>
    </>
  );
}

beforeEach(() => {
  player = new EventTarget();
  Object.assign(player, {
    src: '',
    currentTime: 0,
    duration: 60,
    play: jest.fn(() => Promise.resolve()),
    pause: jest.fn(),
    load: jest.fn(),
  });
  jest.spyOn(window, 'Audio').mockImplementation(() => player);
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
  act(() => player.dispatchEvent(new Event('play')));
  expect(screen.getByRole('button', { name: 'Pausa' })).toBeVisible();
});

test('paus och återupptagning behåller tidsstämpelns position', async () => {
  const user = userEvent.setup();
  render(<AudioProvider><Controls /></AudioProvider>);
  await user.click(screen.getByRole('button', { name: 'Första filen' }));
  player.currentTime = 14;
  act(() => player.dispatchEvent(new Event('timeupdate')));
  await user.click(screen.getByRole('button', { name: 'Pausa' }));
  expect(player.pause).toHaveBeenCalledTimes(2);
  await user.click(screen.getByRole('button', { name: 'Spela' }));
  expect(player.play).toHaveBeenCalledTimes(2);
  expect(player.currentTime).toBe(14);
  expect(screen.getByLabelText('Tid')).toHaveTextContent('14000');
});
