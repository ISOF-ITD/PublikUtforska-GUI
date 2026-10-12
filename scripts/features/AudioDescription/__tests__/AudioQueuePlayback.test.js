/* global beforeEach, afterEach, expect, jest, test */
import {
  act, render, screen, waitFor,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import 'whatwg-fetch';
import {
  createMemoryRouter, Link, Outlet, RouterProvider, useLocation,
} from 'react-router-dom';
import { AudioProvider } from '../../../contexts/AudioContext';
import RoutePageShell from '../../../components/RoutePageShell';
import GlobalAudioPlayer from '../../AudioPlayer/GlobalAudioPlayer';
import AudioTranscript from '../AudioTranscript';
import ListPlayButton from '../ListPlayButton';

jest.mock('../../../config', () => ({ audioUrl: 'https://example.test/audio/' }));
jest.mock('../../../lang/Lang', () => ({ l: (value) => value }));
jest.mock('../../../utils/helpers', () => ({ getAudioTitle: (title) => title }));
jest.mock('../../AudioPlayer/hooks/useMarquee', () => () => [null, null]);

const first = {
  id: 1,
  type: 'audio',
  source: 'a.mp3',
  title: 'Första filen',
  utterances: [{ start: 10, end: 30, text: 'Första avskriften.' }],
};
const second = {
  id: 2,
  type: 'audio',
  source: 'b.mp3',
  title: 'Andra filen',
  utterances: {
    utterances: [
      { start: 0, end: 15, text: 'Andra avskriften.' },
      { start: 15, end: 30, text: 'Fortsättningen av den andra avskriften.' },
    ],
  },
};
const empty = {
  id: 3, type: 'audio', source: 'c.mp3', title: 'Utan avskrift',
};
const record = { id: 'record-a', archive: {}, media: [first, second, empty] };
let player;

function PlaybackPage() {
  const location = useLocation();
  return (
    <AudioProvider>
      <output aria-label="URL">{`${location.pathname}${location.search}${location.hash}`}</output>
      <Outlet context={{ focusOnNavigation: false }} />
      <GlobalAudioPlayer />
    </AudioProvider>
  );
}

function RecordPage() {
  return (
    <RoutePageShell>
      <h2>Inspelningar</h2>
      {record.media.map((audio) => (
        <ListPlayButton
          key={audio.id}
          recordId={record.id}
          recordData={record}
          media={audio}
          recordTitle={audio.title}
        />
      ))}
      <Link to="/other">Annan sida</Link>
      <AudioTranscript record={record} audioItems={record.media} />
    </RoutePageShell>
  );
}

async function setup() {
  const router = createMemoryRouter([{
    element: <PlaybackPage />,
    children: [
      { path: '/records/:id', element: <RecordPage /> },
      { path: '/other', element: <p>Annan sida visas</p> },
    ],
  }], { initialEntries: ['/records/record-a?k=start&category=contentG5'] });
  render(<RouterProvider router={router} />);
  await waitFor(() => expect(Element.prototype.scrollTo).toHaveBeenCalled());
  Element.prototype.scrollTo.mockClear();
  Element.prototype.scrollIntoView.mockClear();
  return { user: userEvent.setup(), router };
}

beforeEach(() => {
  Element.prototype.scrollTo = jest.fn();
  Element.prototype.scrollIntoView = jest.fn();
  window.eventBus = { dispatch: jest.fn() };
  window.innerWidth = 1280;
  global.ResizeObserver = jest.fn(() => ({
    observe: jest.fn(), unobserve: jest.fn(), disconnect: jest.fn(),
  }));
  global.IntersectionObserver = jest.fn(() => ({
    observe: jest.fn(), unobserve: jest.fn(), disconnect: jest.fn(),
  }));
  jest.spyOn(window, 'Audio').mockImplementation(() => {
    const audio = new EventTarget();
    Object.assign(audio, {
      src: '',
      currentTime: 0,
      duration: 30,
      ended: false,
      defaultPlaybackRate: 1,
      playbackRate: 1,
      load: jest.fn(),
      play: jest.fn(() => {
        audio.ended = false;
        audio.dispatchEvent(new Event('play'));
        return Promise.resolve();
      }),
      pause: jest.fn(() => audio.dispatchEvent(new Event('pause'))),
    });
    player = audio;
    return audio;
  });
});

afterEach(() => jest.restoreAllMocks());

function finishAudio() {
  act(() => {
    player.ended = true;
    player.currentTime = player.duration;
    player.dispatchEvent(new Event('pause'));
    player.dispatchEvent(new Event('ended'));
  });
}

test('tidsstämpel ger hela kön; listknappen pausar och pausat filbyte byter avskrift utan sidreset', async () => {
  const { user, router } = await setup();
  expect(player.play).not.toHaveBeenCalled();
  await user.click(screen.getByRole('button', { name: 'Spela från 00:10' }));
  expect(player.currentTime).toBe(10);
  expect(screen.getByText('1/3')).toBeVisible();
  await user.click(screen.getByRole('button', { name: 'Pausa uppspelning' }));
  expect(player.currentTime).toBe(10);
  expect(player.play).toHaveBeenCalledTimes(1);
  Element.prototype.scrollIntoView.mockClear();
  const next = screen.getByRole('button', { name: 'Nästa inspelning: Andra filen' });
  await user.click(next);
  expect(screen.getByRole('heading', { name: 'Avskrift: Andra filen' })).toBeVisible();
  expect(next).toHaveFocus();
  expect(player.play).not.toHaveBeenCalled();
  expect(player.currentTime).toBe(0);
  expect(screen.getByLabelText('URL')).toHaveTextContent('/records/record-a?k=start&category=contentG5#avskrift-2');
  expect(router.state.historyAction).toBe('REPLACE');
  expect(Element.prototype.scrollTo).not.toHaveBeenCalled();
  expect(Element.prototype.scrollIntoView).not.toHaveBeenCalled();
  await user.click(screen.getByRole('button', { name: 'Spela', exact: true }));
  expect(screen.getByRole('button', { name: 'Pausa uppspelning' })).toBeVisible();
  expect(player.play).toHaveBeenCalledTimes(1);
});

test('automatisk fortsättning byter avskrift och visar meddelande för fil utan text, utan fokusflytt', async () => {
  const { user } = await setup();
  await user.click(screen.getAllByRole('button', { name: 'Spela upp', exact: true })[0]);
  await user.click(screen.getByRole('button', { name: 'Inställningar för ljudspelaren' }));
  const auto = screen.getByRole('checkbox', { name: 'Spela nästa automatiskt' });
  await user.click(auto);
  finishAudio();
  expect(screen.getByRole('heading', { name: 'Avskrift: Andra filen' })).toBeVisible();
  expect(auto).toHaveFocus();
  expect(screen.getByRole('button', { name: 'Pausa uppspelning' })).toBeVisible();
  finishAudio();
  expect(screen.getByText('Det finns ingen avskrift för den här inspelningen.')).toBeVisible();
  expect(screen.getByText('3/3')).toBeVisible();
  expect(auto).toHaveFocus();
  expect(Element.prototype.scrollTo).not.toHaveBeenCalled();
  expect(Element.prototype.scrollIntoView).not.toHaveBeenCalled();
  finishAudio();
  expect(screen.getByRole('button', { name: 'Spela', exact: true })).toBeVisible();
});

test('kön och automatiken finns kvar när accessionens sida lämnas', async () => {
  const { user, router } = await setup();
  await user.click(screen.getAllByRole('button', { name: 'Spela upp', exact: true })[0]);
  await user.click(screen.getByRole('button', { name: 'Inställningar för ljudspelaren' }));
  await user.click(screen.getByRole('checkbox', { name: 'Spela nästa automatiskt' }));
  await user.click(screen.getByRole('link', { name: 'Annan sida' }));
  expect(screen.getByText('Annan sida visas')).toBeVisible();
  finishAudio();
  expect(screen.getByText('2/3')).toBeVisible();
  await user.click(screen.getByRole('button', { name: 'Inställningar för ljudspelaren' }));
  expect(screen.getByRole('checkbox', { name: 'Spela nästa automatiskt' })).toBeChecked();
  expect(player.src).toBe('https://example.test/audio/b.mp3');
  expect(player.play).toHaveBeenCalledTimes(1);
  expect(router.state.location.pathname).toBe('/other');
});

test('automatiskt filbyte behåller fokus i läspanelens kontroller utan att följa den nya filens första stycke', async () => {
  const { user } = await setup();
  await user.click(screen.getAllByRole('button', { name: 'Spela upp', exact: true })[0]);
  await user.click(screen.getByRole('button', { name: 'Inställningar för ljudspelaren' }));
  await user.click(screen.getByRole('checkbox', { name: 'Spela nästa automatiskt' }));
  const follow = screen.getByRole('checkbox', { name: 'Följ uppspelningen' });
  expect(follow).toBeChecked();
  await user.keyboard('{Escape}');
  follow.focus();
  Element.prototype.scrollIntoView.mockClear();
  finishAudio();
  expect(screen.getByRole('heading', { name: 'Avskrift: Andra filen' })).toBeVisible();
  expect(follow).toHaveFocus();
  expect(follow).toBeChecked();
  expect(Element.prototype.scrollIntoView).not.toHaveBeenCalled();
  expect(Element.prototype.scrollTo).not.toHaveBeenCalled();
  player.currentTime = 16;
  act(() => player.dispatchEvent(new Event('timeupdate')));
  expect(Element.prototype.scrollIntoView).toHaveBeenCalledWith({ block: 'nearest' });
  expect(screen.getByRole('button', { name: 'Spela från 00:15' })).toHaveAttribute('aria-current', 'true');
  expect(follow).toHaveFocus();
});

test('hastighet och öppen panel följer automatisk fortsättning och återöppning', async () => {
  const { user } = await setup();
  await user.click(screen.getAllByRole('button', { name: 'Spela upp', exact: true })[0]);
  const gear = screen.getByRole('button', { name: 'Inställningar för ljudspelaren' });
  await user.click(gear);
  await user.selectOptions(screen.getByRole('combobox'), '1.4');
  await user.click(screen.getByRole('checkbox', { name: 'Spela nästa automatiskt' }));
  finishAudio();
  expect(player.playbackRate).toBe(1.4);
  expect(screen.getByRole('dialog')).toBeVisible();
  expect(screen.getByRole('combobox')).toHaveValue('1.4');
  expect(gear).toHaveAccessibleDescription('Spela nästa automatiskt är på.');
  await user.keyboard('{Escape}');
  expect(gear).toHaveFocus();
  await user.keyboard('{Enter}');
  expect(screen.getByRole('combobox')).toHaveFocus();
  expect(screen.getByRole('combobox')).toHaveValue('1.4');
  await user.click(screen.getByRole('button', { name: 'Stäng' }));
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Inställningar för ljudspelaren' })).not.toBeInTheDocument();
  await user.click(screen.getAllByRole('button', { name: 'Spela upp', exact: true })[0]);
  await user.click(screen.getByRole('button', { name: 'Inställningar för ljudspelaren' }));
  expect(screen.getByRole('combobox')).toHaveValue('1.4');
  expect(screen.getByRole('checkbox', { name: 'Spela nästa automatiskt' })).not.toBeChecked();
});
