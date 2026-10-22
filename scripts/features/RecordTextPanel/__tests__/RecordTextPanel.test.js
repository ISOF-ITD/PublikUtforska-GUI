/* global beforeEach, afterEach, expect, jest, test */
import {
  act, render, screen, waitFor, within,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import config from '../../../config';
import useTranscriptionAvailability from '../../../hooks/useTranscriptionAvailability';
import RecordTextPanel from '../RecordTextPanel';
import RecordViewActions from '../../RecordView/ui/RecordViewActions';

jest.mock('../../../config', () => ({ imageUrl: 'https://example.test/images/', activateTranscription: true }));
jest.mock('../../../lang/Lang', () => ({ l: (value) => value }));
jest.mock('../../../hooks/useTranscriptionAvailability', () => jest.fn(() => true));
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
  config.activateTranscription = true;
  useTranscriptionAvailability.mockReturnValue(true);
  Element.prototype.scrollIntoView = jest.fn();
});
afterEach(() => jest.restoreAllMocks());

test('sidmål utan segment fokuseras en gång och vanliga omrenderingar behåller användarens fokus', async () => {
  const data = makeRecord(3);
  const { rerender } = render(
    <RecordTextPanel data={data} mediaImageClickHandler={jest.fn()} targetPageIndex={1} navigationKey="first" />,
  );
  const target = screen.getByRole('heading', { name: 'Sida 2', level: 3 });
  await waitFor(() => expect(target).toHaveFocus());
  const scheduleFrame = jest.spyOn(window, 'requestAnimationFrame');
  const overview = screen.getByRole('button', { name: 'Visa sidöversikt (3)' });
  overview.focus();
  rerender(<RecordTextPanel data={{ ...data }} mediaImageClickHandler={jest.fn()} targetPageIndex={1} navigationKey="first" />);
  expect(overview).toHaveFocus();
  expect(scheduleFrame).not.toHaveBeenCalled();
  expect(Element.prototype.scrollIntoView).toHaveBeenCalledTimes(1);
});

test('nya sidmål och avmontering avregistrerar väntande animeringsramar', () => {
  const frames = new Map();
  let frameId = 0;
  jest.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
    frameId += 1;
    frames.set(frameId, callback);
    return frameId;
  });
  jest.spyOn(window, 'cancelAnimationFrame').mockImplementation((id) => frames.delete(id));
  const nextFrame = () => {
    const callbacks = [...frames.values()];
    frames.clear();
    act(() => callbacks.forEach((callback) => callback()));
  };
  const data = makeRecord(3);
  const { rerender, unmount } = render(
    <RecordTextPanel data={data} mediaImageClickHandler={jest.fn()} targetPageIndex={0} navigationKey="first" />,
  );
  nextFrame();
  expect(Element.prototype.scrollIntoView).not.toHaveBeenCalled();
  rerender(<RecordTextPanel data={data} mediaImageClickHandler={jest.fn()} targetPageIndex={2} navigationKey="second" />);
  nextFrame();
  expect(Element.prototype.scrollIntoView).not.toHaveBeenCalled();
  nextFrame();
  expect(screen.getByRole('heading', { name: 'Sida 3', level: 3 })).toHaveFocus();
  expect(Element.prototype.scrollIntoView).toHaveBeenCalledTimes(1);
  rerender(<RecordTextPanel data={data} mediaImageClickHandler={jest.fn()} targetPageIndex={1} navigationKey="third" />);
  unmount();
  expect(frames.size).toBe(0);
  nextFrame();
  expect(Element.prototype.scrollIntoView).toHaveBeenCalledTimes(1);
});

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

test('en bildsida som inte kan skrivas av behåller avskriften och lämnar andra sidor öppna för avskrift', () => {
  const data = makeRecord(2);
  data.transcriptionstatus = 'readytotranscribe';
  data.media[0].transcriptionstatus = 'needsimprovement';
  data.media[1].transcriptionstatus = 'readytotranscribe';
  render(<RecordTextPanel data={data} mediaImageClickHandler={jest.fn()} />);
  expect(screen.queryByText('Den här sidan kan inte skrivas av just nu.')).not.toBeInTheDocument();
  expect(screen.getByText('Avskrift 1')).toBeVisible();
  expect(screen.getByRole('button', { name: 'Skriv av' })).toHaveAttribute('data-page', '1');
  expect(screen.getByTitle('Kan inte skrivas av')).toBeInTheDocument();
});

