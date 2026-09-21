/* global expect, jest, test */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import RecordViewHeader from '../RecordViewHeader';

jest.mock('../../../../components/views/ContactButtonGroup', () => function ContactButtonGroup() {
  return null;
});

jest.mock('../../../../components/BookmarkedRecordButton', () => function BookmarkedRecordButton() {
  return null;
});

jest.mock('../../../../utils/helpers', () => ({
  getArchiveName: () => '',
  getPages: () => '',
  // getRecordtypeLabel: () => 'Accession',
  getTitleText: (data) => data.title,
}));

// När användaren öppnar informationen om accessioner och uppteckningar
// ska den visas direkt på sidan som en utfällbar sektion, inte som en dialogruta.
test('visar begreppshjälpen inline som en tangentbordsstyrd disclosure', async () => {
  // Skapa en simulerad användare
  const user = userEvent.setup();
  render(
    // Rendera komponenten med testdata
    <RecordViewHeader
      data={{
        title: 'Testpost',
        recordtype: 'one_accession_row',
        archive: { archive_id: 'A1' },
      }}
      // subrecordsCount={0}
    />,
  );

  // Testet kräver att det faktiskt finns ett element som har rollen button
  // och har det tillgängliga namnet "Om accessioner och uppteckningar"
  const toggle = screen.getByRole('button', {
    name: 'Om accessioner och uppteckningar',
  });

  // hitta hjälpinnehållet
  const region = document.getElementById('record-type-help');

  // Knappen måste signalera till hjälpmedel att sektionen är stängd
  expect(toggle).toHaveAttribute('aria-expanded', 'false');

  // Hjälptexten ska inte vara synlig
  expect(region).not.toBeVisible();

  // Det ska inte finnas någon dialog
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

  // simulera ett användarklick på knappen
  await user.click(toggle);

  // Efter klicket ska knappen signalera att sektionen är öppen
  expect(toggle).toHaveAttribute('aria-expanded', 'true');
  // Hjälptexten ska nu vara synlig
  expect(region).toBeVisible();
  // Det ska fortfarande inte finnas någon dialog
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
});
