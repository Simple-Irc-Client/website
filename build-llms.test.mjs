import { test } from "node:test";
import assert from "node:assert/strict";
import { renderFullText, renderPageList } from "./build-llms.mjs";

const pages = [
  {
    title: "Simple IRC Client",
    description: "Open-source IRC client.",
    url: "https://simpleircclient.com/",
    markdownUrl: "https://simpleircclient.com/index.html.md",
    markdown: "# Simple IRC Client\n",
  },
  {
    title: "Downloads",
    description: "Installers for the desktop app.",
    url: "https://simpleircclient.com/downloads.html",
    markdownUrl: "https://simpleircclient.com/downloads.html.md",
    markdown: "# Downloads\n",
  },
];

test("lists every page as a link to its Markdown version with its description", () => {
  assert.equal(
    renderPageList(pages),
    "- [Simple IRC Client](https://simpleircclient.com/index.html.md): Open-source IRC client.\n" +
      "- [Downloads](https://simpleircclient.com/downloads.html.md): Installers for the desktop app.",
  );
});

test("concatenates every page's Markdown, each marked with the HTML page it comes from", () => {
  assert.equal(
    renderFullText(pages),
    "<!-- Source: https://simpleircclient.com/ -->\n\n# Simple IRC Client\n" +
      "\n---\n\n" +
      "<!-- Source: https://simpleircclient.com/downloads.html -->\n\n# Downloads\n",
  );
});
