/* global beforeEach, expect, jest, test */
import {
  fireEvent, render, screen, within,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AudioContext } from '../../../contexts/AudioContext';
import GlobalAudioPlayer from '../GlobalAudioPlayer';

jest.mock('../hooks/useMarquee', () => () => [null, null]);

function playerContext(visible) {
  return {
    visible,
    playing: false,
    audioRef: { current: { pause: jest.fn(), currentTime: 0, duration: 60 } },
    setPlaying: jest.fn(),
    togglePlay: jest.fn(),
    closeAudio: jest.fn(),
    currentTime: 0,
    setCurrentTime: jest.fn(),
    durationTime: 60000,
    setVisible: jest.fn(),
    setCurrentAudio: jest.fn(),
    currentAudio: null,
    playerLabelText: 'Inspelning',
    playbackRate: 1,
    setPlaybackRate: jest.fn(),
  };
}

function player(value) {
  return <AudioContext.Provider value={value}><GlobalAudioPlayer /></AudioContext.Provider>;
}

beforeEach(() => {
  window.eventBus = { dispatch: jest.fn() };
  window.innerWidth = 1024;
  global.ResizeObserver = jest.fn(() => ({
    observe: jest.fn(), unobserve: jest.fn(), disconnect: jest.fn(),
  }));
  global.IntersectionObserver = jest.fn(() => ({
    observe: jest.fn(), unobserve: jest.fn(), disconnect: jest.fn(),
  }));
});

test('dold spelare är inaktiv och dess kontroller exponeras inte för skärmläsare', () => {
  const context = playerContext(false);
  const { container, rerender } = render(player(context));
  expect(container.firstChild).toHaveAttribute('inert');
  expect(screen.queryByRole('button')).not.toBeInTheDocument();
  expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
  expect(screen.queryByRole('slider')).not.toBeInTheDocument();
  expect(screen.queryByRole('region', { name: 'Ljudspelare' })).not.toBeInTheDocument();
  expect(screen.queryByRole('heading', { name: 'Ljudspelare' })).not.toBeInTheDocument();

  rerender(player({ ...context, visible: true }));
  const region = screen.getByRole('region', { name: 'Ljudspelare' });
  const heading = within(region).getByRole('heading', { level: 2, name: 'Ljudspelare' });
  expect(region.tagName).toBe('SECTION');
  expect(region).toHaveAttribute('aria-labelledby', heading.id);
  expect(heading).toHaveClass('sr-only');
  expect(container.firstChild).not.toHaveAttribute('inert');
  expect(screen.getByRole('button', { name: 'Spela' })).toBeInTheDocument();
  expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Inställningar för ljudspelaren' })).toBeVisible();
  expect(screen.getByRole('slider', { name: 'Välj starttid' })).toBeInTheDocument();

  rerender(player(context));
  expect(container.firstChild).toHaveAttribute('inert');
  expect(screen.queryByRole('button')).not.toBeInTheDocument();
  expect(screen.queryByRole('region', { name: 'Ljudspelare' })).not.toBeInTheDocument();
  expect(screen.queryByRole('heading', { name: 'Ljudspelare' })).not.toBeInTheDocument();
});

