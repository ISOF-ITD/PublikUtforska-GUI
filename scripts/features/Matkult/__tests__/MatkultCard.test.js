/* global expect, jest, test */
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import RecordCardItem from '../../RecordList/ui/RecordCardItem';

jest.mock('d3-array', () => ({ max: jest.fn() }));
jest.mock('sanitize-html', () => (value) => value);

test('Matkults textposter får ett utdrag och kort som anpassar höjden till texten', () => {
  render(
    <MemoryRouter>
      <RecordCardItem
        item={{
          _source: {
            id: 'mk-kb884',
            materialtype: 'matkarta',
            title: 'Fläskpannkaka',
            text: 'Mjölk och ägg vispas samman.',
          },
        }}
        searchParams={{ theme: 'matkult', category: 'MK-10,MK-12' }}
      />
    </MemoryRouter>,
  );
  expect(screen.getByText('Mjölk och ägg vispas samman.')).toBeVisible();
  const link = screen.getByRole('link', { name: /Fläskpannkaka/ });
  expect(link).toHaveClass('md:min-h-[14rem]');
  expect(link).not.toHaveClass('md:h-[22rem]');
  expect(new URL(link.href).searchParams.get('category')).toBe('MK-10,MK-12');
});
