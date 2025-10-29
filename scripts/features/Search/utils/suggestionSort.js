export const suggestionSort = (needle) => (a, b) => {
  const aStarts = a.label.toLowerCase().startsWith(needle);
  const bStarts = b.label.toLowerCase().startsWith(needle);
  if (aStarts && !bStarts) return -1;
  if (!aStarts && bStarts) return 1;
  return a.label.localeCompare(b.label, "sv"); // secondary alphabetical sort
};
