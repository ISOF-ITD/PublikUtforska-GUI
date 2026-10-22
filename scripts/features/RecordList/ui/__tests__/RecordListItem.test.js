/* global expect, jest, test */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import RecordListItem from '../RecordListItem';

jest.mock('d3-array', () => ({}));
jest.mock('../../../../config', () => ({
  imageUrl: 'https://example.test/images/',
  apiUrl: 'https://example.test/api/',
  siteOptions: { recordList: {} },
}));
jest.mock('../../../../lang/Lang', () => ({ l: (text) => text }));

test.each([
  ['needsimprovement', 'Sidor 7-8 Tjänare.'],
  ['readytotranscribe', 'Sidor 7-8 Tjänare kan skrivas av.'],
])('segmentetiketten tar hänsyn till accessionens %s-status', async (transcriptionstatus, label) => {
  const user = userEvent.setup();
  const data = {
    id: 'record-a',
    title: 'Uppteckning',
    archive: { archive_id_display_search: ['IFGH 2567'], archive_id_row: 'ifgh02567' },
    recordtype: 'one_accession_row',
    transcriptiontype: 'sida',
    transcriptionstatus,
    media: [7, 8].map((page) => ({
      id: `image-${page}`,
      type: 'image',
      source: `page_${page}.jpg`,
      pagenumber: String(page),
      title: page === 7 ? 'Tjänare' : '',
      transcriptionstatus: 'readytotranscribe',
    })),
    segments: [{ id: 'segment-a', start_media_id: 'image-7' }],
    metadata: [],
    persons: [],
    places: [],
  };
  render(
    <MemoryRouter>
      <table>
        <tbody>
          <RecordListItem
            id={data.id}
            item={{ _source: data }}
            searchParams={{ archive_id: 'IFGH 2567' }}
            columns={['title']}
            shouldRenderColumn={(column) => column === 'title'}
          />
        </tbody>
      </table>
    </MemoryRouter>,
  );

  await user.click(await screen.findByRole('button', { name: /Visa Uppteckningar/ }));
  const segmentLink = screen.getByRole('link', { name: label });
  const target = new URL(segmentLink.href);
  expect(target.pathname).toBe('/records/record-a');
  expect(target.searchParams.get('media')).toBe('0');
  expect(target.searchParams.get('archive_id')).toBe('IFGH 2567');
  expect(data.media.map((page) => page.transcriptionstatus))
    .toEqual(['readytotranscribe', 'readytotranscribe']);
});
