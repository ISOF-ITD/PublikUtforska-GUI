import sanitizeHtml from 'sanitize-html';
import { getMatkultPageUrl } from './matkult';

const ARTICLE_TAGS = [
  'div', 'section', 'article', 'span', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'ul', 'ol', 'li', 'strong', 'b', 'em', 'i', 'q', 'blockquote', 'br', 'hr',
  'figure', 'figcaption', 'img', 'a', 'dl', 'dt', 'dd', 'sub', 'sup', 'abbr',
  'table', 'caption', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td',
];
const ARTICLE_CLASSES = [
  'pagecontent', 'sv-image-portlet', 'sv-image-caption', 'env-assistive-text',
  'sv-comments2-portlet', 'sv-form-portlet', 'sv-script-portlet',
];

function resolveUrl(value, baseUrl, image = false) {
  if (!value) return undefined;
  try {
    const url = new URL(value, baseUrl);
    if (url.username || url.password || url.port) return undefined;
    if (image) {
      return getMatkultPageUrl(url.href) && url.pathname.startsWith('/images/')
        ? url.href : undefined;
    }
    return ['https:', 'mailto:'].includes(url.protocol) ? url.href : undefined;
  } catch {
    return undefined;
  }
}

function resolveSrcset(value, baseUrl) {
  return (value || '').split(',').map((candidate) => {
    const [path, descriptor, extra] = candidate.trim().split(/\s+/);
    const url = resolveUrl(path, baseUrl, true);
    return url && !extra && /^(?:[1-9]\d*w|(?:\d*\.)?\d+x)$/.test(descriptor)
      ? `${url} ${descriptor}` : '';
  }).filter(Boolean).join(', ') || undefined;
}

export function parseMatkultArticle(html, sourceUrl) {
  const baseUrl = getMatkultPageUrl(sourceUrl);
  if (!baseUrl || typeof html !== 'string' || html.length > 1000000) {
    throw new Error('Artikelinnehållet kunde inte läsas.');
  }

  // Sanitize before DOMParser, so the detached document contains no scripts,
  // frames, event handlers, styles, or third-party image requests.
  const clean = sanitizeHtml(html, {
    allowedTags: ARTICLE_TAGS,
    allowedAttributes: {
      '*': ['class'],
      a: ['href', 'title'],
      img: ['src', 'srcset', 'alt', 'width', 'height'],
      ol: ['start'],
      li: ['value'],
      th: ['scope', 'colspan', 'rowspan'],
      td: ['colspan', 'rowspan'],
    },
    allowedClasses: { '*': ARTICLE_CLASSES },
    nonTextTags: [
      'script', 'style', 'textarea', 'option', 'noscript', 'template', 'svg', 'math',
      'iframe', 'object', 'embed', 'form', 'button',
    ],
    allowedSchemes: ['https', 'mailto'],
    allowProtocolRelative: false,
    transformTags: {
      a: (tagName, attributes) => ({
        tagName, attribs: { ...attributes, href: resolveUrl(attributes.href, baseUrl) },
      }),
      img: (tagName, attributes) => ({
        tagName,
        attribs: {
          ...attributes,
          src: resolveUrl(attributes.src, baseUrl, true),
          srcset: resolveSrcset(attributes.srcset, baseUrl),
        },
      }),
    },
  });
  const parsed = new DOMParser().parseFromString(clean, 'text/html');
  const article = parsed.querySelector('.pagecontent');
  // Never fall back to the entire page: login/error pages and site navigation
  // must not be mistaken for editorial content.
  if (!article) throw new Error('Artikelns innehåll saknas.');

  article.querySelectorAll('h1, .sv-comments2-portlet, .sv-form-portlet, .sv-script-portlet, .env-assistive-text').forEach((element) => element.remove());
  article.querySelectorAll('h2, h3, h4, h5, h6').forEach((heading) => {
    const replacement = parsed.createElement(`h${Math.min(Number(heading.tagName[1]) + 1, 6)}`);
    replacement.innerHTML = heading.innerHTML;
    heading.replaceWith(replacement);
  });
  article.querySelectorAll('.sv-image-portlet').forEach((portlet) => {
    const figure = parsed.createElement('figure');
    figure.innerHTML = portlet.innerHTML;
    const caption = figure.querySelector('.sv-image-caption');
    if (caption) {
      const captionContainer = caption.closest('p') || caption;
      const figcaption = parsed.createElement('figcaption');
      figcaption.innerHTML = captionContainer.innerHTML;
      captionContainer.replaceWith(figcaption);
    }
    portlet.replaceWith(figure);
  });
  article.querySelectorAll('img').forEach((image) => {
    if (!image.getAttribute('src')) {
      image.remove();
      return;
    }
    if (!image.hasAttribute('alt')) {
      image.setAttribute('alt', image.closest('figure')?.querySelector('figcaption')?.textContent.trim() || 'Bild från Matkult');
    }
    image.setAttribute('loading', 'lazy');
    image.setAttribute('decoding', 'async');
    if (image.hasAttribute('srcset')) image.setAttribute('sizes', '(max-width: 768px) 100vw, 720px');
  });
  article.querySelectorAll('a').forEach((link) => {
    if (!link.hasAttribute('href')) return;
    link.setAttribute('target', '_blank');
    link.setAttribute('rel', 'noopener noreferrer');
    link.setAttribute('aria-label', `${link.textContent.trim() || link.querySelector('img')?.alt || 'Öppna länk'} (öppnas i nytt fönster)`);
  });
  if (!article.textContent.trim() && !article.querySelector('img')) {
    throw new Error('Artikelns innehåll saknas.');
  }

  // Drop the temporary CMS classes as well. Only Folke styles the result.
  return sanitizeHtml(article.innerHTML, {
    allowedTags: ARTICLE_TAGS.filter((tag) => tag !== 'h1'),
    allowedAttributes: {
      a: ['href', 'title', 'target', 'rel', 'aria-label'],
      img: ['src', 'srcset', 'alt', 'width', 'height', 'loading', 'decoding', 'sizes'],
      ol: ['start'],
      li: ['value'],
      th: ['scope', 'colspan', 'rowspan'],
      td: ['colspan', 'rowspan'],
    },
    allowedSchemes: ['https', 'mailto'],
    allowProtocolRelative: false,
  });
}

export async function fetchMatkultArticle(url, signal) {
  const sourceUrl = getMatkultPageUrl(url);
  if (!sourceUrl) throw new Error('Artikeladressen kunde inte läsas.');
  const response = await fetch(sourceUrl, { signal, credentials: 'omit', mode: 'cors' });
  if (!response.ok) throw new Error('Artikeln kunde inte hämtas.');
  // Relative media links belong to the final page after any canonical redirect.
  const finalUrl = response.url || sourceUrl;
  return parseMatkultArticle(await response.text(), finalUrl);
}
