import { test } from "node:test";
import assert from "node:assert/strict";
import { describeNewTabLinks, makeCodeBlocksFocusable } from "./build-accessibility.mjs";

const newTabNote = '<span id="new-tab-note" hidden>Opens in a new tab</span>';

test("makes every code block focusable so it can be scrolled from the keyboard", () => {
  const html = '<pre><code>a</code></pre><pre class="buffer-body">b</pre>';

  assert.equal(makeCodeBlocksFocusable(html), '<pre tabindex="0"><code>a</code></pre><pre tabindex="0" class="buffer-body">b</pre>');
});

test("leaves a code block's own tabindex alone", () => {
  const html = '<pre tabindex="-1">a</pre>';

  assert.equal(makeCodeBlocksFocusable(html), html);
});

test("describes links that open a new tab with the shared note", () => {
  const html = `<a href="https://github.com" target="_blank" rel="noopener">GitHub</a><a href="/x.html">X</a>${newTabNote}`;

  assert.equal(
    describeNewTabLinks(html, "index.html"),
    `<a aria-describedby="new-tab-note" href="https://github.com" target="_blank" rel="noopener">GitHub</a><a href="/x.html">X</a>${newTabNote}`,
  );
});

test("keeps a link's own description", () => {
  const html = `<a aria-describedby="other" target="_blank">A</a>${newTabNote}`;

  assert.equal(describeNewTabLinks(html, "index.html"), html);
});

test("rejects a page whose new-tab links have no note to point at", () => {
  assert.throws(() => describeNewTabLinks('<a target="_blank">A</a>', "index.html"), /index\.html: links open a new tab but the page has no #new-tab-note note/);
});

test("accepts a page without new-tab links and without the note", () => {
  const html = '<a href="/">Home</a>';

  assert.equal(describeNewTabLinks(html, "404.html"), html);
});
