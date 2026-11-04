// llms.txt (https://llmstxt.org): an index of the site's Markdown pages for language models.

export const pagesMarker = "<!-- @pages -->";

export function renderPageList(pages) {
  return pages.map(({ title, markdownUrl, description }) => `- [${title}](${markdownUrl}): ${description}`).join("\n");
}

export function renderFullText(pages) {
  return pages.map(({ url, markdown }) => `<!-- Source: ${url} -->\n\n${markdown}`).join("\n---\n\n");
}
