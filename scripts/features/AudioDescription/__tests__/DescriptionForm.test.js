/* global expect, jest, test */
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DescriptionForm from '../DescriptionForm';
import { AudioContext } from '../../../contexts/AudioContext';

function renderForm(hasSession = true) {
  const onSave = jest.fn();
  const setFormData = jest.fn();
  render(
    <AudioContext.Provider value={{ currentTime: 0, durationTime: 60, visible: false }}>
      <DescriptionForm
        source="a.mp3"
        formData={{
          'a.mp3': {
            start: '00:00',
            descriptionText: 'En berättelse',
            selectedTags: [{ termid: '1', term: 'Musik' }],
            typedTag: 'Sång',
          },
        }}
        setFormData={setFormData}
        setInitialFormData={jest.fn()}
        isLocked={false}
        hasSession={hasSession}
        onSave={onSave}
        onCancel={jest.fn()}
        hasUnsavedChanges={false}
        setHasUnsavedChanges={jest.fn()}
        savedUserInfo={{}}
      />
    </AudioContext.Provider>,
  );
  return { onSave, setFormData };
}

test('namngivet formulär sparar via submit med befintlig datamodell', async () => {
  const user = userEvent.setup();
  const { onSave } = renderForm();
  expect(screen.getByRole('form', { name: /Lägg till en beskrivning/ })).toBeVisible();
  expect(screen.getByRole('heading', { level: 4, name: 'Lägg till en beskrivning' })).toBeVisible();
  await user.click(screen.getByRole('button', { name: 'Spara' }));
  expect(onSave).toHaveBeenCalledWith(expect.objectContaining({
    source: 'a.mp3',
    start: '00:00',
    text: 'En berättelse',
    terms: [{ termid: '1', term: 'Musik' }],
  }));
});

test('Enter i ämnesordsfältet lägger till ett ord utan att spara formuläret', async () => {
  const user = userEvent.setup();
  const { onSave, setFormData } = renderForm();
  await user.type(screen.getByRole('textbox', { name: 'Ämnesord' }), '{Enter}');
  expect(setFormData).toHaveBeenCalled();
  expect(onSave).not.toHaveBeenCalled();
});

test('submit utan aktiv session sparar inte', () => {
  const { onSave } = renderForm(false);
  expect(screen.getByRole('button', { name: 'Spara' })).toBeDisabled();
  fireEvent.submit(screen.getByRole('form', { name: /Lägg till en beskrivning/ }));
  expect(onSave).not.toHaveBeenCalled();
});
