/* global expect, test */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import TranscriptionHelpButton from '../TranscriptionHelpButton';
import TranscriptionInstructions from '../TranscriptionInstructions';

function InstructionsHarness() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <TranscriptionHelpButton
        expanded={open}
        controls="test-instructions"
        onClick={() => setOpen((visible) => !visible)}
      />
      {open && (
        <section id="test-instructions" aria-label="Instruktioner">
          <TranscriptionInstructions />
        </section>
      )}
    </>
  );
}

test('öppnar instruktionerna inline utan dialogsemantik', async () => {
  const user = userEvent.setup();
  render(<InstructionsHarness />);
  const toggle = screen.getByRole('button', { name: 'Instruktioner' });

  expect(toggle).toHaveAttribute('aria-expanded', 'false');
  expect(screen.queryByRole('region')).not.toBeInTheDocument();

  await user.click(toggle);

  expect(toggle).toHaveAttribute('aria-expanded', 'true');
  expect(screen.getByRole('region', { name: 'Instruktioner' })).toBeVisible();
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
});
