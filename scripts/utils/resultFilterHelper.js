export const MATERIAL_TRANSCRIPTION_STATUSES = [
  'published',
  'accession',
  'readytotranscribe',
  'readytocontribute',
  'undertranscription',
].join(',');

export const TRANSCRIBABLE_TRANSCRIPTION_STATUSES = [
  'readytotranscribe',
  'undertranscription',
].join(',');

export function buildResultApiParams(
  params = {},
  {
    materialRecordtype = null,
    transcribeRecordtype = 'one_accession_row',
  } = {},
) {
  const { transcribe, ...apiParams } = params;
  const isTranscribeFilter = transcribe === true;

  if (!apiParams.transcriptionstatus) {
    apiParams.transcriptionstatus = isTranscribeFilter
      ? TRANSCRIBABLE_TRANSCRIPTION_STATUSES
      : MATERIAL_TRANSCRIPTION_STATUSES;
  }

  if (!apiParams.recordtype) {
    apiParams.recordtype = isTranscribeFilter
      ? transcribeRecordtype
      : materialRecordtype;
  }

  return apiParams;
}
