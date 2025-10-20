export const splitPages = (t) => {
  if (!t) return [];
  // Normalize Windows line endings and trim outer whitespace
  const normalized = String(t).replace(/\r\n?/g, "\n").trim();

  // Split ONLY on a slash that appears alone on a line (optionally surrounded by spaces)
  // ^...$ need the 'm' flag to anchor to line starts/ends within the string
  const parts = normalized.split(/^\s*\/\s*$/gm);

  // Clean up each part: remove leading/trailing blank lines, preserve user content
  return parts.map((part) =>
    part.replace(/^\n+|\n+$/g, "").trim()
  );
};
