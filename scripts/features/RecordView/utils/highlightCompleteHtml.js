// Search highlights may be truncated fragments. Only use their marked terms;
// the complete field remains the source of the displayed content.
export default function highlightCompleteHtml(html, fragments) {
  const parser = new DOMParser();
  const terms = [...new Set([].concat(fragments || []).flatMap((fragment) => (
    [...parser.parseFromString(fragment, 'text/html').querySelectorAll('span.highlight, em')]
      .map((element) => element.textContent)
      .filter(Boolean)
  )))];
  if (!terms.length) return html;

  const pattern = new RegExp(`(${terms
    .sort((a, b) => b.length - a.length)
    .map((term) => term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    .join('|')})`, 'gi');
  const document = parser.parseFromString(html, 'text/html');
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);

  nodes.forEach((node) => {
    const parts = node.textContent.split(pattern);
    if (parts.length === 1) return;
    const replacement = document.createDocumentFragment();
    parts.forEach((part, index) => {
      if (index % 2 === 0) replacement.append(document.createTextNode(part));
      else {
        const marker = document.createElement('span');
        marker.className = 'highlight';
        marker.textContent = part;
        replacement.append(marker);
      }
    });
    node.replaceWith(replacement);
  });
  return document.body.innerHTML;
}
