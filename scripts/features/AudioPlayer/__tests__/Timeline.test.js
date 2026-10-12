/* global expect, jest, test */
import { fireEvent, render, screen } from '@testing-library/react';
import Timeline from '../ui/Timeline';

test.each([
  [0, 261000, '0 sekunder av 4 minuter och 21 sekunder'],
  [15999, 261000, '15 sekunder av 4 minuter och 21 sekunder'],
  [1000, 60000, '1 sekund av 1 minut'],
  [61000, 120000, '1 minut och 1 sekund av 2 minuter'],
  [3600000, 7200000, '1 timme av 2 timmar'],
  [3661000, 7382000, '1 timme, 1 minut och 1 sekund av 2 timmar, 3 minuter och 2 sekunder'],
])('reglaget beskriver %i av %i millisekunder som begriplig tid', (current, duration, valueText) => {
  render(<Timeline current={current} duration={duration} onSeek={jest.fn()} />);
  const slider = screen.getByRole('slider', { name: 'Välj starttid' });
  expect(slider).toHaveAttribute('aria-valuetext', valueText);
  expect(slider).toHaveAttribute('type', 'range');
  expect(slider).not.toHaveAttribute('role');
  expect(slider).not.toHaveAttribute('aria-valuenow');
  expect(slider).not.toHaveAttribute('aria-valuemin');
  expect(slider).not.toHaveAttribute('aria-valuemax');
});

test('reglagets värdetext följer uppspelningen och anger okänd längd innan metadata finns', () => {
  const onSeek = jest.fn();
  const { rerender } = render(<Timeline current={0} duration={0} onSeek={onSeek} />);
  const slider = screen.getByRole('slider');
  expect(slider).toHaveAttribute('aria-valuetext', '0 sekunder av okänd längd');
  expect(screen.getByText('--:--')).toBeInTheDocument();
  expect(screen.getByText('Okänd längd')).toHaveClass('sr-only');

  rerender(<Timeline current={15000} duration={261000} onSeek={onSeek} />);
  expect(slider).toHaveAttribute('aria-valuetext', '15 sekunder av 4 minuter och 21 sekunder');
  expect(onSeek).not.toHaveBeenCalled();

  jest.spyOn(slider.parentElement, 'getBoundingClientRect').mockReturnValue({ left: 0, width: 200 });
  fireEvent(slider.parentElement, new MouseEvent('pointermove', { bubbles: true, clientX: 100 }));
  expect(slider.parentElement.querySelector('span[aria-hidden="true"]')).toHaveTextContent('02:10');
  rerender(<Timeline current={0} duration={0} onSeek={onSeek} />);
  expect(slider.parentElement.querySelector('span[aria-hidden="true"]')).toBeNull();
});

test('tidslinjen behåller en vit bana utan färgad fyllning under uppspelning', () => {
  const { rerender } = render(<Timeline current={0} duration={60000} onSeek={jest.fn()} />);
  const rail = screen.getByRole('slider', { name: 'Välj starttid' }).parentElement;
  expect(rail).toHaveClass('bg-player-text');
  expect(rail.querySelector('[style*="background-image"]')).toBeNull();

  rerender(<Timeline current={30000} duration={60000} onSeek={jest.fn()} />);
  expect(rail).toHaveClass('bg-player-text');
  expect(rail.querySelector('[style*="background-image"]')).toBeNull();
});

test('reglaget verkställer tangentbordsändringar utan pointerup', () => {
  const onSeek = jest.fn();
  render(<Timeline current={0} duration={60000} onSeek={onSeek} />);
  fireEvent.change(screen.getByRole('slider', { name: 'Välj starttid' }), { target: { value: '1000' } });
  expect(onSeek).toHaveBeenCalledWith(1000);
});

test('dragning visar preliminär tid och verkställs när reglaget släpps', () => {
  const onSeek = jest.fn();
  const { rerender } = render(<Timeline current={0} duration={60000} onSeek={onSeek} />);
  const slider = screen.getByRole('slider', { name: 'Välj starttid' });
  fireEvent.pointerDown(slider);
  fireEvent.change(slider, { target: { value: '15000' } });
  expect(onSeek).not.toHaveBeenCalled();
  expect(screen.getByText('00:15')).toBeInTheDocument();
  expect(screen.getByText('00:15')).toHaveAttribute('datetime', 'PT15S');
  expect(slider).toHaveAttribute('aria-valuetext', '15 sekunder av 1 minut');
  fireEvent.pointerUp(slider);
  expect(onSeek).toHaveBeenCalledTimes(1);
  expect(onSeek).toHaveBeenCalledWith(15000);

  rerender(<Timeline current={15000} duration={60000} onSeek={onSeek} />);
  expect(slider).toHaveValue('15000');
});

test('avbruten dragning återställer reglaget utan att spola', () => {
  const onSeek = jest.fn();
  render(<Timeline current={0} duration={60000} onSeek={onSeek} />);
  const slider = screen.getByRole('slider', { name: 'Välj starttid' });
  fireEvent.pointerDown(slider);
  fireEvent.change(slider, { target: { value: '15000' } });
  expect(slider).toHaveAttribute('aria-valuetext', '15 sekunder av 1 minut');
  fireEvent.pointerCancel(slider);
  expect(slider).toHaveValue('0');
  expect(screen.getByText('00:00')).toHaveAttribute('datetime', 'PT0S');
  expect(slider).toHaveAttribute('aria-valuetext', '0 sekunder av 1 minut');
  expect(onSeek).not.toHaveBeenCalled();
});
