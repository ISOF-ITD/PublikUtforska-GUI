/* global beforeEach, expect, jest, test */
import { useMemo, useState } from 'react';
import {
  act, render, screen, waitFor,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import 'whatwg-fetch';
import {
  createMemoryRouter, Link, Outlet, RouterProvider, useLocation,
} from 'react-router-dom';
import AudioTranscript, { TranscriptReader } from '../AudioTranscript';
import ListPlayButton from '../ListPlayButton';
import { AudioContext } from '../../../contexts/AudioContext';
import RoutePageShell from '../../../components/RoutePageShell';
import {
  audioTranscriptLoader, normalizeTranscript, transcriptExport, transcriptFragment,
} from '../transcriptUtils';

jest.mock('../../../lang/Lang', () => ({ l: (value) => value }));
jest.mock('../../../utils/helpers', () => ({ getAudioTitle: (title) => title }));

// whatwg-fetch lacks the body property used by React Router to recognise redirects.
Object.defineProperty(window.Response.prototype, 'body', { value: null, configurable: true });

const empty = { id: 1, source: 'empty.mp3', title: 'Utan text' };
const first = {
  id: 2,
  source: 'first.mp3',
  title: 'Första filen',
  utterances: [
    { start: '00:00', end: '00:10', text: 'En berättelse om skogen.' },
    { start: '00:10.5', end: '00:20', text: 'Sedan kom regnet.' },
    { start: 20, end: 30, text: 'Skogen var stilla.' },
  ],
};
const second = {
  id: 3,
  source: 'second.mp3',
  title: 'Andra filen',
  utterances: { utterances: [{ start: 0, end: 40, text: 'En annan berättelse.' }] },
};
const record = { id: 'record-a', archive: {}, media: [empty, first, second] };
const longAudio = {
  ...first,
  utterances: Array.from({ length: 8 }, (_, index) => ({
    start: index * 10, end: (index + 1) * 10, text: `Stycke ${index + 1}.`,
  })),
};
const playSpy = jest.fn();
const pauseSpy = jest.fn();

function longReader(context = {}) {
  return (
    <AudioContext.Provider value={{ playing: false, playAudio: playSpy, ...context }}>
      <TranscriptReader
        record={record}
        audio={longAudio}
        title={longAudio.title}
        headingRef={{ current: null }}
      />
    </AudioContext.Provider>
  );
}

function renderLongReader(context = {}) {
  return render(longReader(context));
}

function Harness() {
  const location = useLocation();
  const [currentAudio, setCurrentAudio] = useState(null);
  const [playing, setPlaying] = useState(false);
  const context = useMemo(() => ({
    currentAudio,
    playing,
    currentTime: (currentAudio?.time ?? 0) * 1000,
    playAudio: (next) => { playSpy(next); setCurrentAudio(next); setPlaying(true); },
    togglePlay: () => { pauseSpy(); setPlaying((previous) => !previous); },
  }), [currentAudio, playing]);
  return (
    <AudioContext.Provider value={context}>
      <output aria-label="Uppspelning">{playing ? 'spelar' : 'paus'}</output>
      <output aria-label="URL">{`${location.pathname}${location.search}${location.hash}`}</output>
      <Outlet context={{ focusOnNavigation: location.key !== 'default' }} />
    </AudioContext.Provider>
  );
}

function Page() {
  return (
    <RoutePageShell>
      {record.media.map((audio) => (
        <div key={audio.id}>
          <Link
            to={`?k=start#${transcriptFragment(audio.id)}`}
            state={{ focusTranscript: true }}
            replace={false}
          >
            {`Läs ${audio.title}`}
          </Link>
          <ListPlayButton recordId={record.id} media={audio} recordTitle={audio.title} />
        </div>
      ))}
      <AudioTranscript record={record} audioItems={record.media} />
    </RoutePageShell>
  );
}

function transcriptRoutes() {
  return [{
    element: <Harness />,
    hydrateFallbackElement: <p>Laddar</p>,
    children: [{
      path: '/records/:recordId',
      element: <Page />,
      children: [{
        path: 'audio/:audioId/transcribe/*?',
        loader: audioTranscriptLoader,
        element: <p role="status">Öppnar avskriften</p>,
      }],
    }],
  }];
}

async function setup(path = '/records/record-a?k=start') {
  const router = createMemoryRouter(transcriptRoutes(), { initialEntries: [path] });
  render(<RouterProvider router={router} />);
  await screen.findByRole('heading', { name: /Avskrift:/ });
  await waitFor(() => expect(Element.prototype.scrollTo).toHaveBeenCalled());
  Element.prototype.scrollTo.mockClear();
  const user = userEvent.setup();
  jest.spyOn(navigator.clipboard, 'writeText');
  return { router, user };
}

beforeEach(() => {
  Element.prototype.scrollIntoView = jest.fn();
  Element.prototype.scrollTo = jest.fn();
});

test('visar första avskriften, alla stycken, med följning av och utan ljudstart', async () => {
  await setup();
  expect(screen.getByRole('heading', { name: 'Avskrift: Första filen' })).toBeVisible();
  expect(screen.getAllByRole('button', { name: /Spela från/ })).toHaveLength(3);
  expect(screen.getByText('Sedan kom regnet.').closest('p')).not.toHaveAttribute('role');
  expect(screen.getByRole('checkbox', { name: 'Följ uppspelningen' })).not.toBeChecked();
  expect(playSpy).not.toHaveBeenCalled();
});

test.each([
  '/records/record-a?k=start#avskrift-3',
  '/records/record-a/audio/3/transcribe?k=start',
  '/records/record-a/audio/3/transcribe/?k=start',
  '/records/record-a/audio/3/transcribe/older-path?k=start',
])('direktlänken %s väljer omslutna utterances och bevarar sökkontext', async (path) => {
  await setup(path);
  expect(screen.getByRole('heading', { name: 'Avskrift: Andra filen' })).toBeVisible();
  expect(screen.getByLabelText('URL')).toHaveTextContent('/records/record-a?k=start#avskrift-3');
  await waitFor(() => expect(Element.prototype.scrollIntoView).toHaveBeenCalledWith({ block: 'start' }));
  expect(screen.getByRole('heading', { name: 'Avskrift: Andra filen' })).not.toHaveFocus();
  expect(playSpy).not.toHaveBeenCalled();
});

test('manuella val fokuserar rubriken, historik återställer valet utan ljud eller sidreset', async () => {
  const { router, user } = await setup();
  await user.click(screen.getByRole('link', { name: 'Läs Andra filen' }));
  expect(screen.getByRole('heading', { name: 'Avskrift: Andra filen' })).toHaveFocus();
  expect(Element.prototype.scrollTo).not.toHaveBeenCalled();
  await user.click(screen.getByRole('link', { name: 'Läs Första filen' }));
  await act(async () => router.navigate(-1));
  expect(screen.getByRole('heading', { name: 'Avskrift: Andra filen' })).toBeVisible();
  expect(screen.getByRole('heading', { name: 'Avskrift: Andra filen' })).not.toHaveFocus();
  await act(async () => router.navigate(1));
  expect(screen.getByRole('heading', { name: 'Avskrift: Första filen' })).toBeVisible();
  expect(playSpy).not.toHaveBeenCalled();
  expect(pauseSpy).not.toHaveBeenCalled();
});

test('val av redan öppnad avskrift rullar till och fokuserar rubriken', async () => {
  const { user } = await setup('/records/record-a?k=start#avskrift-2');
  await user.click(screen.getByRole('link', { name: 'Läs Första filen' }));
  expect(screen.getByRole('heading', { name: 'Avskrift: Första filen' })).toHaveFocus();
  expect(Element.prototype.scrollIntoView).toHaveBeenCalledWith({ block: 'start' });
  expect(Element.prototype.scrollTo).not.toHaveBeenCalled();
});

test('filbyte ersätter fragment utan att rulla eller flytta fokus, även utan avskrift', async () => {
  const { user, router } = await setup();
  await user.click(screen.getAllByRole('button', { name: 'Spela upp', exact: true })[2]);
  expect(screen.getByRole('heading', { name: 'Avskrift: Andra filen' })).toBeVisible();
  expect(screen.getByRole('button', { name: 'Pausa uppspelning' })).toHaveFocus();
  expect(Element.prototype.scrollTo).not.toHaveBeenCalled();
  expect(Element.prototype.scrollIntoView).not.toHaveBeenCalled();
  expect(router.state.historyAction).toBe('REPLACE');
  await user.click(screen.getAllByRole('button', { name: 'Spela upp', exact: true })[0]);
  expect(screen.getByText('Det finns ingen avskrift för den här inspelningen.')).toBeVisible();
});

test('tidsstämpel startar rätt position och listknappen pausar utan att börja om', async () => {
  const { user } = await setup();
  act(() => screen.getByRole('button', { name: 'Spela från 00:10' }).focus());
  await user.keyboard('{Enter}');
  expect(playSpy).toHaveBeenLastCalledWith(expect.objectContaining({ audio: first, time: 10.5 }));
  const active = screen.getByRole('button', { name: 'Spela från 00:10' });
  expect(active).toHaveAttribute('aria-current', 'true');
  await user.click(screen.getByRole('button', { name: 'Pausa uppspelning' }));
  expect(pauseSpy).toHaveBeenCalledTimes(1);
  expect(playSpy).toHaveBeenCalledTimes(1);
  expect(active).not.toHaveAttribute('aria-current');
});

test('sökning markerar hela texten, frivilligt filter, navigation och kopiering oberoende av ljud', async () => {
  const { user } = await setup();
  await user.click(screen.getByRole('button', { name: 'Spela från 00:10' }));
  await user.type(screen.getByRole('searchbox'), 'skogen');
  expect(screen.getByText('Sedan kom regnet.')).toBeVisible();
  expect(document.querySelectorAll('mark')).toHaveLength(2);
  await user.click(screen.getByRole('button', { name: 'Nästa träff' }));
  expect(screen.getByRole('button', { name: 'Nästa träff' })).toHaveFocus();
  expect(screen.getByRole('button', { name: 'Spela från 00:10' })).toHaveAttribute('aria-current', 'true');
  expect(playSpy).toHaveBeenCalledTimes(1);
  await user.click(screen.getByRole('checkbox', { name: 'Visa endast träffar' }));
  expect(screen.queryByText('Sedan kom regnet.')).not.toBeInTheDocument();
  await user.click(screen.getByText('Kopiera och ladda ner'));
  await user.click(screen.getByRole('button', { name: 'Kopiera hela avskriften' }));
  expect(navigator.clipboard.writeText).toHaveBeenCalledWith(transcriptExport(normalizeTranscript(first), 'txt'));
});

test('följning rullar aktivt stycke först efter användarens val och behåller fokus', async () => {
  const { user } = await setup();
  await user.click(screen.getByRole('button', { name: 'Spela från 00:10' }));
  expect(Element.prototype.scrollIntoView).not.toHaveBeenCalled();
  await user.click(screen.getByRole('checkbox', { name: 'Följ uppspelningen' }));
  expect(Element.prototype.scrollIntoView).toHaveBeenCalledWith({ block: 'nearest' });
  expect(screen.getByRole('checkbox', { name: 'Följ uppspelningen' })).toHaveFocus();
});

test.each(['txt', 'vtt'])('export till %s omfattar hela texten trots träffilter', async (format) => {
  const { user } = await setup();
  URL.createObjectURL = jest.fn(() => 'blob:transcript');
  URL.revokeObjectURL = jest.fn();
  const click = jest.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
  await user.type(screen.getByRole('searchbox'), 'skogen');
  await user.click(screen.getByRole('checkbox', { name: 'Visa endast träffar' }));
  await user.click(screen.getByText('Kopiera och ladda ner'));
  await user.click(screen.getByRole('button', { name: `Ladda ner hela avskriften (.${format})` }));
  const blob = URL.createObjectURL.mock.calls[0][0];
  const contents = await new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.readAsText(blob);
  });
  expect(contents).toBe(transcriptExport(normalizeTranscript(first), format));
  expect(click).toHaveBeenCalledTimes(1);
  click.mockRestore();
});