test.each([320, 430, 768, 1280])('spelaren vid %i px visar tiden en gång under tidslinjen med giltig semantik', (width) => {
  window.innerWidth = width;
  const context = { ...playerContext(true), currentTime: 15999, durationTime: 261999 };
  const { container, rerender } = render(player(context));
  const [elapsed, total] = container.querySelectorAll('time');
  expect(container.querySelectorAll('time')).toHaveLength(2);
  expect(screen.getAllByText('Uppspelad tid:')).toHaveLength(1);
  expect(screen.getAllByText('Total tid:')).toHaveLength(1);
  const timeline = screen.getByRole('slider').parentElement.parentElement;
  expect(timeline).toContainElement(elapsed);
  expect(timeline).toContainElement(total);
  expect(screen.getAllByText('00:15')).toHaveLength(1);
  expect(screen.getAllByText('04:21')).toHaveLength(1);
  expect(elapsed).toHaveAttribute('datetime', 'PT15S');
  expect(elapsed).toHaveTextContent('00:15');
  expect(total).toHaveAttribute('datetime', 'PT261S');
  expect(total).toHaveTextContent('04:21');
  expect(elapsed).not.toHaveAttribute('aria-label');
  expect(total).not.toHaveAttribute('aria-label');
  expect(elapsed).not.toHaveAttribute('tabindex');
  expect(total).not.toHaveAttribute('tabindex');
  expect(elapsed.closest('[aria-live]')).toBeNull();
  expect(elapsed.previousElementSibling).toHaveTextContent('Uppspelad tid:');
  expect(total.previousElementSibling).toHaveTextContent('Total tid:');

  rerender(player({ ...context, currentTime: 0, durationTime: 0 }));
  expect(container.querySelectorAll('time')).toHaveLength(1);
  expect(container.querySelector('time')).toHaveAttribute('datetime', 'PT0S');
  expect(screen.getByText('Okänd längd')).toBeInTheDocument();
  expect(screen.getByRole('slider')).toHaveAttribute('aria-valuetext', '0 sekunder av okänd längd');
});

test('synlig spelare går att använda med tangentbord', async () => {
  const user = userEvent.setup();
  const context = playerContext(true);
  render(player(context));
  await user.tab();
  expect(screen.getByRole('button', { name: 'Spola −15 sek' })).toHaveFocus();
  await user.tab();
  expect(screen.getByRole('button', { name: 'Spela' })).toHaveFocus();
  await user.keyboard('{Enter}');
  expect(context.togglePlay).toHaveBeenCalledTimes(1);
  await user.click(screen.getByRole('button', { name: 'Stäng' }));
  expect(context.closeAudio).toHaveBeenCalledTimes(1);
});

test('spela och pausa använder handlingsnamn utan toggle-semantik efter omrendering', async () => {
  const user = userEvent.setup();
  const context = playerContext(true);
  const { rerender } = render(player(context));
  const play = screen.getByRole('button', { name: 'Spela' });
  expect(play).not.toHaveAttribute('aria-pressed');
  await user.click(play);
  expect(context.togglePlay).toHaveBeenCalledTimes(1);

  rerender(player({ ...context, playing: true }));
  const pause = screen.getByRole('button', { name: 'Pausa' });
  expect(pause).not.toHaveAttribute('aria-pressed');
  await user.click(pause);
  expect(context.togglePlay).toHaveBeenCalledTimes(2);
});

const queueItems = [
  { audio: { source: 'a.mp3' }, title: 'Första filen' },
  { audio: { source: 'b.mp3' }, title: 'Andra filen' },
];

function seriesContext(currentIndex = 0) {
  return {
    ...playerContext(true),
    queue: queueItems,
    currentIndex,
    playPrevious: jest.fn(),
    playNext: jest.fn(),
    setAutoAdvance: jest.fn(),
  };
}

test('filknappar har målfilens titel och behåller fokus när sista filen väljs', async () => {
  const user = userEvent.setup();
  const context = seriesContext();
  const { rerender } = render(player(context));
  const previous = screen.getByRole('button', { name: 'Föregående inspelning' });
  expect(previous).toHaveAttribute('aria-disabled', 'true');
  await user.click(previous);
  expect(context.playPrevious).not.toHaveBeenCalled();
  const next = screen.getByRole('button', { name: 'Nästa inspelning: Andra filen' });
  expect(next).toHaveAttribute('title', 'Nästa inspelning: Andra filen');
  await user.click(next);
  expect(context.playNext).toHaveBeenCalledTimes(1);
  rerender(player({ ...context, currentIndex: 1 }));
  expect(next).toHaveFocus();
  expect(next).toHaveAttribute('aria-disabled', 'true');
  await user.keyboard('{Enter}');
  expect(context.playNext).toHaveBeenCalledTimes(1);
  await user.click(screen.getByRole('button', { name: 'Föregående inspelning: Första filen' }));
  expect(context.playPrevious).toHaveBeenCalledTimes(1);
  expect(screen.getByText('2/2')).toBeVisible();
  expect(screen.getByText('Inspelning 2 av 2')).toBeInTheDocument();
});

