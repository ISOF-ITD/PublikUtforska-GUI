/* global expect, test */
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import matkultLogo from '../../../../img/matkult-logga.png';
import MatkultHeaderLink from '../MatkultHeaderLink';

test.each([
  ['/search', false],
  ['/matkult', true],
  ['/records/mk-kb884?theme=matkult', false],
])('temalänken på %s har synligt namn och markerar bara själva startsidan som aktuell', (entry, isPage) => {
  render(<MemoryRouter initialEntries={[entry]}><MatkultHeaderLink /></MemoryRouter>);
  const link = screen.getByRole('link', { name: 'Matkult', exact: true });
  expect(link).toHaveAttribute('href', '/matkult');
  expect(link).toHaveTextContent('Matkult');
  expect(link).toHaveClass('header-keyboard-focus', 'min-h-11');
  expect(link.querySelector('img')).toHaveAttribute('src', matkultLogo);
  expect(link.querySelector('img')).toHaveAttribute('alt', '');
  expect(link.querySelector('img')).toHaveAttribute('aria-hidden', 'true');
  if (isPage) expect(link).toHaveAttribute('aria-current', 'page');
  else expect(link).not.toHaveAttribute('aria-current');
});
