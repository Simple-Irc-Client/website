import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { createHash } from "node:crypto";

const srcDir = new URL("./src/", import.meta.url);
const publicDir = new URL("./public/", import.meta.url);
const cssPath = new URL("./public/css/style.css", import.meta.url);
const htaccessPath = new URL("./public/.htaccess", import.meta.url);

const css = readFileSync(cssPath, "utf8");
const hash = createHash("sha256").update(css).digest("base64");

const htmlFiles = readdirSync(srcDir).filter((f) => f.endsWith(".html"));

for (const file of htmlFiles) {
  let html = readFileSync(new URL(file, srcDir), "utf8");

  // Use split/join instead of .replace() to avoid $ backreference interpretation in CSS content
  const cssLinkTag = '<link rel="stylesheet" href="/css/style.css" />';
  const parts = html.split(cssLinkTag);
  if (parts.length === 2) {
    html = parts[0] + `<style>${css}</style>` + parts[1];
  }

  html = html.replace(
    /style-src '(?:self|sha256-[A-Za-z0-9+/=]+)'/g,
    `style-src 'sha256-${hash}'`,
  );

  writeFileSync(new URL(file, publicDir), html);
  console.log(`${file} -> public/${file} (CSP: sha256-${hash})`);
}

let htaccess = readFileSync(htaccessPath, "utf8");
htaccess = htaccess.replace(
  /style-src '(?:self|sha256-[A-Za-z0-9+/=]+)'/g,
  `style-src 'sha256-${hash}'`,
);
writeFileSync(htaccessPath, htaccess);
console.log(`.htaccess CSP updated (style-src: sha256-${hash})`);