test('lång avskrift visar en kort början och kan fällas ut och ihop med tangentbord utan ljudstart', async () => {
  const user = userEvent.setup();
  renderLongReader();
  const expand = screen.getByRole('button', { name: 'Visa hela avskriften' });
  expect(expand).toHaveAttribute('aria-expanded', 'false');
  expect(document.getElementById(expand.getAttribute('aria-controls'))).toBeVisible();
  expect(screen.getAllByRole('button', { name: /Spela från/ })).toHaveLength(4);
  expect(screen.getByText('Stycke 8.')).not.toBeVisible();
  expand.focus();
  await user.keyboard('{Enter}');
  expect(screen.getAllByRole('button', { name: /Spela från/ })).toHaveLength(8);
  expect(screen.getByText('Stycke 8.')).toBeVisible();
  expect(expand).toHaveFocus();
  expect(expand).toHaveAttribute('aria-expanded', 'true');
  const collapse = screen.getByRole('button', { name: 'Fäll ihop och gå till början' });
  collapse.focus();
  await user.keyboard(' ');
  expect(screen.getByRole('heading', { name: 'Avskrift: Första filen' })).toHaveFocus();
  expect(screen.getByText('Stycke 8.')).not.toBeVisible();
  expect(screen.queryByRole('button', { name: 'Fäll ihop och gå till början' })).not.toBeInTheDocument();
  expect(playSpy).not.toHaveBeenCalled();
});

