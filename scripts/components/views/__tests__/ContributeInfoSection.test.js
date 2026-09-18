/* global beforeEach, expect, test */
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import ContributeInfoSection from '../ContributeInfoSection';

beforeEach(() => {
  window.requestAnimationFrame = (callback) => window.setTimeout(callback, 0);
});

test('visar Vet du mer-formuläret som en kontrollerad inline-region', async () => {
  const user = userEvent.setup();
  render(
    <MemoryRouter>
      <ContributeInfoSection title="Testpost" type="Post" id="test-id" />
    </MemoryRouter>,
  );
  const opener = screen.getByRole('button', {
    name: 'Komplettera eller rätta en uppgift, ställ en fråga eller lämna en synpunkt.',
  });

  expect(opener).toHaveAttribute('aria-expanded', 'false');
  expect(screen.queryByRole('region', { name: 'Vet du mer?' })).not.toBeInTheDocument();
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

  await user.click(opener);

  expect(opener).toHaveAttribute('aria-expanded', 'true');
  expect(screen.getByRole('region', { name: 'Vet du mer?' })).toBeInTheDocument();
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

  await user.click(screen.getByRole('button', { name: 'Dölj formuläret' }));

  expect(screen.queryByRole('region', { name: 'Vet du mer?' })).not.toBeInTheDocument();
  expect(opener).toHaveAttribute('aria-expanded', 'false');
  await waitFor(() => expect(opener).toHaveFocus());
});
