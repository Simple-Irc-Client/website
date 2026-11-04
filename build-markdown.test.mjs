import { test } from "node:test";
import assert from "node:assert/strict";
import fc from "fast-check";
import { pageSummary, pageToMarkdown } from "./build-markdown.mjs";

function page(main, head = "") {
  return `<html><head>${head}</head><body><nav><a href="/">Home</a></nav><main id="main">${main}</main><footer>Footer</footer></body></html>`;
}

function summaryHead({ title, description, canonical }) {
  return `<title>${title}</title><meta name="description" content="${description}" /><link rel="canonical" href="${canonical}" />`;
}

function escapeHtml(text) {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

test("converts only the page's main content", () => {
  const markdown = pageToMarkdown(page("<h1>Downloads</h1>"), "downloads.html");

  assert.equal(markdown, "# Downloads\n");
});

test("rejects a page without exactly one main element", () => {
  assert.throws(() => pageToMarkdown("<html><body><p>no main</p></body></html>", "broken.html"), /broken\.html: expected exactly one <main>/);
});

test("fences an IRC buffer made of styled spans and decodes its entities", () => {
  const buffer = '<pre class="buffer-body"><span class="n1">&lt;mika&gt;</span> hi\n<span class="n2">&lt;tjk&gt;</span> yo</pre>';

  const markdown = pageToMarkdown(page(buffer), "index.html");

  assert.equal(markdown, "```\n<mika> hi\n<tjk> yo\n```\n");
});

test("fences a buffer so that no backtick run inside it can close the block early", () => {
  fc.assert(
    fc.property(fc.string({ unit: "grapheme-ascii" }).filter((text) => !/^\s|\s$|\r/.test(text) && text.length > 0), (text) => {
      const markdown = pageToMarkdown(page(`<pre><span>${escapeHtml(text)}</span></pre>`), "index.html");

      const [opening, ...rest] = markdown.trimEnd().split("\n");
      const closing = rest.pop();
      assert.match(opening, /^`{3,}$/);
      assert.equal(closing, opening);
      assert.equal(rest.join("\n"), text);
      assert.ok(!rest.some((line) => line.trim().startsWith(opening)));
    }),
  );
});

test("joins the parts of a figure caption into one emphasised line", () => {
  const caption = '<figcaption><span>raw socket</span><span>irc.libera.chat:6697</span></figcaption>';

  const markdown = pageToMarkdown(page(caption), "build-irc-client.html");

  assert.equal(markdown, "_raw socket — irc.libera.chat:6697_\n");
});

test("turns a definition list into bullets with bold terms", () => {
  const list = "<dl><dt>Lock icon</dt><dd>Shows whether a chat is <em>encrypted</em>.</dd><dt><code>NICK</code></dt><dd>Set your nickname</dd></dl>";

  const markdown = pageToMarkdown(page(list), "index.html");

  assert.equal(markdown, "* **Lock icon**: Shows whether a chat is _encrypted_.\n* **`NICK`**: Set your nickname\n");
});

test("keeps underscores in link targets and escapes only parentheses and spaces", () => {
  const links = '<a href="https://example.com/Simple-Irc-Client_2.2.0_amd64.deb">DEB</a> <a href="https://en.wikipedia.org/wiki/IRC_(protocol) x">IRC</a>';

  const markdown = pageToMarkdown(page(links), "downloads.html");

  assert.equal(markdown, "[DEB](https://example.com/Simple-Irc-Client_2.2.0_amd64.deb) [IRC](https://en.wikipedia.org/wiki/IRC_%28protocol%29%20x)\n");
});

test("makes image sources absolute so they resolve outside the site", () => {
  const markdown = pageToMarkdown(page('<img src="/assets/screenshot.webp" alt="Main window" />'), "index.html");

  assert.equal(markdown, "![Main window](https://simpleircclient.com/assets/screenshot.webp)\n");
});

test("summarises a page from its title, description and canonical link", () => {
  const head = summaryHead({
    title: "Themes - Simple IRC Client",
    description: "Customize Simple IRC Client with CSS themes &amp; more.",
    canonical: "https://simpleircclient.com/themes.html",
  });

  const summary = pageSummary(page("<h1>Themes</h1>", head), "themes.html");

  assert.deepEqual(summary, {
    title: "Themes",
    description: "Customize Simple IRC Client with CSS themes & more.",
    url: "https://simpleircclient.com/themes.html",
    markdownUrl: "https://simpleircclient.com/themes.html.md",
  });
});

test("rejects a page summary without a canonical link", () => {
  const head = "<title>Lost</title><meta name=\"description\" content=\"Nothing here.\" />";

  assert.throws(() => pageSummary(page("<h1>Lost</h1>", head), "404.html"), /404\.html: expected exactly one canonical link/);
});
