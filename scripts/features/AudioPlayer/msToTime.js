/* helper */
export default function msToTime(ms = 0) {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60)
    .toString()
    .padStart(2, '0');
  const seconds = (totalSeconds % 60).toString().padStart(2, '0');
  return hours > 0 ? `${hours}:${minutes}:${seconds}` : `${minutes}:${seconds}`;
} // “MM:SS”

export function msToTimeText(ms = 0) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const parts = [
    [Math.floor(totalSeconds / 3600), 'timme', 'timmar'],
    [Math.floor((totalSeconds % 3600) / 60), 'minut', 'minuter'],
    [totalSeconds % 60, 'sekund', 'sekunder'],
  ].filter(([value]) => value > 0)
    .map(([value, singular, plural]) => `${value} ${value === 1 ? singular : plural}`);

  if (!parts.length) return '0 sekunder';
  if (parts.length < 3) return parts.join(' och ');
  return `${parts[0]}, ${parts[1]} och ${parts[2]}`;
}
