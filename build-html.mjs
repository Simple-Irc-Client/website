import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { createHash } from "node:crypto";
import { join } from "node:path";

const srcDir = new URL("./src/", import.meta.url);
const publicDir = new URL("./public/", import.meta.url);
const cssPath = new URL("./public/css/style.css", import.meta.url);

const css = readFileSync(cssPath, "utf8");
const hash = createHash("sha256").update(css).digest("base64");

const htmlFiles = readdirSync(srcDir).filter((f) => f.endsWith(".html"));

for (const file of htmlFiles) {
  let html = readFileSync(new URL(file, srcDir), "utf8");

  html = html.replace(
    /<link rel="stylesheet" href="\/css\/style\.css" \/>/,
    `<style>${css}</style>`,
  );

  html = html.replace(
    /style-src 'self'/g,
    `style-src 'sha256-${hash}'`,
  );

  writeFileSync(new URL(file, publicDir), html);
  console.log(`${file} -> public/${file} (CSP: sha256-${hash})`);
}
