const DONE_PAGE_STATUSES = [
  'undertranscription',
  'transcribed',
  'reviewing',
  'needsimprovement',
  'approved',
  'published',
];

export default function countPageProgressFromMedia(media = []) {
  const pages = (Array.isArray(media) ? media : []).filter(
    (m) => m && m.type !== 'pdf',
  );

  const done = pages.reduce((acc, m) => (
    acc + (DONE_PAGE_STATUSES.includes(m?.transcriptionstatus) ? 1 : 0)
  ), 0);

  return { total: pages.length, done };
}