test('automatik är en inbyggd tangentbordsåtkomlig kryssruta och status annonserar inte tiden', async () => {
  const user = userEvent.setup();
  const context = { ...seriesContext(), playbackStatus: 'Inspelning 1 av 2: Första filen' };
  const { rerender } = render(player(context));
  await user.click(screen.getByRole('button', { name: 'Inställningar för ljudspelaren' }));
  const auto = screen.getByRole('checkbox', { name: 'Spela nästa automatiskt' });
  expect(auto).not.toBeChecked();
  await user.click(auto);
  expect(context.setAutoAdvance).toHaveBeenCalledWith(true);
  rerender(player({ ...context, autoAdvance: true, currentTime: 5000 }));
  expect(auto).toBeChecked();
  expect(screen.getByRole('status')).toHaveTextContent(context.playbackStatus);
  await user.keyboard(' ');
  expect(context.setAutoAdvance).toHaveBeenLastCalledWith(false);
});

test('serieinställningar är dolda i minimerat läge medan felmeddelanden är läsbara', async () => {
  window.innerWidth = 430;
  const user = userEvent.setup();
  const context = seriesContext();
  const { rerender } = render(player(context));
  await user.click(screen.getByRole('button', { name: 'Inställningar för ljudspelaren' }));
  expect(screen.getByRole('dialog')).toBeVisible();
  await user.click(screen.getByRole('button', { name: 'Minimera ljudspelaren' }));
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Inställningar för ljudspelaren' })).not.toBeInTheDocument();
  expect(screen.getAllByText('1/2').filter((element) => !element.closest('[hidden]'))).toHaveLength(1);
  expect(screen.getByRole('button', { name: /Visa hela ljudspelaren/ })).toHaveAccessibleName('Visa hela ljudspelaren: Inspelning 1 av 2: Inspelning');
  expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
  expect(screen.queryByRole('button', { name: /Nästa inspelning/ })).not.toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Spela' })).toBeVisible();
  rerender(player({ ...context, playbackError: 'Inspelningen kunde inte spelas upp.' }));
  expect(screen.getByRole('status')).toHaveTextContent('Inspelningen kunde inte spelas upp.');
  await user.click(screen.getByRole('button', { name: /Visa hela ljudspelaren:/ }));
  expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Inställningar för ljudspelaren' })).toBeVisible();
  expect(screen.getByRole('button', { name: /Nästa inspelning:/ })).toBeVisible();
});

test('en ensam fil saknar seriekontroller och dolda seriekontroller saknas i tillgänglighetsträdet', async () => {
  const user = userEvent.setup();
  const context = { ...seriesContext(), queue: [queueItems[0]] };
  const { rerender } = render(player(context));
  expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
  expect(screen.queryByRole('button', { name: /Nästa inspelning/ })).not.toBeInTheDocument();
  expect(screen.queryByText('1/1')).not.toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'Inställningar för ljudspelaren' }));
  expect(screen.getByRole('combobox')).toBeVisible();
  expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
  rerender(player({ ...seriesContext(), visible: false }));
  expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
  expect(screen.queryByRole('button')).not.toBeInTheDocument();
});

