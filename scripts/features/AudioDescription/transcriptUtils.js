import { replace } from 'react-router-dom';

export const transcriptFragment = (id) => `avskrift-${encodeURIComponent(String(id))}`;

export function transcriptSeconds(value) {
  if (typeof value === 'number') return Number.isFinite(value) ? Math.max(0, value) : 0;
  if (typeof value !== 'string' || !value.trim()) return 0;
  const seconds = value.split(':').reduce((total, part) => total * 60 + Number(part), 0);
  return Number.isFinite(seconds) ? Math.max(0, seconds) : 0;
}

export function normalizeTranscript(audio) {
  const raw = Array.isArray(audio?.utterances) ? audio.utterances : audio?.utterances?.utterances;
  return (Array.isArray(raw) ? raw : []).map((segment, index) => ({
    ...segment,
    id: `${audio.id ?? audio.source}-${segment.id ?? index}-${index}`,
    text: segment.text ?? '',
    start: transcriptSeconds(segment.start),
    end: transcriptSeconds(segment.end),
  }));
}

export function selectedTranscript(record, audioItems, hash) {
  if (!hash.startsWith('#avskrift-')) {
    return audioItems.find((audio) => normalizeTranscript(audio).length);
  }
  return [...audioItems, ...record.media].find((audio) => (
    (audio.type === 'audio' || audioItems.includes(audio))
    && `#${transcriptFragment(audio.id)}` === hash
  ));
}

export function transcriptTimestamp(seconds, vtt = false) {
  const milliseconds = Math.round(seconds * 1000);
  const hours = Math.floor(milliseconds / 3600000);
  const minutes = Math.floor(milliseconds / 60000) % 60;
  const secs = Math.floor(milliseconds / 1000) % 60;
  const pad = (number, width = 2) => String(number).padStart(width, '0');
  const clock = `${pad(minutes)}:${pad(secs)}`;
  return vtt ? `${pad(hours)}:${clock}.${pad(milliseconds % 1000, 3)}`
    : `${hours ? `${hours}:` : ''}${clock}`;
}

export function transcriptExport(segments, format) {
  if (format === 'txt') return segments.map((segment) => segment.text).join('\n\n');
  return `WEBVTT\n\n${segments.map((segment, index) => `${index + 1}\n${transcriptTimestamp(segment.start, true)} --> ${transcriptTimestamp(Math.max(segment.start, segment.end), true)}\n${segment.text}`).join('\n\n')}\n`;
}

export function audioTranscriptLoader({ params, request }) {
  const url = new URL(request.url);
  return replace(`/records/${encodeURIComponent(params.recordId)}${url.search}#${transcriptFragment(params.audioId)}`);
}
