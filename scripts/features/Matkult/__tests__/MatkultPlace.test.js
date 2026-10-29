/* global expect, jest, test */
import 'whatwg-fetch';
import { render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import PlaceView from '../../../components/views/PlaceView';
import PersonView from '../../../components/views/PersonView';
import RecordList from '../../RecordList/RecordList';

jest.mock('../../../components/views/SimpleMap', () => () => null);
jest.mock('../../../components/views/ContributeInfoSection', () => () => null);
jest.mock('../../RecordList/RecordList', () => jest.fn(() => null));

async function renderPlace(search) {
  const router = createMemoryRouter([{
    path: '/places/:id',
    loader: () => ({
      results: Promise.resolve({ id: '817', name: 'Näsum sn', location: {} }),
    }),
    hydrateFallbackElement: <p>Laddar</p>,
    element: <PlaceView />,
  }], { initialEntries: [`/places/817${search}`] });
  render(<RouterProvider router={router} />);
  await screen.findByRole('heading', { name: 'Näsum socken' });
}

test('ortsidan visar bara Matkults aktuella urval och behåller receptets båda kategorier', async () => {
  await renderPlace('?theme=matkult&category=MK-10,MK-12&showmap=1');
  expect(screen.getByRole('heading', { name: 'Matkult från orten – aktuellt urval' })).toBeVisible();
  expect(screen.queryByText('Samtliga accessioner från orten')).not.toBeInTheDocument();
  expect(RecordList).toHaveBeenCalled();
  RecordList.mock.calls.forEach(([props]) => {
    expect(props.params).toEqual({ theme: 'matkult', category: 'MK-10,MK-12', place_id: '817' });
    expect(props.detailSearch).toContain('theme=matkult');
  });
});

test('Folkes ortsida behåller både sökträffar och samtliga accessioner', async () => {
  await renderPlace('?q=ost');
  expect(screen.getByRole('heading', { name: 'Sökträffar' })).toBeVisible();
  expect(screen.getByRole('heading', { name: 'Samtliga accessioner från orten' })).toBeVisible();
  expect(RecordList.mock.calls.some(([props]) => props.params.search === 'ost')).toBe(true);
  expect(RecordList.mock.calls.some(([props]) => props.params.search === undefined)).toBe(true);
});

test('personsidan behåller Matkult och receptkategorier i materiallistan', async () => {
  const router = createMemoryRouter([{
    path: '/persons/:id',
    loader: () => ({ id: 'person-1', name: 'Anna', places: [] }),
    hydrateFallbackElement: <p>Laddar</p>,
    element: <PersonView />,
  }], { initialEntries: ['/persons/person-1?theme=matkult&category=MK-10,MK-12'] });
  render(<RouterProvider router={router} />);
  await screen.findByRole('heading', { name: 'Anna' });
  expect(RecordList).toHaveBeenCalled();
  RecordList.mock.calls.forEach(([props]) => {
    expect(props.params).toEqual({
      theme: 'matkult', category: 'MK-10,MK-12', person_id: 'person-1', transcribe: undefined,
    });
  });
});