test('spolknapparna flyttar tiden 15 sekunder och stannar vid inspelningens gränser', async () => {
  const user = userEvent.setup();
  const context = playerContext(true);
  context.audioRef.current.currentTime = 30;
  render(player(context));
  const backward = screen.getByRole('button', { name: 'Spola −15 sek' });
  const forward = screen.getByRole('button', { name: 'Spola +15 sek' });
  await user.click(backward);
  expect(context.audioRef.current.currentTime).toBe(15);
  await user.click(forward);
  expect(context.audioRef.current.currentTime).toBe(30);

  context.audioRef.current.currentTime = 5;
  await user.click(backward);
  expect(context.audioRef.current.currentTime).toBe(0);
  context.audioRef.current.currentTime = 55;
  await user.click(forward);
  expect(context.audioRef.current.currentTime).toBe(60);
});

test('hastighetsväljaren ändrar uppspelning och visar valt alternativ', async () => {
  const user = userEvent.setup();
  const context = playerContext(true);
  const { rerender } = render(player(context));
  await user.click(screen.getByRole('button', { name: 'Inställningar för ljudspelaren' }));
  const selector = screen.getByRole('combobox', { name: 'Uppspelningshastighet' });
  expect(screen.getAllByRole('option')).toHaveLength(8);
  await user.selectOptions(selector, '1.4');
  expect(context.setPlaybackRate).toHaveBeenCalledWith(1.4);
  rerender(player({ ...context, playbackRate: 1.4 }));
  expect(selector).toHaveValue('1.4');
});

test('spolknapparnas synliga 15 behåller tydliga namn och fungerar med tangentbord', async () => {
  const user = userEvent.setup();
  const context = playerContext(true);
  context.audioRef.current.currentTime = 30;
  render(player(context));
  const backward = screen.getByRole('button', { name: 'Spola −15 sek' });
  const forward = screen.getByRole('button', { name: 'Spola +15 sek' });
  expect(within(backward).getByText('15')).toHaveAttribute('aria-hidden', 'true');
  expect(within(forward).getByText('15')).toHaveAttribute('aria-hidden', 'true');

  await user.tab();
  expect(backward).toHaveFocus();
  await user.keyboard('{Enter}');
  expect(context.audioRef.current.currentTime).toBe(15);
  await user.tab();
  await user.tab();
  expect(forward).toHaveFocus();
  await user.keyboard(' ');
  expect(context.audioRef.current.currentTime).toBe(30);
});

test('inspelningar med transkriptionssegment har en ren tidslinje med tangentbordsåtkomst', async () => {
  const user = userEvent.setup();
  const context = {
    ...playerContext(true),
    currentAudio: { audio: { utterances: [{ id: 'first', start: 15 }, { id: 'second', start: 30 }] } },
  };
  const { rerender } = render(player(context));
  await user.tab(); // Backward
  await user.tab(); // Play
  await user.tab(); // Forward
  await user.tab(); // Timeline
  const slider = screen.getByRole('slider', { name: 'Välj starttid' });
  expect(slider).toHaveFocus();
  expect(within(slider.parentElement).queryByRole('button')).not.toBeInTheDocument();
  expect(screen.queryByRole('button', { name: /Hoppa till/ })).not.toBeInTheDocument();
  fireEvent.change(slider, { target: { value: '30000' } });
  expect(context.setCurrentTime).toHaveBeenLastCalledWith(30000);
  expect(context.audioRef.current.currentTime).toBe(30);
  expect(context.setCurrentTime).toHaveBeenCalledTimes(1);

  await user.tab();
  expect(screen.getByRole('button', { name: 'Inställningar för ljudspelaren' })).toHaveFocus();
  await user.tab();
  expect(screen.getByRole('button', { name: 'Stäng' })).toHaveFocus();

  rerender(player({ ...context, visible: false }));
  expect(screen.queryByRole('slider')).not.toBeInTheDocument();
});

