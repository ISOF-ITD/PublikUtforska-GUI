/* global expect, jest, test */
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import RecordCardItem from '../RecordCardItem';

jest.mock('../../../../utils/helpers', () => ({
  getPlaceString: () => '',
  getTitle: (title) => title,
  pageFromTo: () => '',
}));

jest.mock('../../hooks/useSubrecords', () => ({
  __esModule: true,
  default: () => ({}),
}));

jest.mock('../RecordCardSnippet', () => ({
  __esModule: true,
  default: () => null,
  selectBestCardSnippet: () => null,
  toSemanticHighlightHtml: (text) => text,
}));

test('ljudavskriftens etikett behåller gul bakgrund i ljust läge och följer mörkt tema', () => {
  render(
    <MemoryRouter>
      <RecordCardItem
        item={{
          _source: {
            id: 'audio-1',
            title: 'Inspelning med avskrift',
            recordtype: 'one_audio_record',
            media: [{ type: 'audio', has_transcription: true }],
          },
        }}
        searchParams={{}}
      />
    </MemoryRouter>,
  );

  expect(screen.getByText('Automatisk ljudavskrift')).toHaveClass(
    'bg-yellow-50',
    'dark:bg-surface-muted',
    'text-body',
  );
});
