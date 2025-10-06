export default function sanitizeHtml(html) {
  try {
    const str = String(html ?? "");
    if (typeof window !== "undefined" && window.DOMPurify?.sanitize) {
      return window.DOMPurify.sanitize(str);
    }
    return str;
  } catch {
    return String(html ?? "");
  }
}