test('mobilspelaren kan fällas ihop och öppnas med tangentbord utan att avbryta ljudet', async () => {
  window.innerWidth = 430;
  const user = userEvent.setup();
  const context = { ...playerContext(true), playing: true };
  context.audioRef.current.currentTime = 30;
  const { container, rerender } = render(player(context));
  const disclosure = screen.getByRole('button', { name: 'Minimera ljudspelaren' });
  const controls = document.getElementById(disclosure.getAttribute('aria-controls'));
  await user.tab();
  expect(disclosure).toHaveFocus();
  await user.keyboard('{Enter}');
  expect(disclosure).toHaveAttribute('aria-expanded', 'false');
  expect(disclosure).toHaveAccessibleName('Visa hela ljudspelaren: Inspelning');
  expect(disclosure).toHaveFocus();
  expect(controls).toHaveAttribute('inert');
  expect(controls).not.toBeVisible();
  expect(screen.getAllByRole('button')).toHaveLength(2);
  expect(screen.getByRole('region', { name: 'Ljudspelare' })).toBeInTheDocument();
  expect(screen.getByRole('heading', { level: 2, name: 'Ljudspelare' })).toBeInTheDocument();
  container.querySelectorAll('time').forEach((time) => expect(time).not.toBeVisible());
  expect(screen.queryByRole('slider')).not.toBeInTheDocument();
  expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
  expect(context.audioRef.current.pause).not.toHaveBeenCalled();
  expect(context.audioRef.current.currentTime).toBe(30);
  expect(context.setPlaying).not.toHaveBeenCalled();
  expect(context.setVisible).not.toHaveBeenCalled();
  expect(window.eventBus.dispatch).not.toHaveBeenCalled();

  await user.tab();
  const pause = screen.getByRole('button', { name: 'Pausa' });
  expect(pause).toHaveFocus();
  expect(pause).not.toHaveAttribute('aria-pressed');
  await user.keyboard(' ');
  expect(context.togglePlay).toHaveBeenCalledTimes(1);
  rerender(player({ ...context, playing: false }));
  expect(screen.getByRole('button', { name: 'Spela' })).not.toHaveAttribute('aria-pressed');
  await user.click(screen.getByRole('button', { name: 'Spela' }));
  expect(context.togglePlay).toHaveBeenCalledTimes(2);
  await user.tab({ shift: true });
  expect(disclosure).toHaveFocus();
  await user.keyboard(' ');
  expect(disclosure).toHaveAttribute('aria-expanded', 'true');
  expect(disclosure).toHaveFocus();
  expect(controls).not.toHaveAttribute('inert');
  expect(screen.getByRole('slider')).toBeInTheDocument();

  await user.click(disclosure);
  rerender(player({ ...context, visible: false }));
  expect(container.firstChild).toHaveAttribute('inert');
  expect(screen.queryByRole('button')).not.toBeInTheDocument();
});

test('hastighet och fullständiga kontroller bevaras vid minimering och byte av skärmbredd', async () => {
  window.innerWidth = 430;
  const user = userEvent.setup();
  const context = playerContext(true);
  const { rerender } = render(player(context));
  await user.click(screen.getByRole('button', { name: 'Inställningar för ljudspelaren' }));
  await user.selectOptions(screen.getByRole('combobox'), '1.4');
  rerender(player({ ...context, playbackRate: 1.4 }));
  await user.click(screen.getByRole('button', { name: 'Minimera ljudspelaren' }));
  window.innerWidth = 1280;
  fireEvent(window, new Event('resize'));
  expect(screen.queryByRole('button', { name: /Visa hela ljudspelaren/ })).not.toBeInTheDocument();
  expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
  expect(screen.getByRole('slider')).toBeInTheDocument();
  window.innerWidth = 320;
  fireEvent(window, new Event('resize'));
  const title = screen.getByRole('button', { name: /Visa hela ljudspelaren/ });
  await user.click(title);
  await user.click(screen.getByRole('button', { name: 'Inställningar för ljudspelaren' }));
  expect(screen.getByRole('combobox')).toHaveValue('1.4');
  expect(context.setPlaybackRate).toHaveBeenCalledWith(1.4);

  await user.click(screen.getByRole('button', { name: 'Minimera ljudspelaren' }));
  window.innerWidth = 1280;
  fireEvent(window, new Event('resize'));
  await user.click(screen.getByRole('button', { name: 'Stäng' }));
  window.innerWidth = 430;
  fireEvent(window, new Event('resize'));
  expect(screen.getByRole('button', { name: 'Minimera ljudspelaren' })).toHaveAttribute('aria-expanded', 'true');
});

