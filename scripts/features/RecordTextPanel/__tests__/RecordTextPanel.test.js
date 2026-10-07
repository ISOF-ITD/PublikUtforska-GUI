/* global beforeEach, afterEach, expect, jest, test */
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import RecordTextPanel from '../RecordTextPanel';
import RecordViewActions from '../../RecordView/ui/RecordViewActions';

jest.mock('../../../config', () => ({ imageUrl: 'https://example.test/images/' }));
jest.mock('../../../lang/Lang', () => ({ l: (value) => value }));
jest.mock('../../../hooks/useTranscriptionAvailability', () => () => true);
jest.mock('../../TranscriptionPageByPageOverlay/ui/TranscribeButton', () => {
  const PropTypes = jest.requireActual('prop-types');
  function TranscribeButton({ initialPageIndex, initialPageSource }) {
    return <button type="button" data-page={initialPageIndex} data-source={initialPageSource}>Skriv av</button>;
  }
  TranscribeButton.propTypes = {
    initialPageIndex: PropTypes.number.isRequired,
    initialPageSource: PropTypes.string.isRequired,
  };
  return TranscribeButton;
});

function makeRecord(count = 63) {
  return {
    id: 'record-a',
    title: 'Uppteckningen',
    transcriptionstatus: 'published',
    media: Array.from({ length: count }, (_, index) => ({
      id: `image-${index}`,
      type: 'image',
      source: `image-${index}.jpg`,
      text: `<p>Avskrift ${index + 1}</p>`,
      transcriptionstatus: 'published',
    })),
  };
}

beforeEach(() => {
  Element.prototype.scrollIntoView = jest.fn();
});
afterEach(() => jest.restoreAllMocks());

test('visar alla 63 bilder och avskrifter i ordning utan sidvalskontroller', () => {
  render(<RecordTextPanel data={makeRecord()} mediaImageClickHandler={jest.fn()} />);
  expect(screen.getAllByRole('img').map((image) => image.getAttribute('src')))
    .toEqual(makeRecord().media.map((item) => `https://example.test/images/${item.source}`));
  expect(screen.getAllByText(/^Avskrift \d+$/).map((text) => text.textContent))
    .toEqual(Array.from({ length: 63 }, (_, index) => `Avskrift ${index + 1}`));
  expect(screen.getByRole('heading', { name: 'Sida 63', level: 3 })).toBeVisible();
  expect(screen.queryByRole('heading', { name: /Alla sidor/ })).not.toBeInTheDocument();
  expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
  ['Föregående sida', 'Nästa sida', 'Visa alla sidor', 'Visa en sida i taget'].forEach((name) => {
    expect(screen.queryByRole('button', { name })).not.toBeInTheDocument();
  });
});

