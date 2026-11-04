import { NodeHtmlMarkdown } from "node-html-markdown";

const siteOrigin = "https://simpleircclient.com";

const titleSuffix = " - Simple IRC Client";

// A <pre> holding styled spans (an IRC buffer) instead of a single <code>.
function isPlainPre(node) {
  return !(node.childNodes.length === 1 && node.firstChild.tagName === "CODE");
}

// The fence is longer than any backtick run inside, so the block can't be closed early.
function fence(text) {
  const longestRun = Math.max(0, ...(text.match(/`+/g) ?? []).map((run) => run.length));
  const delimiter = "`".repeat(Math.max(3, longestRun + 1));
  return `${delimiter}\n${text.replace(/\n+$/, "")}\n${delimiter}`;
}

// Inside a Markdown link destination only parentheses and whitespace need escaping.
function linkDestination(url) {
  return url.replace(/[()\s]/g, (character) => `%${character.charCodeAt(0).toString(16).toUpperCase().padStart(2, "0")}`);
}

// Markdown has no definition lists; each term becomes a bullet followed by its definition.
function definitionList(node) {
  return node.childNodes
    .filter((child) => child.tagName === "DT" || child.tagName === "DD")
    .map((child) => {
      const text = htmlToMarkdown(child.innerHTML).trim();
      return child.tagName === "DT" ? `\n* **${text}**:` : ` ${text}`;
    })
    .join("")
    .trim();
}

const translators = {
  pre: ({ node, base }) =>
    isPlainPre(node)
      ? { content: fence(node.textContent), recurse: false, surroundingNewlines: 2 }
      : base,
  figcaption: ({ node }) => ({
    content: node.childNodes
      .map((child) => htmlToMarkdown(child.toString()).trim())
      .filter(Boolean)
      .join(" — "),
    recurse: false,
    prefix: "_",
    postfix: "_",
    surroundingNewlines: 2,
  }),
  dl: ({ node }) => ({
    content: definitionList(node),
    recurse: false,
    surroundingNewlines: 2,
  }),
  a: ({ node }) => {
    const href = node.getAttribute("href");
    return href
      ? {
          prefix: "[",
          postfix: `](${linkDestination(href)})`,
          postprocess: ({ content }) => content.replace(/\s*\n\s*/g, " "),
        }
      : {};
  },
  img: ({ node }) => ({
    content: `![${node.getAttribute("alt") ?? ""}](${linkDestination(new URL(node.getAttribute("src"), siteOrigin).href)})`,
    recurse: false,
  }),
};

// The llms.txt convention: a page's Markdown version lives at its URL with ".md" appended.
export function markdownPath(file) {
  return `${file}.md`;
}

function extractOne(html, pattern, what, file) {
  const matches = [...html.matchAll(pattern)];
  if (matches.length !== 1) {
    throw new Error(`${file}: expected exactly one ${what}, found ${matches.length}`);
  }
  return matches[0][1];
}

function htmlToMarkdown(html) {
  return NodeHtmlMarkdown.translate(html, {}, translators).trim() + "\n";
}

export function pageToMarkdown(html, file) {
  return htmlToMarkdown(extractOne(html, /<main\b[^>]*>([\s\S]*?)<\/main>/g, "<main>", file));
}

export function pageSummary(html, file) {
  const title = extractOne(html, /<title>([\s\S]*?)<\/title>/g, "<title>", file);
  const description = extractOne(html, /<meta name="description" content="([^"]*)"/g, "meta description", file);
  return {
    title: htmlToMarkdown(title.replace(titleSuffix, "")).trim(),
    description: htmlToMarkdown(description).trim(),
    url: extractOne(html, /<link rel="canonical" href="([^"]*)"/g, "canonical link", file),
    markdownUrl: `${siteOrigin}/${markdownPath(file)}`,
  };
}
