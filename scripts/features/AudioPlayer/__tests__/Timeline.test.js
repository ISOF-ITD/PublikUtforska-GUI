/* global expect, jest, test */
import { fireEvent, render, screen } from '@testing-library/react';
import Timeline from '../ui/Timeline';

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
  fireEvent.pointerCancel(slider);
  expect(slider).toHaveValue('0');
  expect(onSeek).not.toHaveBeenCalled();
});
