/* global beforeEach, expect, test */
import {
  render, screen, waitFor, within,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ImageOverlay from '../../features/RecordTextPanel/ui/ImageOverlay';
import RecordTextPanel from '../../features/RecordTextPanel/RecordTextPanel';

function createEventBus() {
  const listeners = new Map();

  return {
    addEventListener(name, listener) {
      const handlers = listeners.get(name) || new Set();
      handlers.add(listener);
      listeners.set(name, handlers);
    },
    removeEventListener(name, listener) {
      listeners.get(name)?.delete(listener);
    },
    dispatch(name, detail = {}) {
      listeners.get(name)?.forEach((listener) => listener({ detail }));
    },
  };
}

beforeEach(() => {
  window.eventBus = createEventBus();
});

test.each(['bildlistan', 'miniatyröversikten'])('bildvisaren återställer fokus till öppnaren i %s', async (source) => {
  const user = userEvent.setup();
  render(
    <>
      <RecordTextPanel
        data={{
          id: 'focus-record',
          title: 'Fokustest',
          transcriptionstatus: 'published',
          media: [
            { id: 'image-a', source: 'bild-a.jpg', type: 'image' },
            { id: 'image-b', source: 'bild-b.jpg', type: 'image' },
          ],
        }}
        mediaImageClickHandler={(item, mediaList, currentIndex) => window.eventBus.dispatch('overlay.viewimage', {
          imageUrl: item.source, type: item.type, mediaList, currentIndex,
        })}
      />
      <ImageOverlay />
    </>,
  );
  let reader = within(screen.getByRole('region', { name: 'Originalbilder' }));
  if (source === 'miniatyröversikten') {
    const overview = reader.getByRole('button', { name: 'Visa sidöversikt (2)' });
    await user.click(overview);
    reader = within(document.getElementById(overview.getAttribute('aria-controls')));
  }
  const opener = reader.getByRole('button', { name: 'Öppna större bild av sida 2' });
  opener.focus();
  await user.keyboard('{Enter}');
  expect(await screen.findByRole('dialog', { name: 'Bildvisning: 2 / 2' })).toBeVisible();
  await waitFor(() => expect(screen.getByRole('button', { name: 'Stäng bildvisning' })).toHaveFocus());
  await user.keyboard('{Escape}');
  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  expect(opener).toHaveFocus();
});

test('bildvisarens stängknapp fungerar med tangentbord och återställer öppnaren', async () => {
  const user = userEvent.setup();
  render(
    <>
      <button
        type="button"
        onClick={() => window.eventBus.dispatch('overlay.viewimage', {
          imageUrl: 'bild.jpg',
          type: 'image',
          mediaList: [{ source: 'bild.jpg', type: 'image', text: 'Testbild' }],
          currentIndex: 0,
        })}
      >
        Öppna bild
      </button>
      <ImageOverlay />
    </>,
  );
  const opener = screen.getByRole('button', { name: 'Öppna bild' });

  opener.focus();
  await user.keyboard('{Enter}');

  expect(await screen.findByRole('dialog', { name: 'Bildvisning: 1 / 1' })).toBeInTheDocument();
  const closeButton = screen.getByRole('button', { name: 'Stäng bildvisning' });
  await waitFor(() => expect(closeButton).toHaveFocus());
  expect(closeButton).toHaveClass(
    'modal-initial-focus-visible',
    'modal-initial-focus-visible--on-dark',
  );

  await user.keyboard('{Enter}');
  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  expect(opener).toHaveFocus();

  await user.keyboard(' ');
  const reopenedCloseButton = await screen.findByRole('button', { name: 'Stäng bildvisning' });
  await waitFor(() => expect(reopenedCloseButton).toHaveFocus());
  await user.keyboard(' ');

  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  expect(opener).toHaveFocus();
});
