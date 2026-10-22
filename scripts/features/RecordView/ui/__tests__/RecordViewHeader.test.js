/* global expect, jest, test */
import { render, screen } from '@testing-library/react';
import RecordViewHeader from '../RecordViewHeader';

jest.mock('../../../../components/views/ContactButtonGroup', () => () => null);
jest.mock('../../../../components/BookmarkedRecordButton', () => () => null);
jest.mock('d3-array', () => ({}));
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

test.each([
  'readytotranscribe',
  'undertranscription',
  'transcribed',
  'reviewing',
  'needsimprovement',
  'approved',
  'published',
])('statusen %s ersätter inte en befintlig titel', (transcriptionstatus) => {
  render(<RecordViewHeader data={{ ...data, transcriptionstatus, contents: 'Innehållsbeskrivning' }} />);
  expect(screen.getByRole('heading', { level: 1, name: 'Testpost' })).toBeVisible();
  expect(screen.queryByText('Titel granskas')).not.toBeInTheDocument();
});

test.each([
  'Nattväktarna i Falköping samt hästslakt.',
  'Forngrav.',
  'Tjänare, fästmögåvor, klädedräkt samt hästslakt.',
  'Spökeri vid bro, naturföremål samt namnförklaring.',
  'Vattenväsen, kostenar, naturföremål, jordkulor, folklivs- och karaktärsskildring, namnförklaring samt skogsbruk.',
  '“Eneberget”.',
])('innehållsbeskrivningen används som rubrik när titel saknas: %s', (contents) => {
  render(
    <RecordViewHeader data={{
      ...data, title: null, contents: `${contents} \r\r`, transcriptionstatus: 'needsimprovement',
    }}
    />,
  );
  expect(screen.getByRole('heading', { level: 1, name: contents })).toBeVisible();
});

test('arkivuppgifter används när både titel och innehållsbeskrivning saknas', () => {
  render(
    <RecordViewHeader data={{
      ...data,
      title: null,
      transcriptionstatus: 'needsimprovement',
      archive: {
        ...data.archive, archive_id_display_search: ['IFGH 2567'], page: '5', total_pages: 2,
      },
    }}
    />,
  );
  expect(screen.getByRole('heading', { level: 1, name: 'IFGH 2567:5-6' })).toBeVisible();
});
