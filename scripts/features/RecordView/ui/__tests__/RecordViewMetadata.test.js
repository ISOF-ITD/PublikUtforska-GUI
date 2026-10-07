/* global afterEach, expect, jest, test */
import {
  render, screen, waitFor, within,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import RecordViewMetadata from '../RecordViewMetadata';
import config from '../../../../config';

jest.mock('../../../../components/views/ContactButtonGroup', () => function ContactButtonGroup() {
  return null;
});

jest.mock('../../../../components/BookmarkedRecordButton', () => function BookmarkedRecordButton() {
  return null;
});

jest.mock('../../../../utils/helpers', () => ({
  getPages: (data) => data.archive?.page || '',
  getTitleText: (data) => data.title,
}));

afterEach(() => {
  delete config.siteOptions.disablePersonLinks;
  delete config.siteOptions.disableInformantLinks;
  config.siteOptions.recordView.hideMaterialType = false;
});

function renderPersons(persons) {
  return render(
    <MemoryRouter>
      <RecordViewMetadata
        search="?k=start&q=brev"
        data={{
          id: 'record-a',
          title: 'Testpost',
          recordtype: 'one_accession_row',
          archive: { archive_id: 'A1', archive_id_row: 'A1', archive_org: 'ISOF' },
          persons,
        }}
      />
    </MemoryRouter>,
  );
}

test('personer och roller visas som lista i metadata under sidhuvudet med fungerande länkar', () => {
  renderPersons([
    { id: 'p1', name: 'Anna', relation: 'informant' },
    { id: 'p2', name: 'Bertil', relation: 'recorder' },
    { id: 'p2', name: 'Bertil', relation: 'photographer' },
    { id: 'p3', name: 'Cecilia' },
  ]);
  const metadata = within(screen.getByText('Personer', { selector: 'dt' }).closest('dl'));
  const list = metadata.getByRole('list');
  expect(list.closest('dd').closest('dl')).not.toBeNull();
  expect(within(list).getAllByRole('listitem').map((item) => item.textContent)).toEqual([
    'Anna (Informant)', 'Bertil (Inspelad av, Fotograf)', 'Cecilia',
  ]);
  expect(metadata.getByRole('link', { name: 'Anna' })).toHaveAttribute('href', '/persons/p1?k=start&q=brev');
});

test('samma person får en rad med unika roller även vid dubbla rollkoder', () => {
  const persons = [
    { id: 'p1', name: 'Anna', relation: 'informant' },
    { id: 'p1', name: 'Anna', relation: 'author' },
    { id: 'p1', name: 'Anna', relation: 'i' },
  ];
  renderPersons(persons);
  expect(screen.getByText('Personer', { selector: 'dt' }).tagName).toBe('DT');
  expect(screen.getAllByRole('listitem')).toHaveLength(1);
  expect(screen.getByRole('listitem')).toHaveTextContent('Anna (Informant, Författare)');
  expect(screen.getAllByRole('link', { name: 'Anna' })).toHaveLength(1);
  expect(persons.map((person) => person.relation)).toEqual(['informant', 'author', 'i']);
});

test('personer med samma namn och olika eller saknade id slås inte ihop', () => {
  renderPersons([
    { id: 'p1', name: 'Anna', relation: 'informant' },
    { id: 'p2', name: 'Anna', relation: 'author' },
    { name: 'Anna', relation: 'recorder' },
    { name: 'Anna', relation: 'collector' },
  ]);
  expect(screen.getAllByRole('listitem')).toHaveLength(4);
});

test.each([
  ['c', 'Insamlare'], ['collector', 'Insamlare'], ['i', 'Informant'],
  ['informant', 'Informant'], ['author', 'Författare'], ['unknown', ''],
])('en person får rätt roll för %s utan tomma parenteser', (relation, role) => {
  renderPersons([{ id: 'p1', name: 'Anna', relation }]);
  expect(screen.getByText('Personer', { selector: 'dt' }).tagName).toBe('DT');
  expect(screen.getByRole('listitem').textContent).toBe(role ? `Anna (${role})` : 'Anna');
});

test.each(['disablePersonLinks', 'disableInformantLinks'])('personlänkar följer inställningen %s', (setting) => {
  config.siteOptions[setting] = true;
  renderPersons([
    { id: 'p1', name: 'Anna', relation: 'author' },
    { id: 'p1', name: 'Anna', relation: 'informant' },
    { id: 'p2', name: 'Bertil', relation: 'collector' },
  ]);
  expect(screen.queryByRole('link', { name: 'Anna' })).not.toBeInTheDocument();
  expect(screen.getAllByRole('listitem')[0]).toHaveTextContent('Anna (Författare, Informant)');
  if (setting === 'disableInformantLinks') {
    expect(screen.getByRole('link', { name: 'Bertil' })).toBeVisible();
  } else {
    expect(screen.queryByRole('link', { name: 'Bertil' })).not.toBeInTheDocument();
  }
});

jest.mock('../../../../lang/Lang', () => ({ l: (text) => text }));
jest.mock('../../../../config', () => ({
  siteOptions: {
    recordView: { hideMaterialType: false },
    helpTexts: {
      switcher: {
        title: 'Accessioner och uppteckningar',
        content: '<p>Begreppshjälp</p><a href="https://example.test/help">Läs mer</a>',
      },
    },
  },
}));

test('vanliga metadata har etiketter och värden i en definitionslista', () => {
  render(
    <RecordViewMetadata
      data={{
        materialtype: 'Handskrift',
        year: '1901',
        archive: { archive_id_display_search: ['04940'], page: '1–3' },
      }}
    />,
  );
  expect(screen.getAllByRole('term')[0]).toHaveTextContent('Accessionsnummer');
  expect(screen.getAllByRole('term').slice(1).map((element) => element.textContent))
    .toEqual(['År', 'Sidnummer', 'Materialtyp']);
  expect(screen.getAllByRole('definition')[0]).toHaveTextContent('04940');
  expect(screen.getAllByRole('definition').slice(1).map((element) => element.textContent))
    .toEqual(['1901', '1–3', 'Handskrift']);
});

test.each(['{Enter}', ' '])('begreppshjälpen öppnas med %s och Escape återställer fokus', async (key) => {
  const user = userEvent.setup();
  render(<RecordViewMetadata data={{ archive: { archive_id_display_search: ['A1'] } }} />);
  const control = screen.getByRole('button', { name: 'Om accessioner och uppteckningar' });
  expect(control.closest('dt')).toHaveTextContent('Accessionsnummer');
  expect(control).toHaveAttribute('aria-haspopup', 'dialog');
  expect(control).toHaveAttribute('aria-expanded', 'false');
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  control.focus();
  await user.keyboard(key);
  const dialog = await screen.findByRole('dialog', { name: 'Accessioner och uppteckningar' });
  const panel = document.getElementById(control.getAttribute('aria-controls'));
  expect(dialog).toHaveAttribute('aria-modal', 'true');
  expect(dialog).toContainElement(panel);
  expect(control).toHaveAttribute('aria-expanded', 'true');
  expect(screen.getByRole('heading', { level: 2, name: 'Accessioner och uppteckningar' }))
    .toHaveAttribute('id', dialog.getAttribute('aria-labelledby'));
  expect(screen.getByText('Begreppshjälp')).toBeVisible();
  await waitFor(() => expect(screen.getByRole('button', { name: 'Stäng förklaringen' })).toHaveFocus());
  await user.keyboard('{Escape}');
  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  expect(control).toHaveAttribute('aria-expanded', 'false');
  expect(control).not.toHaveAttribute('aria-controls');
  await waitFor(() => expect(control).toHaveFocus());
});

test('begreppshjälpen håller tabbfokus i dialogen och stängknappen återställer fokus', async () => {
  const user = userEvent.setup();
  render(
    <>
      <RecordViewMetadata data={{ archive: { archive_id_display_search: ['A1'] } }} />
      <button type="button">Nästa kontroll</button>
    </>,
  );
  const control = screen.getByRole('button', { name: 'Om accessioner och uppteckningar' });
  control.focus();
  await user.tab();
  expect(screen.getByRole('button', { name: 'Nästa kontroll' })).toHaveFocus();
  expect(screen.queryByRole('link', { name: 'Läs mer' })).not.toBeInTheDocument();
  control.focus();
  await user.keyboard('{Enter}');
  const close = await screen.findByRole('button', { name: 'Stäng förklaringen' });
  await waitFor(() => expect(close).toHaveFocus());
  await user.tab();
  expect(screen.getByRole('link', { name: 'Läs mer' })).toHaveFocus();
  await user.tab();
  expect(close).toHaveFocus();
  await user.click(close);
  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  await waitFor(() => expect(control).toHaveFocus());
});

test('flera metadatavyer får unika dialogreferenser och bakgrundsklick stänger dialogen', async () => {
  const user = userEvent.setup();
  render(
    <>
      <RecordViewMetadata data={{ archive: { archive_id_display_search: ['A1'] } }} />
      <RecordViewMetadata data={{ archive: { archive_id_display_search: ['A2'] } }} />
    </>,
  );
  const controls = screen.getAllByRole('button', { name: 'Om accessioner och uppteckningar' });
  await user.click(controls[0]);
  expect(await screen.findByRole('dialog', { name: 'Accessioner och uppteckningar' })).toBeVisible();
  const firstId = controls[0].getAttribute('aria-controls');
  expect(document.getElementById(firstId)).not.toBeNull();
  await user.click(document.querySelector('[data-modal-dialog-container]'));
  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  await waitFor(() => expect(controls[0]).toHaveFocus());
  await user.click(controls[1]);
  expect(await screen.findByRole('dialog', { name: 'Accessioner och uppteckningar' })).toBeVisible();
  const secondId = controls[1].getAttribute('aria-controls');
  expect(document.getElementById(secondId)).not.toBeNull();
  expect(secondId).not.toBe(firstId);
});

test('plats och person får separata definitioner med fullständiga uppgifter och söksammanhang', () => {
  render(
    <MemoryRouter>
      <RecordViewMetadata
        search="?k=start&q=brev"
        data={{
          id: 'record-a',
          title: 'Testpost',
          recordtype: 'one_accession_row',
          archive: { archive_id: 'A1', archive_id_row: 'A1', archive_org: 'ISOF' },
          places: [
            {
              id: 'l1', name: 'Skövde', harad: 'Ingen', landskap: 'Västergötland',
            },
            {
              id: 'l2', specification: 'Gård', name: 'Bergen', fylke: 'Vestland',
            },
          ],
          persons: [
            { id: 'p1', name: 'Anna', relation: 'informant' },
            { id: 'p1', name: 'Anna', relation: 'author' },
          ],
        }}
      />
    </MemoryRouter>,
  );
  const places = screen.getByText('Orter', { selector: 'dt' }).nextElementSibling;
  const persons = screen.getByText('Personer', { selector: 'dt' }).nextElementSibling;
  expect(places.tagName).toBe('DD');
  expect(persons.tagName).toBe('DD');
  expect(within(places).getAllByRole('listitem').map((item) => item.textContent)).toEqual([
    'Skövde, Ingen, Västergötland', 'Gård i Bergen, Vestland',
  ]);
  expect(within(places).getByRole('link', { name: 'Gård i Bergen, Vestland' }))
    .toHaveAttribute('href', '/places/l2?k=start&q=brev');
  expect(within(persons).getAllByRole('listitem')).toHaveLength(1);
  expect(within(persons).getByRole('listitem')).toHaveTextContent('Anna (Informant, Författare)');
});

test('saknad metadata lämnar ingen tom definitionslista', () => {
  const { container } = renderPersons([]);
  expect(container.querySelector('dl')).toBeNull();
  expect(container).toBeEmptyDOMElement();
});

test('materialtypen följer inställningen för dolda fält', () => {
  config.siteOptions.recordView.hideMaterialType = true;
  const { container } = render(<RecordViewMetadata data={{ materialtype: 'Handskrift' }} />);
  expect(container).toBeEmptyDOMElement();
});

test('ytterligare definitionspar visas även när de vanliga metadatafälten saknas', () => {
  render(
    <RecordViewMetadata data={{}}>
      <div>
        <dt>Beskrivning av innehållet</dt>
        <dd>En berättelse</dd>
      </div>
    </RecordViewMetadata>,
  );
  const term = screen.getByText('Beskrivning av innehållet', { selector: 'dt' });
  expect(term.closest('dl')).not.toBeNull();
  expect(term.nextElementSibling).toHaveTextContent('En berättelse');
});