test('sökning hittar text utanför förhandsvisningen och träffnavigering visar den utan ljud eller fokusbyte', async () => {
  const user = userEvent.setup();
  renderLongReader();
  await user.type(screen.getByRole('searchbox'), '8.');
  expect(screen.getByText('0 av 1 träffar i hela avskriften')).toBeVisible();
  expect(screen.getByText('8.', { selector: 'mark' })).not.toBeVisible();
  await user.click(screen.getByRole('button', { name: 'Nästa träff' }));
  await waitFor(() => expect(Element.prototype.scrollIntoView).toHaveBeenCalledWith({ block: 'center' }));
  expect(screen.getByText('8.', { selector: 'mark' })).toBeVisible();
  expect(screen.getByRole('button', { name: 'Nästa träff' })).toHaveFocus();
  expect(screen.getByRole('button', { name: 'Visa kort förhandsvisning' })).toHaveAttribute('aria-expanded', 'true');
  expect(playSpy).not.toHaveBeenCalled();
});

test('följning visar aktuella stycken i den mindre vyn och behåller fokus utan att öppna hela texten', async () => {
  const user = userEvent.setup();
  const context = {
    playing: true, currentAudio: { record, audio: longAudio }, currentTime: 70000,
  };
  const { rerender } = renderLongReader(context);
  expect(screen.getByText('Stycke 8.')).not.toBeVisible();
  const follow = screen.getByRole('checkbox', { name: 'Följ uppspelningen' });
  await user.click(follow);
  expect(screen.getByText('Stycke 8.')).toBeVisible();
  expect(screen.getByText('Stycke 1.')).not.toBeVisible();
  expect(screen.getAllByRole('button', { name: /Spela från/ })).toHaveLength(4);
  expect(screen.getByRole('button', { name: 'Visa hela avskriften' })).toHaveAttribute('aria-expanded', 'false');
  expect(screen.getByText(/Visar stycke 5–8 av 8/)).toBeVisible();
  expect(screen.getByRole('button', { name: 'Spela från 01:10' })).toHaveAttribute('aria-current', 'true');
  expect(follow).toHaveFocus();
  expect(Element.prototype.scrollIntoView).toHaveBeenCalledWith({ block: 'nearest' });

  rerender(longReader({ ...context, currentTime: 10000 }));
  expect(screen.getByText('Stycke 2.')).toBeVisible();
  expect(screen.getByText('Stycke 8.')).not.toBeVisible();
  expect(screen.getByRole('button', { name: 'Spela från 00:10' })).toHaveAttribute('aria-current', 'true');
  expect(follow).toHaveFocus();
  expect(screen.getAllByRole('button', { name: /Spela från/ })).toHaveLength(4);

  rerender(longReader({ ...context, currentTime: 10000, playing: false }));
  expect(screen.getByText('Stycke 2.')).toBeVisible();
  expect(screen.getByRole('button', { name: 'Spela från 00:10' })).not.toHaveAttribute('aria-current');
  expect(follow).toBeChecked();
  expect(playSpy).not.toHaveBeenCalled();
});

