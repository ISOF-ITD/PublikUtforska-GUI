/* global beforeEach, afterEach, expect, jest, test */
import {
  act, render, screen, waitFor, within,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import RecordView from '../RecordView';
import RoutePageShell from '../../../components/RoutePageShell';
import { AudioContext } from '../../../contexts/AudioContext';
import useTranscriptionAvailability from '../../../hooks/useTranscriptionAvailability';
import config from '../../../config';

jest.mock('sanitize-html', () => (value) => value);

jest.mock('../../../config', () => ({
  imageUrl: 'https://example.test/images/',
  pdfUrl: 'https://example.test/pdf/',
  audioUrl: 'https://example.test/audio/',
  apiUrl: 'https://example.test/api/',
  siteUrl: 'https://example.test',
  siteTitle: 'Folke',
  activateTranscription: true,
  siteOptions: {
    recordView: {},
    helpTexts: { switcher: { title: 'Begrepp', content: '<p>Hjälp</p>' } },
  },
}));
jest.mock('../../../lang/Lang', () => ({ l: (value) => value }));
jest.mock('../../../utils/helpers', () => ({
  getTitleText: (data) => data.title,
  getPages: () => '',
  getArchiveName: () => 'Institutet för språk och folkminnen',
  getAudioTitle: (title) => title,
}));
jest.mock('../../../components/views/ContactButtonGroup', () => () => null);
jest.mock('../../../components/BookmarkedRecordButton', () => () => null);
jest.mock('../../../components/views/SimpleMap', () => jest.fn(() => <p>Karta</p>));
jest.mock('../../../hooks/useTranscriptionAvailability', () => jest.fn(() => false));
jest.mock('../../AudioDescription/hooks/useAudioDuration', () => () => 0);

function record(media = []) {
  return {
    id: 'record-a',
    title: 'Testuppteckning',
    recordtype: 'one_accession_row',
    media,
    transcriptionstatus: 'published',
    archive: {
      archive_id: 'A1',
      archive_id_row: 'A1',
      archive_org: 'Uppsala',
      archive_id_display_search: ['A1'],
    },
    persons: [{ id: 'p1', name: 'Anna', relation: 'collector' }],
    places: [{
      id: 'l1', name: 'Uppsala', harad: 'Uppsala', landskap: 'Uppland',
    }],
    contents: 'Berättelser',
    headwords: 'Ämnesregister',
  };
}

async function renderRecord(data, search = '', highlightData = null) {
  const playAudio = jest.fn();
  const router = createMemoryRouter([{
    path: '/records/:id',
    hydrateFallbackElement: <p>Laddar</p>,
    loader: () => ({ results: [highlightData, { _source: data }] }),
    element: (
      <AudioContext.Provider value={{ playAudio, togglePlay: jest.fn(), playing: false }}>
        <RoutePageShell><RecordView /></RoutePageShell>
      </AudioContext.Provider>
    ),
  }], { initialEntries: [`/records/record-a${search}`] });
  const result = render(<RouterProvider router={router} />);
  await screen.findByRole('article', { name: 'Testuppteckning' });
  await waitFor(() => expect(Element.prototype.scrollTo).toHaveBeenCalledWith({ top: 0 }));
  expect(screen.getByRole('main')).not.toHaveFocus();
  return { ...result, playAudio };
}

beforeEach(() => {
  config.activateAudioDescription = false;
  useTranscriptionAvailability.mockReturnValue(false);
  sessionStorage.clear();
  Element.prototype.scrollIntoView = jest.fn();
  Element.prototype.scrollTo = jest.fn();
  window.matchMedia = jest.fn(() => ({
    matches: true, addEventListener: jest.fn(), removeEventListener: jest.fn(),
  }));
  global.fetch = jest.fn(async () => ({ ok: true, json: async () => ({ hits: { hits: [] } }) }));
});
afterEach(() => jest.restoreAllMocks());

test.each([
  'Beskrivning av innehållet (1)', 'Uppgifter från äldre innehållsregister (1)',
])('innehållspanelen %s öppnas med tangentbord och behåller fokus på kontrollen', async (name) => {
  const user = userEvent.setup();
  await renderRecord(record());
  const control = screen.getByRole('button', { name });
  const panel = document.getElementById(control.getAttribute('aria-controls'));
  const term = control.closest('dt');
  expect(term.closest('dl')).toBe(screen.getByRole('region', { name: 'Metadata' }).querySelector('dl'));
  expect(term.nextElementSibling).toBe(panel);
  expect(panel.tagName).toBe('DD');
  expect(control.closest('h2')).toBeNull();
  expect(control).toHaveAttribute('aria-expanded', 'false');
  expect(panel).not.toBeVisible();
  control.focus();
  await user.keyboard(' ');
  await waitFor(() => expect(control).toHaveAttribute('aria-expanded', 'true'));
  expect(panel).toBeVisible();
  expect(control).toHaveFocus();
  await user.keyboard('{Enter}');
  expect(control).toHaveAttribute('aria-expanded', 'false');
  expect(panel).not.toBeVisible();
  expect(control).toHaveFocus();
});

test.each([
  ['contents', 'Beskrivning av innehållet (1)'],
  ['headwords', 'Uppgifter från äldre innehållsregister (1)'],
])('sparat tillstånd för %s återställs och uppdateras när panelen stängs', async (field, name) => {
  const user = userEvent.setup();
  const key = `rv:record-a:${field}:expanded`;
  sessionStorage.setItem(key, '1');
  const { unmount } = await renderRecord(record());
  const control = screen.getByRole('button', { name });
  await waitFor(() => expect(control).toHaveAttribute('aria-expanded', 'true'));
  expect(document.getElementById(control.getAttribute('aria-controls'))).toBeVisible();
  await user.click(control);
  expect(sessionStorage.getItem(key)).toBe('0');
  unmount();
  await renderRecord(record());
  expect(screen.getByRole('button', { name })).toHaveAttribute('aria-expanded', 'false');
});

test('sökträffar öppnar båda metadatabeskrivningarna och visar markeringarna', async () => {
  sessionStorage.setItem('rv:record-a:contents:expanded', '0');
  sessionStorage.setItem('rv:record-a:headwords:expanded', '0');
  await renderRecord({
    ...record(),
    contents: 'Inledning. Beskrivningsträff. Hela avslutningen.',
    headwords: 'Första ämnet. Registerträff. Sista ämnet.',
  }, '?q=berättelse', {
    data: [{
      highlight: {
        contents: ['<span class="highlight">Beskrivningsträff</span>'],
        headwords: ['<span class="highlight">Registerträff</span>'],
      },
    }],
  });
  await waitFor(() => {
    ['Beskrivning av innehållet (1)', 'Uppgifter från äldre innehållsregister (1)'].forEach((name) => {
      expect(screen.getByRole('button', { name })).toHaveAttribute('aria-expanded', 'true');
    });
  });
  ['Beskrivningsträff', 'Registerträff'].forEach((text) => {
    expect(screen.getByText(text)).toBeVisible();
    expect(screen.getByText(text)).toHaveClass('highlight');
  });
  expect(screen.getByText('Beskrivningsträff').parentElement)
    .toHaveTextContent('Inledning. Beskrivningsträff. Hela avslutningen.');
  expect(screen.getByText('Registerträff').parentElement)
    .toHaveTextContent('Första ämnet. Registerträff. Sista ämnet.');
});

test('samtliga sökutdrag markerar träffar utan att ersätta hela beskrivningen eller registerlänkarna', async () => {
  const contents = 'S787B: Präster. Kyrkobesök. S788A2: Kyrkoherde Holm. S793A: Präster.';
  await renderRecord({
    ...record(), contents, headwords: 'Inledning & register. Kyrkoherde. [[kort.jpg]] Präster. Slut.',
  }, '?q=kyrkoherde', {
    data: [{
      highlight: {
        contents: [
          'S788A2: <span class="highlight">Kyrkoherde</span> Holm.',
          'S793A: <span class="highlight">Präster</span>.',
        ],
        headwords: ['<span class="highlight">Kyrkoherde</span>'],
      },
    }],
  });
  const descriptionControl = screen.getByRole('button', { name: 'Beskrivning av innehållet (1)' });
  const description = document.getElementById(descriptionControl.getAttribute('aria-controls'));
  const markers = within(description).getAllByText('Präster');
  expect(markers).toHaveLength(2);
  markers.forEach((marker) => expect(marker).toHaveClass('highlight'));
  expect(within(description).getByText('Kyrkoherde').parentElement.textContent).toBe(contents);
  const indexControl = screen.getByRole('button', { name: 'Uppgifter från äldre innehållsregister (1)' });
  const index = document.getElementById(indexControl.getAttribute('aria-controls'));
  expect(index).toHaveTextContent('Inledning & register. Kyrkoherde. Visa indexkort Präster. Slut.');
  expect(within(index).getByRole('link', { name: 'Visa indexkort' }))
    .toHaveAttribute('href', 'https://www5.sprakochfolkminnen.se/Realkatalogen/kort.jpg');
});

test('stängt register hoppas över vid tabbnavigering och dess länk nås när det öppnas', async () => {
  const user = userEvent.setup();
  await renderRecord({ ...record([{ type: 'pdf', source: 'a.pdf' }]), headwords: '[[kort.jpg]]' });
  const control = screen.getByRole('button', { name: 'Uppgifter från äldre innehållsregister (1)' });
  const link = screen.getByText('Visa indexkort');
  expect(link).not.toBeVisible();
  control.focus();
  await user.tab();
  expect(screen.getByRole('link', { name: 'Ladda ner PDF' })).toHaveFocus();
  control.focus();
  await user.keyboard('{Enter}');
  await user.tab();
  expect(link).toBeVisible();
  expect(link).toHaveFocus();
});

test('avskriftsuppmaningen behåller status, lägesbeskrivning och startknapp', async () => {
  useTranscriptionAvailability.mockReturnValue(true);
  await renderRecord({
    ...record([
      {
        id: 'i1', type: 'image', source: 'a.jpg', transcriptionstatus: 'published',
      },
      {
        id: 'i2', type: 'image', source: 'b.jpg', transcriptionstatus: 'readytotranscribe',
      },
    ]),
    transcriptionstatus: 'readytotranscribe',
  });
  const prompt = screen.getByRole('region', { name: 'Hjälp till att skriva av' });
  expect(within(prompt).getByRole('heading', { level: 2, name: 'Hjälp till att skriva av' }))
    .not.toHaveClass('sr-only');
  expect(prompt).toHaveAccessibleDescription('1/2 sidor - 1 kvar');
  const progress = within(prompt).getByRole('progressbar', { name: 'sidor avskrivna' });
  expect(progress).toHaveAttribute('aria-valuenow', '1');
  expect(progress).toHaveAttribute('aria-valuemax', '2');
  expect(within(prompt).getByRole('button', { name: 'Skriv av sida för sida' })).toBeEnabled();
});

test('PDF och textnedladdning ligger tillsammans före läsaren med dekorativa ikoner', async () => {
  const data = record([
    { type: 'pdf', source: 'a.pdf' },
    {
      id: 'i1', type: 'image', source: 'a.jpg', text: '<p>Avskrift</p>',
    },
  ]);
  await renderRecord(data);
  const pdf = screen.getByRole('link', { name: 'Ladda ner PDF' });
  expect(pdf).toHaveAttribute('href', 'https://example.test/pdf/a.pdf');
  expect(pdf).toHaveAttribute('download');
  const textDownload = screen.getByRole('button', { name: 'Ladda ner text (.txt)' });
  expect(textDownload.parentElement).toBe(pdf.parentElement);
  expect(screen.getByRole('group', { name: 'Ladda ner material' })).toBe(pdf.parentElement);
  const header = screen.getByRole('article').querySelector('.container-header');
  const metadata = screen.getByRole('button', { name: 'Om accessioner och uppteckningar' }).closest('dl');
  expect(header.querySelector('dl')).toBeNull();
  const metadataGroup = screen.getByRole('region', { name: 'Metadata' });
  const contents = screen.getByRole('button', { name: 'Beskrivning av innehållet (1)' });
  const headwords = screen.getByRole('button', { name: 'Uppgifter från äldre innehållsregister (1)' });
  expect(contents.closest('dl')).toBe(metadata);
  expect(headwords.closest('dl')).toBe(metadata);
  expect(within(metadataGroup).getByRole('heading', { level: 2, name: 'Metadata' })).toBeVisible();
  expect(within(pdf.parentElement).queryByRole('heading')).not.toBeInTheDocument();
  expect(metadataGroup.nextElementSibling).toBe(pdf.parentElement);
  [pdf, textDownload].forEach((control) => {
    expect(control.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
    expect(control.querySelector('svg')).toHaveAttribute('focusable', 'false');
  });
  expect(Array.from(document.querySelectorAll('a, h2')).indexOf(pdf))
    .toBeLessThan(Array.from(document.querySelectorAll('a, h2'))
      .indexOf(screen.getByRole('heading', { name: 'Original och avskrift' })));
  expect(screen.queryByRole('link', { name: 'Personer', exact: true })).not.toBeInTheDocument();
  expect(screen.queryByRole('navigation', { name: 'På denna sida' })).not.toBeInTheDocument();
});

test('personuppgifter utan nedladdningsfiler ger ingen tom verktygsrad eller person-genväg', async () => {
  await renderRecord(record());
  expect(screen.getByRole('table', { name: 'Personer' })).toBeVisible();
  expect(screen.queryByRole('group', { name: 'Ladda ner material' })).not.toBeInTheDocument();
  expect(screen.queryByRole('link', { name: 'Personer', exact: true })).not.toBeInTheDocument();
});

test.each([
  ['bilder', [{
    id: 'i1', type: 'image', source: 'a.jpg', text: '<p>Avskrift</p>',
  }], ['Original och avskrift']],
  ['PDF', [{ type: 'pdf', source: 'a.pdf' }], ['Dokument (PDF)']],
  ['ljud', [{
    id: 'a1', type: 'audio', source: 'a.mp3', title: 'Inspelning A',
  }], ['Inspelningar']],
  ['blandade medier', [
    {
      id: 'a1', type: 'audio', source: 'a.mp3', title: 'Inspelning A',
    },
    { id: 'i1', source: 'a.jpg', text: '<p>Avskrift</p>' },
    { source: 'a.pdf' },
  ], ['Inspelningar', 'Original och avskrift']],
])('posten med %s grupperar metadata och läsare före de gemensamma avsnitten', async (name, media, headings) => {
  await renderRecord(record(media));
  const article = screen.getByRole('article');
  const layout = article.querySelector('.record-view-layout');
  const details = layout.querySelector('.record-view-details');
  const reader = layout.querySelector('.record-view-media');
  expect(details).toContainElement(screen.getByRole('region', { name: 'Metadata' }));
  expect(details.nextElementSibling).toBe(reader);
  expect(within(reader).getAllByRole('heading', { level: 2 }).map((heading) => heading.textContent))
    .toEqual(headings);
  expect(layout.nextElementSibling).toBe(screen.getByRole('region', { name: 'Personer' }));
  expect(layout).not.toContainElement(screen.getByRole('region', { name: 'Dela och använda materialet' }));
  expect(article.querySelector('footer').parentElement).toBe(layout.parentElement);
  if (media.some((item) => item.type === 'pdf' || item.source.endsWith('.pdf'))) {
    expect(details).toContainElement(screen.getByRole('link', { name: 'Ladda ner PDF' }));
  }
});

test('avskrivningshjälpen ligger efter metadata och nedladdning, före läsaren', async () => {
  useTranscriptionAvailability.mockReturnValue(true);
  await renderRecord({
    ...record([
      {
        id: 'i1', type: 'image', source: 'a.jpg', transcriptionstatus: 'readytotranscribe',
      },
      { type: 'pdf', source: 'a.pdf' },
    ]),
    transcriptionstatus: 'readytotranscribe',
  });
  const details = screen.getByRole('region', { name: 'Metadata' }).parentElement;
  const actions = screen.getByRole('group', { name: 'Ladda ner material' });
  const prompt = screen.getByRole('region', { name: 'Hjälp till att skriva av' });
  expect(details).toContainElement(actions);
  expect(actions.nextElementSibling).toBe(prompt);
  expect(details.nextElementSibling).toContainElement(screen.getByRole('region', { name: 'Originalbilder' }));
});

test('post utan medier har en tom läsargrupp och behåller metadata före Personer', async () => {
  await renderRecord(record());
  const layout = screen.getByRole('article').querySelector('.record-view-layout');
  expect(layout.querySelector('.record-view-media')).toBeEmptyDOMElement();
  expect(within(layout).getAllByRole('heading', { level: 2 }).map((heading) => heading.textContent))
    .toEqual(['Metadata']);
  expect(layout.nextElementSibling).toBe(screen.getByRole('region', { name: 'Personer' }));
});

test('PDF-visningens breddgräns behåller nedladdningslänken och öppna metadatapaneler', async () => {
  const listeners = new Set();
  const query = {
    matches: true,
    addEventListener: (event, listener) => listeners.add(listener),
    removeEventListener: (event, listener) => listeners.delete(listener),
  };
  window.matchMedia.mockReturnValue(query);
  const user = userEvent.setup();
  await renderRecord(record([{ type: 'pdf', source: 'a.pdf' }]));
  const download = screen.getByRole('link', { name: 'Ladda ner PDF' });
  const toggle = screen.getByRole('button', { name: 'Beskrivning av innehållet (1)' });
  const reader = screen.getByRole('region', { name: 'Dokument (PDF)' }).parentElement;
  await user.click(toggle);
  toggle.focus();
  act(() => {
    query.matches = false;
    listeners.forEach((listener) => listener({ matches: false }));
  });
  expect(reader).toBeEmptyDOMElement();
  expect(screen.getByRole('link', { name: 'Ladda ner PDF' })).toBe(download);
  expect(toggle).toHaveAttribute('aria-expanded', 'true');
  expect(toggle).toHaveFocus();
  act(() => {
    query.matches = true;
    listeners.forEach((listener) => listener({ matches: true }));
  });
  expect(reader).toContainElement(screen.getByRole('region', { name: 'Dokument (PDF)' }));
  expect(toggle).toHaveAttribute('aria-expanded', 'true');
  expect(toggle).toHaveFocus();
});

test('den sammansatta vyn har rätt rubriknivåer, tabellnamn och fungerande ARIA-referenser', async () => {
  const { container } = await renderRecord(record([
    {
      id: 'i1', type: 'image', source: 'a.jpg', text: '<p>Avskrift</p>',
    },
  ]));
  expect(screen.getAllByRole('main')).toHaveLength(1);
  expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
  const headings = screen.getAllByRole('heading', { level: 2 });
  expect(headings.map((heading) => heading.textContent)).toEqual([
    'Metadata', 'Original och avskrift', 'Personer', 'Dela och använda materialet',
    'Hjälp oss att förbättra informationen', 'Information till läsaren',
  ]);
  headings.forEach((heading) => expect(heading).toBeVisible());
  ['Länk till accessionen', 'Källhänvisning', 'Licens'].forEach((name) => {
    expect(screen.getByRole('heading', { level: 3, name })).toBeVisible();
  });
  expect(screen.getByRole('heading', { level: 3, name: 'Sida 1' })).toBeVisible();
  expect(screen.queryByRole('heading', { name: /Beskrivning av innehållet|Uppgifter från äldre/ }))
    .not.toBeInTheDocument();
  expect(screen.getByRole('table', { name: 'Personer' })).toBeVisible();
  expect(screen.queryByRole('table', { name: 'Orter' })).not.toBeInTheDocument();
  expect(screen.getByRole('textbox', { name: 'Källhänvisning' })).toBeVisible();
  expect(screen.getByRole('button', { name: 'Kopiera källhänvisning till urklipp' })).toBeVisible();
  expect(screen.getByRole('button', { name: 'Kopiera länk till urklipp' })).toBeVisible();
  const article = screen.getByRole('article', { name: 'Testuppteckning' });
  expect(article.querySelector('header')).toBeNull();
  const banner = screen.getByRole('banner');
  const main = screen.getByRole('main');
  expect(container.querySelectorAll('header')).toHaveLength(1);
  expect(banner.closest('main')).toBeNull();
  expect(banner.nextElementSibling).toBe(main);
  expect(main).toContainElement(article);
  expect(article.querySelector('footer').closest('article')).toBe(article);
  ['aria-labelledby', 'aria-describedby', 'aria-controls'].forEach((attribute) => {
    container.querySelectorAll(`[${attribute}]`).forEach((element) => {
      element.getAttribute(attribute).split(/\s+/).forEach((id) => {
        expect(document.getElementById(id)).not.toBeNull();
      });
    });
  });
});

test('en ort visas i metadata under sidhuvudet med söksammanhang och utan karta', async () => {
  const data = record();
  data.places[0].specification = 'Byn';
  data.places[0].location = { lat: 59.9, lon: 17.6 };
  await renderRecord(data, '?k=start&search=brev');
  const places = within(screen.getByText('Ort', { selector: 'dt' }).closest('dl'));
  expect(places.getByText('Ort', { exact: false }).tagName).toBe('DT');
  const link = places.getByRole('link', { name: 'Byn i Uppsala, Uppsala, Uppland' });
  expect(link.closest('dl')).not.toBeNull();
  expect(link).toHaveAttribute('href', '/places/l1?k=start&q=brev');
  expect(screen.queryByText('Karta')).not.toBeInTheDocument();
  expect(screen.queryByRole('region', { name: 'Orter' })).not.toBeInTheDocument();
});

test('en person med flera roller visas en gång i metadata och personförteckningen', async () => {
  const data = record();
  data.persons = [
    {
      id: 'p1', name: 'Anna', relation: 'informant', birth_year: 1875,
    },
    {
      id: 'p1', name: 'Anna', relation: 'author', birth_year: 1875,
    },
  ];
  await renderRecord(data, '?k=start');
  const metadata = within(screen.getByRole('button', { name: 'Om accessioner och uppteckningar' }).closest('dl'));
  expect(metadata.getByRole('link', { name: 'Anna' }).closest('li'))
    .toHaveTextContent('Anna (Informant, Författare)');
  const table = within(screen.getByRole('table', { name: 'Personer' }));
  expect(table.getAllByRole('row')).toHaveLength(2);
  expect(table.getByRole('cell', { name: 'Informant, Författare' })).toBeVisible();
  expect(table.getByRole('cell', { name: '1875' })).toBeVisible();
  expect(table.getByRole('link', { name: 'Anna' })).toHaveAttribute('href', '/persons/p1?k=start');
});

test('flera platser listas i metadata och saknade uppgifter ger inga tomma skiljetecken', async () => {
  const data = record();
  data.places = [
    { id: 'l1', name: 'Uppsala' },
    {
      id: 'l2', specification: 'Gården', name: 'Bergen', fylke: 'Vestland',
    },
  ];
  await renderRecord(data);
  const places = within(screen.getByText('Orter', { selector: 'dt' }).closest('dl'));
  expect(places.getByText('Orter', { exact: false }).tagName).toBe('DT');
  const list = places.getByRole('link', { name: 'Uppsala', exact: true }).closest('ul');
  expect(within(list).getAllByRole('listitem')).toHaveLength(2);
  expect(places.getByRole('link', { name: 'Uppsala', exact: true })).toHaveAttribute('href', '/places/l1');
  expect(places.getByRole('link', { name: 'Gården i Bergen, Vestland' })).toHaveAttribute('href', '/places/l2');
  expect(list).not.toHaveTextContent('undefined');
});

test('PDF-poster saknar tom bildläsare och flera filer får egna nedladdningsnamn', async () => {
  await renderRecord(record([
    { type: 'pdf', source: 'a.pdf', title: 'Del A' },
    { type: 'pdf', source: 'b.pdf', title: 'Del B' },
  ]));
  expect(screen.queryByRole('region', { name: /Original/ })).not.toBeInTheDocument();
  expect(screen.getByRole('region', { name: 'Dokument (PDF)' })).toBeVisible();
  expect(screen.getByRole('link', { name: 'Ladda ner PDF 1: Del A' })).toBeVisible();
  expect(screen.getByRole('link', { name: 'Ladda ner PDF 2: Del B' })).toBeVisible();
  expect(screen.queryByRole('button', { name: 'Ladda ner text (.txt)' })).not.toBeInTheDocument();
});

test('PDF-länken visas överst även när bildsidorna saknar avskrift', async () => {
  await renderRecord(record([
    { type: 'pdf', source: 'a.pdf' },
    { id: 'i1', type: 'image', source: 'a.jpg' },
  ]));
  const pdf = screen.getByRole('link', { name: 'Ladda ner PDF' });
  expect(pdf).toBeVisible();
  expect(screen.queryByRole('button', { name: 'Ladda ner text (.txt)' })).not.toBeInTheDocument();
  expect(Array.from(document.querySelectorAll('a, h2')).indexOf(pdf))
    .toBeLessThan(Array.from(document.querySelectorAll('a, h2'))
      .indexOf(screen.getByRole('heading', { name: 'Originalbilder' })));
});

test('tomma förteckningar och medieavsnitt renderas inte', async () => {
  await renderRecord({
    ...record(), persons: [], places: [], contents: '', headwords: '',
  });
  expect(screen.queryByRole('navigation', { name: 'På denna sida' })).not.toBeInTheDocument();
  expect(screen.queryByRole('term', { name: /Ort/ })).not.toBeInTheDocument();
  expect(screen.queryByRole('link', { name: 'Uppsala' })).not.toBeInTheDocument();
  expect(screen.queryByRole('heading', { name: /Beskrivning av innehållet|Uppgifter från äldre/ }))
    .not.toBeInTheDocument();
  const header = screen.getByRole('article').querySelector('.container-header');
  expect(within(header).queryByText(/^Person(?:er)?:/)).not.toBeInTheDocument();
  ['Personer', 'Orter', 'Original och avskrift', 'Originalbilder', 'Inspelningar', 'Dokument (PDF)'].forEach((name) => {
    expect(screen.queryByRole('region', { name })).not.toBeInTheDocument();
  });
});

test('ljudposten behåller tabell och uppspelningsfunktion', async () => {
  const user = userEvent.setup();
  const { playAudio } = await renderRecord(record([
    {
      id: 'a1', type: 'audio', source: 'a.mp3', title: 'Inspelning A',
    },
  ]));
  expect(screen.getByRole('region', { name: 'Inspelningar' })).toBeVisible();
  expect(screen.getByRole('table', { name: 'Inspelningar' })).toBeVisible();
  expect(screen.getByRole('columnheader', { name: 'Titel' })).toBeInTheDocument();
  expect(screen.getByRole('heading', { level: 3, name: 'Inspelning A' })).toBeVisible();
  const playButton = screen.getByRole('button', { name: 'Spela upp' });
  await user.click(playButton);
  expect(playAudio).toHaveBeenCalledWith(expect.objectContaining({
    audio: expect.objectContaining({ source: 'a.mp3' }),
  }));
  const viewport = jest.replaceProperty(window, 'innerWidth', 1920);
  [390, 1024, 1439, 1440, 1920].forEach((width) => {
    viewport.replaceValue(width);
    act(() => window.dispatchEvent(new window.Event('resize')));
    expect(screen.getByRole('button', { name: 'Spela upp' })).toBe(playButton);
    expect(playButton).toHaveFocus();
    expect(playAudio).toHaveBeenCalledTimes(1);
  });
});

test('inspelningar utan titel får numrerade rubriker', async () => {
  await renderRecord(record([
    { id: 'a1', type: 'audio', source: 'a.mp3' },
    {
      id: 'a2', type: 'audio', source: 'b.mp3', title: ' ',
    },
  ]));
  ['Inspelning 1', 'Inspelning 2'].forEach((name) => {
    expect(screen.getByRole('heading', { level: 3, name })).toBeVisible();
  });
});

test('utfällda ljudbeskrivningar och redigeringsformulär har H4 under inspelningens H3', async () => {
  config.activateAudioDescription = true;
  global.fetch = jest.fn(async () => ({
    ok: true,
    json: async () => ({ data: { transcribesession: 'session-a' }, hits: { hits: [] } }),
  }));
  const user = userEvent.setup();
  await renderRecord({
    ...record([{
      id: 'a1',
      type: 'audio',
      source: 'a.mp3',
      title: 'Inspelning A',
      description: [{ start: '00:00', text: 'En berättelse', terms: [] }],
    }]),
    transcriptiontype: 'audio',
  });
  const toggle = screen.getByRole('button', { name: 'Visa Innehåll (1)' });
  toggle.focus();
  await user.keyboard('{Enter}');
  expect(screen.getByRole('heading', { level: 4, name: 'Innehållsbeskrivningar' })).toBeVisible();
  expect(screen.getByRole('table', { name: 'Innehållsbeskrivningar' })).toBeVisible();
  expect(toggle).toHaveFocus();
  await user.click(screen.getByRole('button', { name: 'Ändra' }));
  expect(screen.getByRole('heading', { level: 4, name: 'Redigera beskrivning' })).toBeVisible();
  const form = screen.getByRole('form', { name: 'Redigera beskrivning' });
  expect(form).toBeVisible();
  const description = within(form).getByRole('textbox', { name: 'Beskrivning *' });
  await user.clear(description);
  await user.type(description, 'En ändrad beskrivning');
  const viewport = jest.replaceProperty(window, 'innerWidth', 1920);
  [390, 1024, 1439, 1440, 1920].forEach((width) => {
    viewport.replaceValue(width);
    act(() => window.dispatchEvent(new window.Event('resize')));
    expect(screen.getByRole('form', { name: 'Redigera beskrivning' })).toBe(form);
    expect(description).toHaveValue('En ändrad beskrivning');
    expect(description).toHaveFocus();
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
  });
});
