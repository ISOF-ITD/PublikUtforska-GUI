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
    currentTime: 0,
    setCurrentTime: jest.fn(),
    durationTime: 60000,
    setVisible: jest.fn(),
    setCurrentAudio: jest.fn(),
    currentAudio: null,
    activeSegmentId: null,
    playerLabelText: 'Inspelning',
  };
}

function player(value) {
  return <AudioContext.Provider value={value}><GlobalAudioPlayer /></AudioContext.Provider>;
}

beforeEach(() => {
  window.eventBus = { dispatch: jest.fn() };
  window.innerWidth = 1024;
});

test('dold spelare är inaktiv och dess kontroller exponeras inte för skärmläsare', () => {
  const context = playerContext(false);
  const { container, rerender } = render(player(context));
  expect(container.firstChild).toHaveAttribute('inert');
  expect(screen.queryByRole('button')).not.toBeInTheDocument();
  expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
  expect(screen.queryByRole('slider')).not.toBeInTheDocument();

  rerender(player({ ...context, visible: true }));
  expect(container.firstChild).not.toHaveAttribute('inert');
  expect(screen.getByRole('button', { name: 'Spela' })).toBeInTheDocument();
  expect(screen.getByRole('combobox', { name: 'Uppspelningshastighet' })).toBeInTheDocument();
  expect(screen.getByRole('slider', { name: 'Välj starttid' })).toBeInTheDocument();

  rerender(player(context));
  expect(container.firstChild).toHaveAttribute('inert');
  expect(screen.queryByRole('button')).not.toBeInTheDocument();
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
  expect(context.audioRef.current.pause).toHaveBeenCalledTimes(1);
  expect(context.setVisible).toHaveBeenCalledWith(false);
  expect(context.setPlaying).toHaveBeenCalledWith(false);
  expect(context.setCurrentTime).toHaveBeenCalledWith(0);
  expect(context.setCurrentAudio).toHaveBeenCalledWith(null);
  expect(window.eventBus.dispatch).toHaveBeenCalledWith('audio.playerhidden');
});

test('spela och pausa behåller namn och tillstånd efter omrendering', async () => {
  const user = userEvent.setup();
  const context = playerContext(true);
  const { rerender } = render(player(context));
  const play = screen.getByRole('button', { name: 'Spela' });
  expect(play).toHaveAttribute('aria-pressed', 'false');
  await user.click(play);
  expect(context.togglePlay).toHaveBeenCalledTimes(1);

  rerender(player({ ...context, playing: true }));
  const pause = screen.getByRole('button', { name: 'Pausa' });
  expect(pause).toHaveAttribute('aria-pressed', 'true');
  await user.click(pause);
  expect(context.togglePlay).toHaveBeenCalledTimes(2);
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
  render(player(context));
  const selector = screen.getByRole('combobox', { name: 'Uppspelningshastighet' });
  expect(screen.getAllByRole('option')).toHaveLength(8);
  await user.selectOptions(selector, '1.4');
  expect(context.audioRef.current.playbackRate).toBe(1.4);
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

test('segmentknappar går att aktivera med Enter och mellanslag och döljs med spelaren', async () => {
  const user = userEvent.setup();
  const context = {
    ...playerContext(true),
    currentAudio: { audio: { utterances: [{ id: 'first', start: 15 }, { id: 'second', start: 30 }] } },
    activeSegmentId: 'second',
  };
  const { rerender } = render(player(context));
  await user.tab(); // Backward
  await user.tab(); // Play
  await user.tab(); // Forward
  await user.tab(); // Speed
  await user.tab(); // First segment
  const first = screen.getByRole('button', { name: 'Hoppa till 00:15' });
  expect(first.tagName).toBe('BUTTON');
  expect(first).toHaveFocus();
  await user.keyboard('{Enter}');
  expect(context.setCurrentTime).toHaveBeenLastCalledWith(15000);
  expect(context.audioRef.current.currentTime).toBe(15);

  await user.tab();
  expect(screen.getByRole('button', { name: 'Hoppa till 00:30' })).toHaveFocus();
  expect(screen.getByRole('button', { name: 'Hoppa till 00:30' })).toHaveAttribute('aria-current', 'true');
  await user.keyboard(' ');
  expect(context.setCurrentTime).toHaveBeenLastCalledWith(30000);
  expect(context.audioRef.current.currentTime).toBe(30);
  expect(context.setCurrentTime).toHaveBeenCalledTimes(2);

  rerender(player({ ...context, visible: false }));
  expect(screen.queryByRole('button', { name: /Hoppa till/ })).not.toBeInTheDocument();
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
  expect(pause).toHaveAttribute('aria-pressed', 'true');
  await user.keyboard(' ');
  expect(context.togglePlay).toHaveBeenCalledTimes(1);
  rerender(player({ ...context, playing: false }));
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
  render(player(context));
  await user.selectOptions(screen.getByRole('combobox'), '1.4');
  await user.click(screen.getByRole('button', { name: 'Minimera ljudspelaren' }));
  window.innerWidth = 1280;
  fireEvent(window, new Event('resize'));
  expect(screen.queryByRole('button', { name: /Visa hela ljudspelaren/ })).not.toBeInTheDocument();
  expect(screen.getByRole('combobox')).toHaveValue('1.4');
  expect(screen.getByRole('slider')).toBeInTheDocument();
  window.innerWidth = 320;
  fireEvent(window, new Event('resize'));
  const title = screen.getByRole('button', { name: /Visa hela ljudspelaren/ });
  await user.click(title);
  expect(screen.getByRole('combobox')).toHaveValue('1.4');
  expect(context.audioRef.current.playbackRate).toBe(1.4);

  await user.click(screen.getByRole('button', { name: 'Stäng' }));
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