test('följning kan slås på före uppspelning och fortsätter efter hopfällning utan att ändra ljudet', async () => {
  const user = userEvent.setup();
  const { rerender } = renderLongReader();
  const follow = screen.getByRole('checkbox', { name: 'Följ uppspelningen' });
  await user.click(follow);
  expect(screen.getByRole('button', { name: 'Visa hela avskriften' })).toHaveAttribute('aria-expanded', 'false');
  expect(screen.getAllByRole('button', { name: /Spela från/ })).toHaveLength(4);
  const context = {
    playing: true, currentAudio: { record, audio: longAudio }, currentTime: 70000,
  };
  rerender(longReader(context));
  expect(screen.getByText('Stycke 8.')).toBeVisible();
  expect(follow).toHaveFocus();
  await user.click(screen.getByRole('button', { name: 'Visa hela avskriften' }));
  expect(screen.getAllByRole('button', { name: /Spela från/ })).toHaveLength(8);
  await user.click(screen.getByRole('button', { name: 'Visa kort förhandsvisning' }));
  expect(follow).toBeChecked();
  expect(screen.getByText('Stycke 8.')).toBeVisible();
  expect(screen.getAllByRole('button', { name: /Spela från/ })).toHaveLength(4);
  expect(screen.getByRole('heading', { name: 'Avskrift: Första filen' })).toHaveFocus();

  await user.click(follow);
  Element.prototype.scrollIntoView.mockClear();
  rerender(longReader({ ...context, currentTime: 10000 }));
  expect(screen.getByText('Stycke 8.')).toBeVisible();
  expect(screen.getByText('Stycke 2.')).not.toBeVisible();
  expect(Element.prototype.scrollIntoView).not.toHaveBeenCalled();
  expect(playSpy).not.toHaveBeenCalled();
  expect(pauseSpy).not.toHaveBeenCalled();
});

