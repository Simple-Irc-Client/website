import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";

const srcDir = new URL("./src/", import.meta.url);
const publicDir = new URL("./public/", import.meta.url);
const cssPath = new URL("./public/css/style.css", import.meta.url);
const htaccessPath = new URL("./public/.htaccess", import.meta.url);

const css = readFileSync(cssPath, "utf8");
const hash = createHash("sha256").update(css).digest("base64");

// Fetch latest release info from GitHub
const repo = "Simple-Irc-Client/desktop";
let releaseVersion = "";
let releaseAssets = [];

try {
  const raw = execFileSync("gh", [
    "release", "view",
    "--repo", repo,
    "--json", "tagName,assets",
  ], { encoding: "utf8" });

  const data = JSON.parse(raw);
  const version = data.tagName.replace(/^v/, "");
  if (!/^\d+\.\d+\.\d+$/.test(version)) {
    throw new Error(`Invalid version format: ${version}`);
  }
  releaseVersion = version;

  const allowedUrlPrefix = `https://github.com/${repo}/releases/download/`;
  releaseAssets = data.assets
    .filter((a) => {
      if (!a.url.startsWith(allowedUrlPrefix)) {
        console.warn(`Skipping asset with unexpected URL: ${a.url}`);
        return false;
      }
      return true;
    })
    .map((a) => ({ name: a.name, url: a.url }));

  console.log(`Release: ${releaseVersion} (${releaseAssets.length} assets)`);
} catch (err) {
  console.warn("Failed to fetch release data from GitHub:", err.message);
  console.warn("Falling back to static version 1.1.1.");

  releaseVersion = "1.1.1";
  const tag = `v${releaseVersion}`;
  const base = `https://github.com/${repo}/releases/download/${tag}`;
  const names = [
    `simple-irc-client-${releaseVersion}-darwin-arm64.dmg`,
    `simple-irc-client-${releaseVersion}-darwin-arm64.zip`,
    `simple-irc-client-${releaseVersion}-not-signed-windows-x64.exe`,
    `simple-irc-client-${releaseVersion}-not-signed-windows-x64.msi`,
    `simple-irc-client-${releaseVersion}-x86_64.AppImage`,
    `simple-irc-client-${releaseVersion}-x86_64.deb`,
    `simple-irc-client-${releaseVersion}-x86_64.flatpak`,
    `simple-irc-client-${releaseVersion}-x86_64.rpm`,
    `simple-irc-client-${releaseVersion}-x86_64.snap`,
  ];
  releaseAssets = names.map((name) => ({ name, url: `${base}/${name}` }));
}

function globToRegex(glob) {
  const escaped = glob.replace(/[.+^${}()|[\]\\]/g, "\\$&");
  return new RegExp("^" + escaped.replace(/\*/g, ".*") + "$");
}

function resolveAssetPlaceholders(html) {
  html = html.replace(/\{\{VERSION\}\}/g, releaseVersion);
  html = html.replace(/\{\{ASSET:([^}]+)\}\}/g, (_match, pattern) => {
    const re = globToRegex(pattern);
    const asset = releaseAssets.find((a) => re.test(a.name));
    if (!asset) {
      console.warn(`  No asset matched pattern: ${pattern}`);
      return `https://github.com/${repo}/releases/latest`;
    }
    return asset.url;
  });
  return html;
}

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