function dragDisclosure(button, from, to) {
  fireEvent(button, new MouseEvent('pointerdown', {
    bubbles: true, clientX: from[0], clientY: from[1], button: 0,
  }));
  fireEvent(button, new MouseEvent('pointerup', {
    bubbles: true, clientX: to[0], clientY: to[1], button: 0,
  }));
  fireEvent.click(button, { detail: 1 });
}

test('svep nedåt minimerar och svep uppåt öppnar, utan att klick efter draget ändrar läget igen', () => {
  window.innerWidth = 430;
  const context = playerContext(true);
  render(player(context));
  const disclosure = screen.getByRole('button', { name: 'Minimera ljudspelaren' });
  dragDisclosure(disclosure, [100, 100], [105, 150]);
  expect(disclosure).toHaveAttribute('aria-expanded', 'false');
  dragDisclosure(disclosure, [100, 150], [105, 100]);
  expect(disclosure).toHaveAttribute('aria-expanded', 'true');
  expect(context.audioRef.current.pause).not.toHaveBeenCalled();
  expect(context.audioRef.current.currentTime).toBe(0);
});

test('sidledsdrag och avbrutna drag på handtaget ändrar inte läget eller uppspelningstiden', async () => {
  window.innerWidth = 430;
  const user = userEvent.setup();
  const context = playerContext(true);
  render(player(context));
  const disclosure = screen.getByRole('button', { name: 'Minimera ljudspelaren' });
  dragDisclosure(disclosure, [100, 100], [200, 105]);
  expect(disclosure).toHaveAttribute('aria-expanded', 'true');
  fireEvent(disclosure, new MouseEvent('pointerdown', { bubbles: true, clientX: 100, clientY: 100 }));
  fireEvent.pointerCancel(disclosure);
  fireEvent(disclosure, new MouseEvent('pointerup', { bubbles: true, clientX: 100, clientY: 150 }));
  fireEvent.click(disclosure, { detail: 1 });
  expect(disclosure).toHaveAttribute('aria-expanded', 'true');
  expect(context.audioRef.current.currentTime).toBe(0);
  await user.tab();
  await user.keyboard('{Enter}');
  expect(disclosure).toHaveAttribute('aria-expanded', 'false');
});

function swipe(target, from, to) {
  fireEvent.touchStart(target, { touches: [{ clientX: from[0], clientY: from[1] }] });
  fireEvent.touchEnd(target, { changedTouches: [{ clientX: to[0], clientY: to[1] }] });
}

test('svep över automatikens etikett spolar inte i ljudfilen', async () => {
  window.innerWidth = 430;
  const context = seriesContext();
  context.audioRef.current.currentTime = 30;
  render(player(context));
  await userEvent.setup().click(screen.getByRole('button', { name: 'Inställningar för ljudspelaren' }));
  swipe(screen.getByRole('checkbox').closest('label'), [100, 100], [200, 105]);
  expect(context.audioRef.current.currentTime).toBe(30);
});

