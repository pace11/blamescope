# Changelog

## [0.3.0] - 2026-05-25

### ✨ New Features

- **Next.js App Router support** — use `withBlamescope` in `next.config.ts/js` and mount `<BlameOverlay />` via a `"use client"` wrapper in your root layout.
- **Next.js Pages Router support** — same `withBlamescope` setup; mount `<BlameOverlay />` directly in `_app.tsx`. Added a CJS build (`dist/index.cjs`) exposed via the `require` export condition so webpack (Pages Router) resolves the correct module and avoids duplicate React instance issues.

### 📦 Build

- Added CJS format to the client bundle in `tsup.config.ts`, outputting `dist/index.cjs`
- Updated `package.json` exports for `.` to include `"require": "./dist/index.cjs"` with `types` first per Node.js convention

### 📝 Docs

- README: updated Roadmap section to reflect current support status (Vite, Remix/React Router v7, Next.js App Router, Next.js Pages Router all ✅)
- README: updated Current limitations to reflect multi-framework support
- README: refreshed intro description

---

## [0.2.0] - 2026-05-25

### ✨ New Features

- **Theme support** — `<BlameOverlay />` now accepts a `theme` prop with 6 built-in presets: `default`, `github`, `gitlab`, `bitbucket`, `aws`, `google`. Fully custom themes are also supported via the `BlameTheme` type.
- **Clickable commit hash** — the commit hash in the tooltip now links directly to the commit on GitHub/GitLab/Bitbucket. Remote URL is auto-detected from `git remote get-url origin` and supports both SSH and HTTPS formats.
- **Status banner** — a persistent banner at the bottom center of the window indicates when BlameScope is active.

### 📦 New Exports

- `themes` — object containing all built-in theme presets
- `BlameTheme` — type for defining a custom theme
- `ThemeName` — union type of all preset theme names (`"default" | "github" | "gitlab" | "bitbucket" | "aws" | "google"`)

### 🔧 Improvements

- Package name aligned to scoped format `@pace11/blamescope`
- Blame server now returns `commitUrl` field alongside existing blame metadata
- GitHub Actions: added `pack-check` workflow that runs `npm pack --dry-run` on every PR from `VERSION/*` branches
- GitHub Actions: publish workflow now includes `--provenance` flag for npm verified badge

---

## [0.1.0] - 2026-05-24

### 🎉 Initial Release

- Vite plugin (`blameScopePlugin`) — auto-injects `data-blamescope` on root JSX element of every named React component
- `<BlameOverlay />` — hover tooltip showing last commit message, author, date, commit hash, total commits, and contributor list
- `withBlame` HOC — manual annotation for components the plugin cannot auto-detect (anonymous functions, `React.forwardRef`, etc.)
- Local Express server on port `4317` exposing `GET /ownership?file=<path>` backed by `git log`
- Alt key to pin overlay, Escape to unpin
- Support for `.jsx` and `.tsx` files
