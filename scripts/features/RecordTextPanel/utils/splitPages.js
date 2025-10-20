export const splitPages = (t) => {
  if (!t) return [];
  return t
    .replace(/\r\n/g, "\n")
    .split(/\n\/\s*\n?/g)
    .map((part) => part.replace(/^\n+/, "").trim());
};
