import { l } from "../../../lang/Lang";

export function buildTextPages({ isPageByPage, mediaImages, textParts }) {
  if (isPageByPage) {
    return mediaImages
      .map((m, idx) => {
        if (!m.text || m.transcriptionstatus === "readytotranscribe") {
          return null;
        }
        return {
          pageNumber: idx + 1,
          title: m.title || `${l("Sida")} ${idx + 1}`,
          html: m.text,
        };
      })
      .filter(Boolean);
  }

  if (!textParts || !textParts.length) return [];

  return textParts
    .map((html, idx) => ({
      pageNumber: idx + 1,
      title: `${l("Sida")} ${idx + 1}`,
      html,
    }))
    .filter((p) => p.html && p.html.trim());
}