test('stängd sidöversikt laddar fler miniatyrer och öppnar rätt större bild', async () => {
  const user = userEvent.setup();
  const openImage = jest.fn();
  render(<RecordTextPanel data={makeRecord()} mediaImageClickHandler={openImage} />);
  const overview = screen.getByRole('button', { name: 'Visa sidöversikt (63)' });
  expect(document.getElementById(overview.getAttribute('aria-controls'))).not.toBeVisible();
  expect(overview.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
  overview.focus();
  await user.keyboard('{Enter}');
  expect(overview).toHaveAttribute('aria-expanded', 'true');
  expect(overview).toHaveFocus();
  await user.click(screen.getByRole('button', { name: 'Visa fler (39 kvar)' }));
  const panel = within(document.getElementById(overview.getAttribute('aria-controls')));
  await user.click(panel.getByRole('button', { name: 'Öppna större bild av sida 30' }));
  expect(openImage).toHaveBeenCalledWith(expect.objectContaining({ id: 'image-29' }), expect.any(Array), 29);
  const closeOverview = screen.getByRole('button', { name: 'Dölj sidöversikt (63)' });
  closeOverview.focus();
  await user.keyboard(' ');
  expect(closeOverview).toHaveAttribute('aria-expanded', 'false');
  expect(closeOverview).toHaveFocus();
  expect(document.getElementById(overview.getAttribute('aria-controls'))).not.toBeVisible();
  expect(screen.getAllByRole('img')).toHaveLength(63);
});

test('sökträffens ursprungliga medieindex fungerar även mellan PDF, ljud och bilder', async () => {
  const user = userEvent.setup();
  const data = makeRecord(3);
  data.media.splice(0, 0, { type: 'pdf', source: 'a.pdf' });
  data.media.splice(2, 0, { type: 'audio', source: 'a.mp3' });
  data.segments = [
    { id: 'segment-a', start_media_id: 'image-0' },
    { id: 'segment-b', start_media_id: 'image-1' },
  ];
  const highlightData = {
    data: [{
      inner_hits: {
        media: {
          hits: {
            hits: [{
              _nested: { offset: 3 }, highlight: { 'media.text': ['<p>Markerad <em>träff</em></p>'] },
            }],
          },
        },
      },
    }],
  };
  render(
    <RecordTextPanel
      data={data}
      highlightData={highlightData}
      mediaImageClickHandler={jest.fn()}
    />,
  );
  expect(screen.getAllByRole('img')).toHaveLength(3);
  expect(screen.getByText('Avskrift 1')).toBeVisible();
  expect(screen.getByText('Avskrift 3')).toBeVisible();
  expect(screen.getByText('träff').tagName).toBe('EM');
  await user.click(screen.getByRole('checkbox', { name: 'Markera träffar' }));
  expect(screen.getByText('Avskrift 2')).toBeVisible();
  expect(screen.getByText('Avskrift 1')).toBeVisible();
});

test('alla segment är öppna och behåller personer och avskriftsstart för rätt bild', async () => {
  const user = userEvent.setup();
  const data = makeRecord(3);
  data.persons = [{ id: 'person-a', name: 'Anna' }, { id: 'person-b', name: 'Bertil' }];
  data.segments = [
    { id: 'segment-a', start_media_id: 'image-0', person_ids: ['person-a'] },
    { id: 'segment-b', start_media_id: 'image-1', person_ids: ['person-b'] },
  ];
  data.media[1].transcriptionstatus = 'readytotranscribe';
  render(<RecordTextPanel data={data} mediaImageClickHandler={jest.fn()} />);
  expect(screen.getByText('Anna')).toBeVisible();
  expect(screen.getByText('Bertil')).toBeVisible();
  expect(screen.getByRole('button', { name: 'Skriv av' })).toHaveAttribute('data-page', '1');
  expect(screen.getByRole('button', { name: 'Skriv av' })).toHaveAttribute('data-source', 'image-1.jpg');
  const segment = screen.getAllByRole('button').find((button) => (
    button.hasAttribute('aria-expanded') && button.textContent.includes('Sidor 2')
  ));
  await user.click(segment);
  expect(document.getElementById(segment.getAttribute('aria-controls'))).not.toBeVisible();
  expect(segment).toHaveFocus();
  expect(screen.queryByRole('button', { name: 'Skriv av' })).not.toBeInTheDocument();
  await user.keyboard('{Enter}');
  expect(screen.getByRole('button', { name: 'Skriv av' })).toBeVisible();
});

test('postbyte återställer segment och miniatyröversikt', async () => {
  const user = userEvent.setup();
  const openImage = jest.fn();
  const data = makeRecord();
  data.segments = [{ id: 'segment-a', start_media_id: 'image-0' }];
  const { rerender } = render(
    <RecordTextPanel data={data} mediaImageClickHandler={openImage} />,
  );
  await user.click(screen.getByRole('button', { name: /Sidor 1.*Dölj/ }));
  await user.click(screen.getByRole('button', { name: 'Visa sidöversikt (63)' }));
  const next = { ...makeRecord(2), id: 'record-b' };
  rerender(<RecordTextPanel data={next} mediaImageClickHandler={openImage} />);
  expect(screen.getAllByRole('img')).toHaveLength(2);
  expect(screen.getByRole('button', { name: 'Visa sidöversikt (2)' }))
    .toHaveAttribute('aria-expanded', 'false');
});

test('en sida saknar navigeringskontroller och tomma bildposter saknar läsare', () => {
  const { rerender } = render(
    <RecordTextPanel data={makeRecord(1)} mediaImageClickHandler={jest.fn()} />,
  );
  expect(screen.getByRole('heading', { level: 3, name: 'Sida 1' })).toBeVisible();
  expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Visa alla sidor' })).not.toBeInTheDocument();
  rerender(<RecordTextPanel data={makeRecord(0)} mediaImageClickHandler={jest.fn()} />);
  expect(screen.queryByRole('region', { name: /Original/ })).not.toBeInTheDocument();
});

test('export omfattar hela uppteckningen och rätt personer även när en sida saknar avskrift', async () => {
  const user = userEvent.setup();
  const data = makeRecord();
  data.media[0].text = '';
  data.persons = [{ id: 'person-a', name: 'Anna' }, { id: 'person-b', name: 'Bertil' }];
  data.segments = [
    { id: 'segment-a', start_media_id: 'image-0', person_ids: ['person-a'] },
    { id: 'segment-b', start_media_id: 'image-1', person_ids: ['person-b'] },
  ];
  let downloaded;
  URL.createObjectURL = jest.fn((blob) => { downloaded = blob; return 'blob:export'; });
  URL.revokeObjectURL = jest.fn();
  jest.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
  render(<RecordViewActions data={data} />);
  await user.click(screen.getByRole('button', { name: 'Ladda ner text (.txt)' }));
  const result = await new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.readAsText(downloaded);
  });
  expect(result).toContain('Avskrift 2');
  expect(result).toContain('Avskrift 63');
  expect(result).toContain('Personer: Bertil');
  expect(result).not.toContain('Personer: Anna');
});