test.each(['published', 'transcribed', 'needsimprovement'])(
  'synlig avskrift med sidstatus %s visas utan spärrmeddelande även på en spärrad accession',
  (transcriptionstatus) => {
    const data = makeRecord(1);
    data.transcriptionstatus = 'needsimprovement';
    data.media[0].transcriptionstatus = transcriptionstatus;
    data.media[0].transcribedby = 'Anna';
    data.media[0].transcriptiondate = '2026-10-07';
    data.media[0].comment = 'Kommentar till avskriften';
    render(<RecordTextPanel data={data} mediaImageClickHandler={jest.fn()} />);
    expect(screen.getByText('Avskrift 1')).toBeVisible();
    expect(screen.getByText('Anna')).toBeVisible();
    expect(screen.getByText('2026-10-07')).toBeVisible();
    expect(screen.getByText('Kommentar till avskriften')).toBeVisible();
    expect(screen.queryByText('Den här sidan kan inte skrivas av just nu.')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Skriv av' })).not.toBeInTheDocument();
    expect(screen.getByTitle('Kan inte skrivas av')).toBeInTheDocument();
  },
);

test.each([
  [false, true],
  [true, false],
  [false, false],
])('spärrmeddelandet döljs när avskrivning inte erbjuds (aktiverad: %s, tillräcklig skärmbredd: %s)', (activated, available) => {
  config.activateTranscription = activated;
  useTranscriptionAvailability.mockReturnValue(available);
  const data = makeRecord(1);
  data.transcriptionstatus = 'needsimprovement';
  data.media[0].transcriptionstatus = 'readytotranscribe';
  render(<RecordTextPanel data={data} mediaImageClickHandler={jest.fn()} />);
  expect(screen.queryByText('Den här sidan kan inte skrivas av just nu.')).not.toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Skriv av' })).not.toBeInTheDocument();
  expect(screen.queryByText('Avskrift 1')).not.toBeInTheDocument();
});

test.each(['readytotranscribe', 'needsimprovement'])(
  'sidans egen needsimprovement-status ger inget knappmeddelande (accession: %s)',
  (transcriptionstatus) => {
    const data = makeRecord(1);
    data.transcriptionstatus = transcriptionstatus;
    data.media[0].transcriptionstatus = 'needsimprovement';
    data.media[0].text = '';
    render(<RecordTextPanel data={data} mediaImageClickHandler={jest.fn()} />);
    expect(screen.queryByText('Den här sidan kan inte skrivas av just nu.')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Skriv av' })).not.toBeInTheDocument();
    expect(screen.getByTitle('Kan inte skrivas av')).toBeInTheDocument();
  },
);

test('en tillåten redo-sida behåller avskrivningsknappen', () => {
  const data = makeRecord(1);
  data.transcriptionstatus = 'readytotranscribe';
  data.media[0].transcriptionstatus = 'readytotranscribe';
  render(<RecordTextPanel data={data} mediaImageClickHandler={jest.fn()} />);
  expect(screen.getByRole('button', { name: 'Skriv av' })).toBeEnabled();
  expect(screen.queryByText('Den här sidan kan inte skrivas av just nu.')).not.toBeInTheDocument();
});

test.each([false, true])('spärrad accession visar inte text eller bidragsuppgifter på redo-sidor (segment: %s)', async (withSegments) => {
  const user = userEvent.setup();
  const openImage = jest.fn();
  const data = makeRecord(2);
  data.transcriptionstatus = 'needsimprovement';
  data.media = data.media.map((item) => ({
    ...item,
    transcriptionstatus: 'readytotranscribe',
    transcribedby: 'Sidans bidragsgivare',
    transcriptiondate: '2026-10-07',
    comment: 'Sidans kommentar',
  }));
  if (withSegments) data.segments = [{ id: 'segment-a', start_media_id: 'image-0' }];
  render(<RecordTextPanel data={data} mediaImageClickHandler={openImage} />);

  expect(screen.getByRole('heading', { level: 2, name: 'Originalbilder' })).toBeVisible();
  expect(screen.queryByText(/^Avskrift \d+$/)).not.toBeInTheDocument();
  expect(screen.queryByText('Sidans bidragsgivare')).not.toBeInTheDocument();
  expect(screen.queryByText('Sidans kommentar')).not.toBeInTheDocument();
  expect(screen.queryByText('2026-10-07')).not.toBeInTheDocument();
  expect(screen.getAllByText('Den här sidan kan inte skrivas av just nu.')).toHaveLength(2);
  expect(screen.queryByRole('button', { name: 'Skriv av' })).not.toBeInTheDocument();
  expect(screen.queryByText(/kan skrivas av/)).not.toBeInTheDocument();
  if (withSegments) {
    const segment = screen.getByRole('button', { name: /Sidor 1–2/ });
    expect(within(segment).getByTitle('Kan inte skrivas av')).toBeVisible();
  }

  const overview = screen.getByRole('button', { name: 'Visa sidöversikt (2)' });
  await user.click(overview);
  const thumbnails = within(document.getElementById(overview.getAttribute('aria-controls')));
  expect(thumbnails.getAllByTitle('Kan inte skrivas av')).toHaveLength(2);
  await user.click(thumbnails.getByRole('button', { name: 'Öppna större bild av sida 1' }));
  expect(openImage.mock.lastCall[0]).toBe(data.media[0]);
  expect(openImage.mock.lastCall[1][0].transcriptionstatus).toBe('readytotranscribe');
});

test('spärrad accession med blandade sidor visar och exporterar bara den redan synliga texten', async () => {
  const user = userEvent.setup();
  const data = makeRecord(2);
  data.transcriptionstatus = 'needsimprovement';
  data.media[0].transcriptionstatus = 'readytotranscribe';
  data.media[0].transcribedby = 'Dold bidragsgivare';
  data.media[1].transcribedby = 'Synlig bidragsgivare';
  let downloaded;
  URL.createObjectURL = jest.fn((blob) => { downloaded = blob; return 'blob:export'; });
  URL.revokeObjectURL = jest.fn();
  jest.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
  render(
    <>
      <RecordViewActions data={data} />
      <RecordTextPanel data={data} mediaImageClickHandler={jest.fn()} />
    </>,
  );

  expect(screen.getByRole('heading', { level: 2, name: 'Original och avskrift' })).toBeVisible();
  expect(screen.queryByText('Avskrift 1')).not.toBeInTheDocument();
  expect(screen.queryByText('Dold bidragsgivare')).not.toBeInTheDocument();
  expect(screen.getByText('Avskrift 2')).toBeVisible();
  expect(screen.getByText('Synlig bidragsgivare')).toBeVisible();
  expect(screen.getAllByText('Den här sidan kan inte skrivas av just nu.')).toHaveLength(1);
  expect(screen.queryByRole('button', { name: 'Skriv av' })).not.toBeInTheDocument();

  await user.click(screen.getByRole('button', { name: 'Ladda ner text (.txt)' }));
  const exportedText = await new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.readAsText(downloaded);
  });
  expect(exportedText).toContain('Avskrift 2');
  expect(exportedText).not.toContain('Avskrift 1');
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

test.each([undefined, null, '', '  \n\t ', 'None', '  None  '])(
  'döljer tom sidkommentar (%p) och bidragsblock när bidragsgivare saknas',
  (comment) => {
    const data = makeRecord(1);
    data.media[0].comment = comment;
    data.media[0].transcriptiondate = '2026-10-07';
    const { container } = render(
      <RecordTextPanel data={data} mediaImageClickHandler={jest.fn()} />,
    );
    expect(screen.queryByText('Kommentarer', { selector: 'dt' })).not.toBeInTheDocument();
    expect(screen.queryByText('None')).not.toBeInTheDocument();
    expect(container.querySelector('dl')).toBeNull();
    expect(screen.getByText('Avskrift 1')).toBeVisible();
  },
);

test.each([undefined, null, '', '  \n\t ', 'None', '  None  '])(
  'döljer tom sidkommentar (%p) men behåller bidragsgivare och datum',
  (comment) => {
    const data = makeRecord(1);
    data.media[0].comment = comment;
    data.media[0].transcribedby = 'Anna';
    data.media[0].transcriptiondate = '2026-10-07';
    render(<RecordTextPanel data={data} mediaImageClickHandler={jest.fn()} />);
    expect(screen.queryByText('Kommentarer', { selector: 'dt' })).not.toBeInTheDocument();
    expect(screen.queryByText('None')).not.toBeInTheDocument();
    expect(screen.getByText('Bidrag av', { selector: 'dt' })).toBeVisible();
    expect(screen.getByText('Anna')).toBeVisible();
    expect(screen.getByText('Datum', { selector: 'dt' })).toBeVisible();
    expect(screen.getByText('2026-10-07')).toBeVisible();
  },
);

test('visar riktig sidkommentar utan bidragsgivare även om texten innehåller None', () => {
  const data = makeRecord(1);
  data.media[0].comment = 'Ordet None förekommer i originalet.';
  render(<RecordTextPanel data={data} mediaImageClickHandler={jest.fn()} />);
  expect(screen.getByText('Kommentarer', { selector: 'dt' })).toBeVisible();
  expect(screen.getByText('Ordet None förekommer i originalet.')).toBeVisible();
  expect(screen.queryByText('Bidrag av', { selector: 'dt' })).not.toBeInTheDocument();
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
