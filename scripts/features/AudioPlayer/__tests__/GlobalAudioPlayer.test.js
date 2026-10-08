/* global beforeEach, expect, jest, test */
import { render, screen } from '@testing-library/react';
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
});
