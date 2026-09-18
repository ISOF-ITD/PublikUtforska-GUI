/* global expect, test */
import {
  fireEvent, render, screen, waitFor,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PropTypes from 'prop-types';
import { useRef, useState } from 'react';
import ModalDialog, {
  ModalDialogDescription,
  ModalDialogTitle,
} from '../ModalDialog';

function DialogHarness({ closeOnBackdrop = false, role = 'dialog' }) {
  const [open, setOpen] = useState(false);
  const initialFocusRef = useRef(null);

  return (
    <div data-testid="background-content">
      <button type="button" onClick={() => setOpen(true)}>
        Öppna dialog
      </button>
      <ModalDialog
        open={open}
        onClose={() => setOpen(false)}
        role={role}
        initialFocus={initialFocusRef}
        closeOnBackdrop={closeOnBackdrop}
        containerClassName="fixed inset-0"
      >
        <div>
          <ModalDialogTitle>Testdialog</ModalDialogTitle>
          <ModalDialogDescription>Beskrivning av dialogen.</ModalDialogDescription>
          <button ref={initialFocusRef} type="button">
            Avbryt
          </button>
          <button type="button" onClick={() => setOpen(false)}>
            Bekräfta
          </button>
        </div>
      </ModalDialog>
    </div>
  );
}

function FallbackHarness() {
  const [open, setOpen] = useState(false);
  const [showOpener, setShowOpener] = useState(true);
  const initialFocusRef = useRef(null);
  const fallbackFocusRef = useRef(null);

  const close = () => {
    setShowOpener(false);
    setOpen(false);
  };

  return (
    <>
      <button ref={fallbackFocusRef} type="button">
        Stabil kontroll
      </button>
      {showOpener && (
        <button type="button" onClick={() => setOpen(true)}>
          Öppna och ta bort öppnaren
        </button>
      )}
      <ModalDialog
        open={open}
        onClose={close}
        initialFocus={initialFocusRef}
        fallbackFocus={fallbackFocusRef}
        containerClassName="fixed inset-0"
      >
        <div>
          <ModalDialogTitle>Dialog med reservfokus</ModalDialogTitle>
          <button ref={initialFocusRef} type="button" onClick={close}>
            Stäng
          </button>
        </div>
      </ModalDialog>
    </>
  );
}

DialogHarness.propTypes = {
  closeOnBackdrop: PropTypes.bool,
  role: PropTypes.oneOf(['dialog', 'alertdialog']),
};

test('styr fokus, håller bakgrunden inaktiv och återställer fokus', async () => {
  const user = userEvent.setup();
  render(<DialogHarness />);
  const opener = screen.getByRole('button', { name: 'Öppna dialog' });

  await user.click(opener);

  const dialog = await screen.findByRole('dialog', { name: 'Testdialog' });
  expect(dialog).toHaveAttribute('aria-modal', 'true');
  expect(dialog).toHaveAccessibleDescription('Beskrivning av dialogen.');
  const cancelButton = screen.getByRole('button', { name: 'Avbryt' });
  await waitFor(() => expect(cancelButton).toHaveFocus());
  expect(cancelButton).not.toHaveClass('modal-initial-focus-visible');

  const backgroundRoot = screen
    .getByTestId('background-content')
    .closest('[aria-hidden="true"]');
  expect(backgroundRoot).not.toBeNull();
  expect(backgroundRoot.inert).toBe(true);

  await user.tab({ shift: true });
  expect(screen.getByRole('button', { name: 'Bekräfta' })).toHaveFocus();
  await user.tab();
  expect(screen.getByRole('button', { name: 'Avbryt' })).toHaveFocus();

  await user.keyboard('{Escape}');
  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  expect(opener).toHaveFocus();
  expect(backgroundRoot).not.toHaveAttribute('aria-hidden');
  expect(backgroundRoot.inert).not.toBe(true);
});

test('använder alertdialog och respekterar inställningen för bakgrundsstängning', async () => {
  const user = userEvent.setup();
  const { rerender } = render(<DialogHarness role="alertdialog" />);

  await user.click(screen.getByRole('button', { name: 'Öppna dialog' }));
  expect(await screen.findByRole('alertdialog', { name: 'Testdialog' })).toBeInTheDocument();
  fireEvent.mouseDown(screen.getByTestId('background-content').ownerDocument.querySelector('[data-modal-dialog-container]'));
  expect(screen.getByRole('alertdialog')).toBeInTheDocument();

  await user.keyboard('{Escape}');
  await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument());

  rerender(<DialogHarness role="alertdialog" closeOnBackdrop />);
  await user.click(screen.getByRole('button', { name: 'Öppna dialog' }));
  const container = document.querySelector('[data-modal-dialog-container]');
  fireEvent.mouseDown(container);
  await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument());
});

test('använder reservfokus när öppnaren försvinner', async () => {
  const user = userEvent.setup();
  render(<FallbackHarness />);

  await user.click(screen.getByRole('button', { name: 'Öppna och ta bort öppnaren' }));
  await user.click(await screen.findByRole('button', { name: 'Stäng' }));

  await waitFor(() => expect(screen.getByRole('button', { name: 'Stabil kontroll' })).toHaveFocus());
});
