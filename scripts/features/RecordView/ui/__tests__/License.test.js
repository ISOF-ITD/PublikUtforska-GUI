/* global expect, jest, test */
import { render, screen } from '@testing-library/react';
import License from '../License';

jest.mock('../../../../utils/helpers', () => ({ getArchiveName: jest.fn(), getPages: jest.fn() }));
jest.mock('../../../../config', () => ({ siteOptions: {} }));

test('Matkult utan licensfält får ingen gissad standardlicens och länkar till originalsidan', () => {
  render(<License data={{
    materialtype: 'matkarta',
    metadata: [{ type: 'sitevision_url', value: 'https://www.matkult.se/recept' }],
  }}
  />);
  expect(screen.getByText('Uppgift om licens saknas för den här posten.')).toBeVisible();
  expect(screen.queryByText('Detta verk är licensierat under:')).not.toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Se originalsidan på Matkult.se (nytt fönster)' }))
    .toHaveAttribute('href', 'https://www.matkult.se/recept');
});

test('en uttrycklig Matkult-licens behålls', () => {
  const license = 'https://creativecommons.org/licenses/by-nd/2.5/se/';
  render(<License data={{ materialtype: 'matkarta', copyrightlicense: license }} />);
  expect(screen.queryByText('Uppgift om licens saknas för den här posten.')).not.toBeInTheDocument();
  expect(screen.getByRole('link', { name: /^Öppna licens:/ })).toHaveAttribute('href', license);
});

test('Folkes vanliga standardlicens påverkas inte', () => {
  render(<License data={{ materialtype: 'arkiv' }} />);
  expect(screen.getByRole('link', { name: /^Öppna licens:/ }))
    .toHaveAttribute('href', 'https://creativecommons.org/licenses/by/4.0/deed.sv');
});
