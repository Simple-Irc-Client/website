import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { createHash } from "node:crypto";

const srcDir = new URL("./src/", import.meta.url);
const publicDir = new URL("./public/", import.meta.url);
const cssPath = new URL("./public/css/style.css", import.meta.url);
const htaccessPath = new URL("./public/.htaccess", import.meta.url);

const css = readFileSync(cssPath, "utf8");
const hash = createHash("sha256").update(css).digest("base64");

// Desktop release published on GitHub. Bump releaseVersion when a new release is out.
const repo = "Simple-Irc-Client/desktop";
const releaseVersion = "2.0.10";
const releaseBase = `https://github.com/${repo}/releases/download/v${releaseVersion}`;
const releaseAssets = [
  `Simple-Irc-Client_${releaseVersion}_aarch64.dmg`,
  `Simple-Irc-Client_${releaseVersion}_x64-setup.exe`,
  `Simple-Irc-Client_${releaseVersion}_x64_en-US.msi`,
  `Simple-Irc-Client_${releaseVersion}_amd64.AppImage`,
  `Simple-Irc-Client_${releaseVersion}_amd64.deb`,
  `Simple-Irc-Client-${releaseVersion}-1.x86_64.rpm`,
].map((name) => ({ name, url: `${releaseBase}/${name}` }));

function globToRegex(glob) {
  const escaped = glob.replace(/[.+^${}()|[\]\\]/g, "\\$&");
  return new RegExp("^" + escaped.replace(/\*/g, ".*") + "$");
}

function findAsset(pattern) {
  const re = globToRegex(pattern);
  const asset = releaseAssets.find((a) => re.test(a.name));
  if (!asset) {
    console.warn(`  No asset matched pattern: ${pattern}`);
  }
  return asset;
}

// {{VERSION}} and {{ASSET:glob}} (download URL of the matching release file).
function resolveAssetPlaceholders(html) {
  html = html.replace(/\{\{VERSION\}\}/g, releaseVersion);
  html = html.replace(/\{\{ASSET:([^}]+)\}\}/g, (_match, pattern) => {
    return findAsset(pattern)?.url ?? `https://github.com/${repo}/releases/latest`;
  });
  return html;
}

// Temporarily excluded from the build: the Scripts feature is not implemented yet.
// Re-enable by removing the entry here, restoring the nav link on every page and
// the sitemap entry, and re-adding public/scripts.html.
const excludedHtml = new Set(["scripts.html"]);

// Shared markup, injected where a page has the matching `<!-- @name -->` marker.
const partials = {
  nav: readFileSync(new URL("partials/nav.html", srcDir), "utf8").trim(),
  footer: readFileSync(new URL("partials/footer.html", srcDir), "utf8").trim(),
};

// Replace exactly one occurrence of `marker`. Uses split/join instead of
// .replace() to avoid $ backreference interpretation in the inserted content,
// and throws so a page can't silently ship without its nav, footer or CSS.
function replaceOnce(html, marker, content, file) {
  const parts = html.split(marker);
  if (parts.length !== 2) {
    throw new Error(`${file}: expected exactly one ${marker}, found ${parts.length - 1}`);
  }
  return parts[0] + content + parts[1];
}

// Top-level src/*.html only; partials live in a subdirectory.
const htmlFiles = readdirSync(srcDir).filter(
  (f) => f.endsWith(".html") && !excludedHtml.has(f),
);

for (const file of htmlFiles) {
  let html = readFileSync(new URL(file, srcDir), "utf8");

  for (const [name, content] of Object.entries(partials)) {
    html = replaceOnce(html, `<!-- @${name} -->`, content, file);
  }

  // Highlight the nav link of the page being built.
  const pageAttr = `data-page="${file}"`;
  html = html.split(pageAttr).join(`${pageAttr} aria-current="page"`);

  html = replaceOnce(html, '<link rel="stylesheet" href="/css/style.css" />', `<style>${css}</style>`, file);

  html = html.replace(
    /style-src '(?:self|sha256-[A-Za-z0-9+/=]+)'/g,
    `style-src 'sha256-${hash}'`,
  );

  html = resolveAssetPlaceholders(html);

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
