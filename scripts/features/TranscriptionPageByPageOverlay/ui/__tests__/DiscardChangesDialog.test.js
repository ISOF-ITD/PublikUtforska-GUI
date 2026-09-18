/* global expect, test */
import {
  fireEvent, render, screen, waitFor,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import DiscardChangesDialog from '../DiscardChangesDialog';

function DiscardDialogHarness() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        Gå vidare
      </button>
      <DiscardChangesDialog
        open={open}
        onCancel={() => setOpen(false)}
        onConfirm={() => setOpen(false)}
      />
    </>
  );
}

test('fokuserar Avbryt och tillåter stängning via bakgrunden', async () => {
  const user = userEvent.setup();
  render(<DiscardDialogHarness />);
  const opener = screen.getByRole('button', { name: 'Gå vidare' });

  opener.focus();
  await user.keyboard('{Enter}');

  const dialog = await screen.findByRole('alertdialog', { name: 'Lämna utan att spara?' });
  expect(dialog).toHaveAccessibleDescription(
    'Det finns osparade ändringar. Är du säker på att du vill lämna sidan?',
  );
  const cancelButton = screen.getByRole('button', { name: 'Avbryt' });
  await waitFor(() => expect(cancelButton).toHaveFocus());
  expect(cancelButton).toHaveClass('modal-initial-focus-visible');

  fireEvent.mouseDown(document.querySelector('[data-modal-dialog-container]'));
  await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument());
  expect(opener).toHaveFocus();
});
