/* global expect, jest, test */
import { render, screen } from '@testing-library/react';
import RecordViewHeader from '../RecordViewHeader';

jest.mock('../../../../components/views/ContactButtonGroup', () => () => null);
jest.mock('../../../../components/BookmarkedRecordButton', () => () => null);
jest.mock('../../../../utils/helpers', () => ({ getTitleText: (data) => data.title }));
jest.mock('../../../../lang/Lang', () => ({ l: (text) => text }));
jest.mock('../../../../config', () => ({
  siteOptions: {
    helpTexts: { switcher: { title: 'Begreppshjälp', content: '<p>Hjälp</p>' } },
  },
}));

const data = {
  id: 'record-a',
  title: 'Testpost',
  recordtype: 'one_accession_row',
  archive: {
    archive_id: 'A1', archive_id_row: 'A1', archive_org: 'ISOF',
  },
};

test('sidhuvudet innehåller titeln men ingen definitionslista', () => {
  const { container } = render(<RecordViewHeader data={data} headingId="record-title" />);
  expect(screen.getByRole('heading', { level: 1, name: 'Testpost' }))
    .toHaveAttribute('id', 'record-title');
  expect(container.querySelector('.container-header h1')).not.toBeNull();
  expect(container.querySelector('header')).toBeNull();
  expect(container.querySelector('dl')).toBeNull();
  expect(screen.queryByRole('region', { name: 'Begreppshjälp' })).not.toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Om accessioner och uppteckningar' }))
    .not.toBeInTheDocument();
});

test.each(['', '[]'])('saknad titel %s har ett begripligt reservnamn', (title) => {
  render(<RecordViewHeader data={{ ...data, title }} />);
  expect(screen.getByRole('heading', { level: 1, name: '(Utan titel)' })).toBeVisible();
});
