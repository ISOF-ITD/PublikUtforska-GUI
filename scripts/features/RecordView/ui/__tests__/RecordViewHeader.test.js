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
  getRecordtypeLabel: () => 'Accession',
  getTitleText: (data) => data.title,
}));

test('visar begreppshjälpen inline som en tangentbordsstyrd disclosure', async () => {
  const user = userEvent.setup();
  render(
    <RecordViewHeader
      data={{
        title: 'Testpost',
        recordtype: 'one_accession_row',
        archive: { archive_id: 'A1' },
      }}
      subrecordsCount={0}
    />,
  );

  const toggle = screen.getByRole('button', {
    name: 'Om accessioner och uppteckningar',
  });
  const region = document.getElementById('record-type-help');

  expect(toggle).toHaveAttribute('aria-expanded', 'false');
  expect(region).not.toBeVisible();
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

  await user.click(toggle);

  expect(toggle).toHaveAttribute('aria-expanded', 'true');
  expect(region).toBeVisible();
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
});
