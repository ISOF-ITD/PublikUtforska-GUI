export default function sanitizeHtml(html) {
  try {
    const str = String(html ?? "").replace(/\r\n/g, "\n");
    if (typeof window !== "undefined" && window.DOMPurify?.sanitize) {
      return window.DOMPurify.sanitize(str);
    }
    return str;
  } catch {
    return String(html ?? "");
  }
}