test('kopiering omfattar även den dolda texten i förhandsvisningen', async () => {
  const user = userEvent.setup();
  jest.spyOn(navigator.clipboard, 'writeText');
  renderLongReader();
  await user.click(screen.getByText('Kopiera och ladda ner'));
  await user.click(screen.getByRole('button', { name: 'Kopiera hela avskriften' }));
  expect(navigator.clipboard.writeText).toHaveBeenCalledWith(transcriptExport(normalizeTranscript(longAudio), 'txt'));
  expect(screen.getByText('Stycke 8.')).not.toBeVisible();
  expect(screen.getByText('Hela avskriften har kopierats.')).toBeVisible();
});

test('följning döljer inte tidsstämpeln med tangentbordsfokus när den mindre vyn byter stycken', async () => {
  const user = userEvent.setup();
  const context = { playing: true, currentAudio: { record, audio: longAudio }, currentTime: 0 };
  const { rerender } = renderLongReader(context);
  await user.click(screen.getByRole('checkbox', { name: 'Följ uppspelningen' }));
  const timestamp = screen.getByRole('button', { name: 'Spela från 00:00' });
  await user.click(timestamp);
  rerender(longReader({ ...context, currentTime: 70000 }));
  expect(timestamp).toHaveFocus();
  expect(timestamp).toBeVisible();
  expect(screen.getByText('Stycke 8.')).toBeVisible();
  expect(screen.getByRole('button', { name: 'Visa hela avskriften' })).toHaveAttribute('aria-expanded', 'false');
  await user.tab();
  expect(screen.getByRole('button', { name: 'Spela från 00:40' })).toHaveFocus();
  expect(timestamp).not.toBeVisible();
  expect(screen.getAllByRole('button', { name: /Spela från/ })).toHaveLength(4);
});

test('val av en annan lång avskrift återställer förhandsvisningen utan ljudstart', async () => {
  const user = userEvent.setup();
  const audioItems = [longAudio, {
    ...longAudio, id: 3, source: second.source, title: second.title,
  }];
  const router = createMemoryRouter([{
    path: '/records/:recordId',
    element: (
      <AudioContext.Provider value={{ playing: false, playAudio: playSpy }}>
        <AudioTranscript record={{ ...record, media: audioItems }} audioItems={audioItems} />
      </AudioContext.Provider>
    ),
  }], { initialEntries: ['/records/record-a?k=start'] });
  render(<RouterProvider router={router} />);
  await user.click(screen.getByRole('button', { name: 'Visa hela avskriften' }));
  expect(screen.getByText('Stycke 8.')).toBeVisible();
  await act(async () => router.navigate('?k=start#avskrift-3'));
  expect(screen.getByRole('heading', { name: 'Avskrift: Andra filen' })).toBeVisible();
  expect(screen.getByText('Stycke 8.')).not.toBeVisible();
  expect(screen.getByRole('button', { name: 'Visa hela avskriften' })).toHaveAttribute('aria-expanded', 'false');
  expect(playSpy).not.toHaveBeenCalled();
});