test('inställningar öppnas med Enter och mellanslag, fokuserar hastighet och Escape återför fokus', async () => {
  const user = userEvent.setup();
  render(player(seriesContext()));
  const gear = screen.getByRole('button', { name: 'Inställningar för ljudspelaren' });
  expect(gear).toHaveAttribute('aria-expanded', 'false');
  expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
  gear.focus();
  await user.keyboard('{Enter}');
  expect(screen.getByRole('combobox', { name: 'Uppspelningshastighet' })).toHaveFocus();
  expect(screen.getByRole('dialog', { name: 'Ljudinställningar' })).toBeVisible();
  expect(gear).toHaveAttribute('aria-expanded', 'true');
  await user.keyboard('{Escape}');
  expect(gear).toHaveFocus();
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  await user.keyboard(' ');
  expect(screen.getByRole('combobox')).toHaveFocus();
});

test('Tab lämnar panelen och klick utanför stänger utan att låsa sidans navigation', async () => {
  const user = userEvent.setup();
  render(
    <>
      <button type="button">På sidan</button>
      {player(seriesContext())}
    </>,
  );
  const gear = screen.getByRole('button', { name: 'Inställningar för ljudspelaren' });
  await user.click(gear);
  await user.tab();
  expect(screen.getByRole('checkbox')).toHaveFocus();
  await user.tab();
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Stäng' })).toHaveFocus();
  await user.click(gear);
  await user.tab({ shift: true });
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  expect(gear).toHaveFocus();
  await user.click(gear);
  await user.click(screen.getByRole('button', { name: 'På sidan' }));
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'På sidan' })).toHaveFocus();
});

test('panel och fokus bevaras inom serien medan accessionbyte och stängning stänger panelen', async () => {
  const user = userEvent.setup();
  const context = {
    ...seriesContext(), currentAudio: { record: { id: 'first' }, audio: queueItems[0].audio },
  };
  const { rerender } = render(player(context));
  const gear = screen.getByRole('button', { name: 'Inställningar för ljudspelaren' });
  expect(gear).toHaveAccessibleDescription('Spela nästa automatiskt är av.');
  await user.click(gear);
  const auto = screen.getByRole('checkbox');
  await user.click(auto);
  rerender(player({
    ...context,
    autoAdvance: true,
    currentIndex: 1,
    currentAudio: { record: { id: 'first' }, audio: queueItems[1].audio },
  }));
  expect(auto).toHaveFocus();
  expect(auto).toBeChecked();
  expect(screen.getByRole('dialog')).toBeVisible();
  expect(gear).toHaveAccessibleDescription('Spela nästa automatiskt är på.');
  expect(gear.querySelector('.bg-player-accent')).toBeInTheDocument();
  rerender(player({ ...context, currentAudio: { record: { id: 'second' } } }));
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Inställningar för ljudspelaren' })).toHaveAccessibleDescription('Spela nästa automatiskt är av.');
  await user.click(screen.getByRole('button', { name: 'Inställningar för ljudspelaren' }));
  rerender(player({ ...context, visible: false }));
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
});

test('svepspolning fungerar på bakgrunden men ignorerar vertikala svep och interaktiva kontroller', () => {
  window.innerWidth = 430;
  const context = playerContext(true);
  context.audioRef.current.currentTime = 30;
  const { container } = render(player(context));
  swipe(container.firstChild, [100, 100], [200, 105]);
  expect(context.audioRef.current.currentTime).toBe(45);
  swipe(container.firstChild, [200, 100], [100, 105]);
  expect(context.audioRef.current.currentTime).toBe(30);
  swipe(container.firstChild, [100, 100], [170, 200]);
  expect(context.audioRef.current.currentTime).toBe(30);
  swipe(screen.getByRole('button', { name: 'Minimera ljudspelaren' }), [100, 100], [200, 105]);
  swipe(screen.getByRole('slider'), [100, 100], [200, 105]);
  expect(context.audioRef.current.currentTime).toBe(30);
  fireEvent.touchStart(container.firstChild, { touches: [{ clientX: 100, clientY: 100 }] });
  fireEvent.touchCancel(container.firstChild);
  fireEvent.touchEnd(container.firstChild, { changedTouches: [{ clientX: 200, clientY: 100 }] });
  expect(context.audioRef.current.currentTime).toBe(30);
});
