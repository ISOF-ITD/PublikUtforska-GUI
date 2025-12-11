import { useMemo, useCallback } from "react";
import { buildTextPages } from "../utils/buildTextPages";
import { htmlToPlainText } from "../utils/htmlToPlainText";
import { l } from "../../../lang/Lang";

export function useDownloadAllText({
  isPageByPage,
  mediaImages,
  textParts,
  title,
  recordId,
}) {
  const textPages = useMemo(
    () => buildTextPages({ isPageByPage, mediaImages, textParts }),
    [isPageByPage, mediaImages, textParts]
  );

  const handleDownloadAllText = useCallback(() => {
    if (!textPages.length) return;

    const lines = [];

    if (title) {
      lines.push(title);
      lines.push("");
    }

    textPages.forEach((page, idx) => {
      lines.push(`${l("Sida")} ${page.pageNumber}: ${page.title}`);
      lines.push("");
      lines.push(htmlToPlainText(page.html));

      if (idx < textPages.length - 1) {
        lines.push("");
        lines.push(
          "------------------------------------------------------------"
        );
        lines.push("");
      }
    });

    const blob = new Blob([lines.join("\n")], {
      type: "text/plain;charset=utf-8",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    const safeTitle =
      (title || `${recordId || "record"}`)
        .toString()
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-_]/gi, "") || "transkription";

    link.href = url;
    link.download = `${safeTitle}.txt`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [textPages, title, recordId]);

  return { textPages, handleDownloadAllText };
}