test('bildknappar innehåller giltigt inlineinnehåll och avskriften saknar aria-expanded', () => {
  const { container } = render(
    <RecordTextPanel data={makeRecord(1)} mediaImageClickHandler={jest.fn()} />,
  );
  expect(container.querySelector('button div, button ul, button p')).toBeNull();
  const text = within(screen.getByRole('region', { name: 'Original och avskrift' })).getByText('Avskrift 1');
  expect(text.parentElement)
    .not.toHaveAttribute('aria-expanded');
});

test('rubriken skiljer originalbilder från bilder med synlig avskrift', () => {
  const data = makeRecord(2);
  data.media = data.media.map((item) => ({ ...item, transcriptionstatus: 'readytotranscribe' }));
  const { rerender } = render(
    <RecordTextPanel data={data} mediaImageClickHandler={jest.fn()} />,
  );
  expect(screen.getByRole('heading', { level: 2, name: 'Originalbilder' })).toBeVisible();
  const transcribed = {
    ...data,
    media: data.media.map((item, index) => (
      index === 0 ? { ...item, transcriptionstatus: 'published' } : item
    )),
  };
  rerender(<RecordTextPanel data={transcribed} mediaImageClickHandler={jest.fn()} />);
  expect(screen.getByRole('heading', { level: 2, name: 'Original och avskrift' })).toBeVisible();
  expect(screen.queryByRole('heading', { name: 'Originalbilder' })).not.toBeInTheDocument();
});

test('avskriftsbidrag och kommentarer är definitionslistor på sida och accession', () => {
  const data = makeRecord(1);
  data.transcribedby = 'Anna';
  data.transcriptiondate = '2026-10-07';
  data.comment = 'Kommentar om accessionen';
  data.media[0].comment = 'Kommentar om sidan';
  const { container } = render(
    <RecordTextPanel data={data} mediaImageClickHandler={jest.fn()} />,
  );
  ['Bidrag av', 'Datum', 'Kommentarer'].forEach((label) => {
    const terms = screen.getAllByText(label, { selector: 'dt' });
    expect(terms).toHaveLength(2);
    terms.forEach((term) => {
      expect(term.closest('dl')).not.toBeNull();
      expect(term.nextElementSibling.tagName).toBe('DD');
    });
    expect(screen.queryByRole('heading', { name: label })).not.toBeInTheDocument();
  });
  expect(screen.getByText('Kommentar om sidan')).toBeVisible();
  expect(screen.getByText('Kommentar om accessionen')).toBeVisible();
  expect(container.querySelector('dt h3')).toBeNull();
});

test('visningen behåller sidor före första segmentet och deras rubriknivåer', () => {
  const data = makeRecord(4);
  data.segments = [{ id: 'segment-a', start_media_id: 'image-2' }];
  render(<RecordTextPanel data={data} mediaImageClickHandler={jest.fn()} />);
  expect(screen.getAllByRole('img')).toHaveLength(4);
  [1, 2, 3, 4].forEach((page) => {
    expect(screen.getByRole('heading', { level: 4, name: `Sida ${page}` })).toBeVisible();
  });
});
