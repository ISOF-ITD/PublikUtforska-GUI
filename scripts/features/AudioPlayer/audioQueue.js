import { getAudioTitle } from '../../utils/helpers';

function hasContent(audio) {
  return audio.has_transcription === true
    || (Array.isArray(audio.utterances?.utterances) && audio.utterances.utterances.length)
    || (Array.isArray(audio.utterances) && audio.utterances.length)
    || (Array.isArray(audio.description) && audio.description.length);
}

export function getAudioItems(media = []) {
  const bySource = new Map();
  (Array.isArray(media) ? media : []).forEach((audio) => {
    if (audio.type !== 'audio' || typeof audio.source !== 'string' || !audio.source.trim()) return;
    if (!bySource.has(audio.source) || hasContent(audio)) bySource.set(audio.source, audio);
  });
  return [...bySource.values()];
}

export function buildAudioQueue(record) {
  if (!record) return undefined;
  return getAudioItems(record.media).map((audio, index) => ({
    audio,
    title: getAudioTitle(
      audio.title,
      record.contents,
      record.archive?.archive_org,
      record.archive?.archive,
      audio.source,
      record.year,
      record.persons,
    )?.trim() || `Inspelning ${index + 1}`,
  }));
}
