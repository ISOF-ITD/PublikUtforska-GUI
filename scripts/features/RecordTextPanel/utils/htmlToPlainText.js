export function htmlToPlainText(html) {
  if (!html) return "";
  const temp = document.createElement("div");
  temp.innerHTML = html;
  const textContent = temp.textContent || temp.innerText || "";
  return textContent.replace(/\u00A0/g, " ").trim();
}
