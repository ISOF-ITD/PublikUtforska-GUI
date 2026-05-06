export function isAudioMedia(mediaItem) {
  const source = mediaItem?.source?.toLowerCase() ?? '';

  return mediaItem?.type === 'audio' || source.endsWith('.mp3');
}

export function isImageMedia(mediaItem) {
  const source = mediaItem?.source ?? '';

  return mediaItem?.type === 'image' || /\.(jpe?g|png|gif|webp)$/i.test(source);
}

export function isPdfMedia(mediaItem) {
  const source = mediaItem?.source?.toLowerCase() ?? '';

  return mediaItem?.type === 'pdf' || source.endsWith('.pdf');
}

// Returns the primary media type for a record based on its media items,
// with priority: audio > image > pdf.
export function pickPrimaryMediaType(media = []) {
  if (!Array.isArray(media) || media.length === 0) return null;

  if (media.some(isAudioMedia)) return 'audio';
  if (media.some(isImageMedia)) return 'image';
  if (media.some(isPdfMedia)) return 'pdf';

  return null;
}
