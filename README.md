# Simple Irc Client website

[![Build Status](https://github.com/Simple-Irc-Client/website/actions/workflows/ci.yml/badge.svg)](https://github.com/Simple-Irc-Client/website/actions/workflows/ci.yml)

Static site for simpleircclient.com. The build also produces the web app from the `core` submodule in gateway mode.

## Build

```bash
git submodule update --init
pnpm install
pnpm run build
```

- `build:css` compiles Tailwind into `public/css/style.css`
- `build:html` renders the pages in `src/` into `public/`
- `build:web` builds `core` against the public gateway into `dist-app/`

## Deployment

Every push to `main` builds the site and uploads it to the Hetzner server over SFTP (`.github/workflows/ci.yml`).
