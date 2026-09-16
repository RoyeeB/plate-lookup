/**
 * Adds Open Graph / Twitter tags to the SPA's index.html for one page, so a
 * shared vehicle link previews as that vehicle.
 */
export interface PreviewTags {
  title: string;
  description: string;
  url: string;
  image: string;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function injectMeta(html: string, tags: PreviewTags): string {
  const e = {
    title: escapeHtml(tags.title),
    description: escapeHtml(tags.description),
    url: escapeHtml(tags.url),
    image: escapeHtml(tags.image),
  };
  const block = [
    `<meta property="og:type" content="website" />`,
    `<meta property="og:site_name" content="איתור לוחית" />`,
    `<meta property="og:locale" content="he_IL" />`,
    `<meta property="og:title" content="${e.title}" />`,
    `<meta property="og:description" content="${e.description}" />`,
    `<meta property="og:url" content="${e.url}" />`,
    `<meta property="og:image" content="${e.image}" />`,
    `<meta property="og:image:width" content="1200" />`,
    `<meta property="og:image:height" content="630" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${e.title}" />`,
    `<meta name="twitter:description" content="${e.description}" />`,
    `<meta name="twitter:image" content="${e.image}" />`,
  ].join('\n    ');

  // Drop any generic tags from the shell so there is exactly one of each.
  const stripped = html.replace(/\s*<meta (?:property="og:[^"]*"|name="twitter:[^"]*")[^>]*>/g, '');
  return stripped
    .replace(/<title>[\s\S]*?<\/title>/, `<title>${e.title}</title>`)
    .replace('</head>', `    ${block}\n  </head>`);
}