test.each([
  '/records/record-a?k=start#avskrift-999',
  '/records/record-a/audio/999/transcribe?k=start',
])('ogiltig filreferens %s ger meddelande och behåller ljudlistan', async (path) => {
  const router = createMemoryRouter(transcriptRoutes(), { initialEntries: [path] });
  render(<RouterProvider router={router} />);
  expect(await screen.findByText(/Inspelningen i länken finns inte/)).toBeVisible();
  expect(screen.getByLabelText('URL')).toHaveTextContent('/records/record-a?k=start#avskrift-999');
  expect(screen.getAllByRole('button', { name: 'Spela upp', exact: true })).toHaveLength(3);
  expect(playSpy).not.toHaveBeenCalled();
});

test('direktlänk till en fil som ljudlistan deduplicerat är fortfarande giltig', async () => {
  const duplicate = { ...first, id: 4, type: 'audio' };
  const router = createMemoryRouter([{
    path: '/records/:recordId',
    element: (
      <AudioContext.Provider value={{ playing: false }}>
        <AudioTranscript
          record={{ ...record, media: [...record.media, duplicate] }}
          audioItems={[first, second]}
        />
      </AudioContext.Provider>
    ),
  }], { initialEntries: ['/records/record-a#avskrift-4'] });
  render(<RouterProvider router={router} />);
  expect(screen.getByRole('heading', { name: 'Avskrift: Första filen' })).toHaveAttribute('id', 'avskrift-4');
});

test('omdirigering kodar accessionen och bevarar hela sökkontexten även för okänd fil', () => {
  const response = audioTranscriptLoader({
    params: { recordId: 'bd:105', audioId: '999' },
    request: { url: 'http://localhost/records/bd:105/audio/999/transcribe?k=start&category=contentG5' },
  });
  expect(response.headers.get('Location')).toBe('/records/bd%3A105?k=start&category=contentG5#avskrift-999');
});

test('normalisering bevarar ordning/text och ger stabila unika ID:n och korrekta VTT-tider', () => {
  const audio = {
    id: 4,
    utterances: {
      utterances: [
        {
          id: 'a', start: '01:02:03.125', end: 3724.5, text: 'Text A',
        },
        {
          id: 'a', start: 'fel', end: null, text: 'Text B',
        },
      ],
    },
  };
  const segments = normalizeTranscript(audio);
  expect(segments.map((segment) => segment.text)).toEqual(['Text A', 'Text B']);
  expect(segments[0].id).not.toBe(segments[1].id);
  expect(normalizeTranscript(audio)).toEqual(segments);
  expect(transcriptExport(segments, 'vtt')).toContain('01:02:03.125 --> 01:02:04.500');
});

test('befintlig kursivering i den manuella avskriften behålls utan att tolka annan HTML', () => {
  render(
    <AudioContext.Provider value={{ playing: false }}>
      <TranscriptReader
        record={{ ...record, id: 'bd10106_253556' }}
        audio={{ ...first, utterances: [{ start: 0, end: 10, text: 'En <i>kursiv</i> term. <b>Text</b>' }] }}
        title="Manuell avskrift"
        headingRef={{ current: null }}
      />
    </AudioContext.Provider>,
  );
  expect(screen.getByText('kursiv').tagName).toBe('EM');
  expect(screen.getByText(/En/).textContent).toBe('En kursiv term. <b>Text</b>');
  expect(screen.queryByText(/automatiskt genererad/)).not.toBeInTheDocument();
});

test('gammal länk ersätts i historiken och bakåt återgår till föregående avskrift utan ljudstart', async () => {
  const { router, user } = await setup();
  await user.click(screen.getByRole('link', { name: 'Läs Andra filen' }));
  await act(async () => router.navigate('/records/record-a/audio/2/transcribe?k=start&category=contentG5'));
  expect(screen.getByRole('heading', { name: 'Avskrift: Första filen' })).toBeVisible();
  expect(screen.getByLabelText('URL')).toHaveTextContent('/records/record-a?k=start&category=contentG5#avskrift-2');
  expect(router.state.historyAction).toBe('REPLACE');
  await act(async () => router.navigate(-1));
  expect(screen.getByRole('heading', { name: 'Avskrift: Första filen' })).toBeVisible();
  expect(screen.getByLabelText('URL')).toHaveTextContent('/records/record-a?k=start');
  await act(async () => router.navigate(1));
  expect(screen.getByLabelText('URL')).toHaveTextContent('/records/record-a?k=start&category=contentG5#avskrift-2');
  expect(playSpy).not.toHaveBeenCalled();
  expect(pauseSpy).not.toHaveBeenCalled();
});
