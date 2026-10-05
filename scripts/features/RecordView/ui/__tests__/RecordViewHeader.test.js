/* global expect, jest, test */
import { render, screen, within } from '@testing-library/react';
import RecordViewHeader from '../RecordViewHeader';

jest.mock('../../../../components/views/ContactButtonGroup', () => function ContactButtonGroup() {
  return null;
});

jest.mock('../../../../components/BookmarkedRecordButton', () => function BookmarkedRecordButton() {
  return null;
});

jest.mock('../../../../utils/helpers', () => ({
  getPages: () => '',
  getTitleText: (data) => data.title,
}));

jest.mock('../../../../lang/Lang', () => ({ l: (text) => text }));
jest.mock('../../../../config', () => ({
  siteOptions: {
    recordView: { hideMaterialType: false },
    helpTexts: { switcher: { title: 'Accessioner och uppteckningar', content: '<p>Begreppshjälp</p>' } },
  },
}));

test('visar postens titel och metadata med tillgänglig struktur', () => {
  render(
    <RecordViewHeader
      data={{
        id: '04940_180267',
        title: 'Testpost',
        recordtype: 'one_accession_row',
        materialtype: 'Handskrift',
        year: '1901',
        archive: {
          archive_id: 'A1',
          archive_id_row: 'A1',
          archive_org: 'ISOF',
          archive_id_display_search: ['04940'],
        },
      }}
    />,
  );

  const header = within(screen.getByRole('banner'));
  expect(header.getByRole('heading', { level: 1, name: 'Testpost' })).toBeVisible();
  expect(header.getAllByRole('term').map((element) => element.textContent)).toEqual([
    'Accessionsnummer', 'År', 'Materialtyp',
  ]);
  expect(header.getAllByRole('definition').map((element) => element.textContent)).toEqual([
    ': 04940', ': 1901', ': Handskrift',
  ]);

  // Hjälpknappen har tagits bort ur posthuvudet. Den kvarvarande dolda texten
  // ska inte exponeras som en tillgänglig region eller dialog.
  expect(header.queryByRole('button', {
    name: 'Om accessioner och uppteckningar',
  })).not.toBeInTheDocument();
  expect(header.queryByRole('region', { name: 'Accessioner och uppteckningar' })).not.toBeInTheDocument();
  expect(document.getElementById('record-type-help')).not.toBeVisible();
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
});
