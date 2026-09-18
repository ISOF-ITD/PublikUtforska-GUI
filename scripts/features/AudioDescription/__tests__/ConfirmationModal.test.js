/* global expect, test */
import {
  fireEvent, render, screen, waitFor,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import ConfirmationModal from '../ConfirmationModal';

function ConfirmationHarness() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        Ta bort beskrivning
      </button>
      <ConfirmationModal
        isOpen={open}
        onConfirm={() => setOpen(false)}
        onCancel={() => setOpen(false)}
        message="Är du säker på att du vill ta bort denna beskrivning?"
        confirmLabel="Ta bort"
        cancelLabel="Avbryt"
        variant="delete"
      />
    </>
  );
}

test('är en namngiven alertdialog med säkert initialfokus', async () => {
  const user = userEvent.setup();
  render(<ConfirmationHarness />);
  const opener = screen.getByRole('button', { name: 'Ta bort beskrivning' });

  opener.focus();
  await user.keyboard('{Enter}');

  expect(await screen.findByRole('alertdialog', {
    name: 'Är du säker på att du vill ta bort denna beskrivning?',
  })).toHaveAttribute('aria-modal', 'true');
  const cancelButton = screen.getByRole('button', { name: 'Avbryt' });
  await waitFor(() => expect(cancelButton).toHaveFocus());
  expect(cancelButton).toHaveClass('modal-initial-focus-visible');

  const container = document.querySelector('[data-modal-dialog-container]');
  fireEvent.mouseDown(container);
  expect(screen.getByRole('alertdialog')).toBeInTheDocument();

  await user.keyboard('{Escape}');
  await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument());
  expect(opener).toHaveFocus();
});
