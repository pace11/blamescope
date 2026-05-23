# 👉 Blamescope

<div align="center">
<img src="./public//blamescop.png" alt="app-icon" style="text-align:center" />
</div>

Component-level git blame overlay for React + Vite projects.

Hover over any React component in your browser during development to instantly see who last touched it, when, and what the commit message was — without leaving your app.

## How it works

1. **Vite plugin** — auto-injects a `data-blamescope` attribute onto the root JSX element of every React component at build time (dev only).
2. **Local server** — a small Express server on port `4317` queries `git log` for a given file and returns blame metadata.
3. **`<BlameOverlay />`** — a React component that listens to `mousemove`, finds the nearest `data-blamescope` element, calls the local server, and renders a tooltip with author, date, commit message, and contributor list.

## Installation

```bash
npm install -D blamescope
```

> **Peer requirements:** React ≥ 18, Vite ≥ 5. Your project must be a git repository.

## Setup

### 1. Add the Vite plugin

In `vite.config.ts`, add `blameScopePlugin()` **before** the React plugin:

```ts
// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { blameScopePlugin } from 'blamescope/plugin'

export default defineConfig({
  plugins: [blameScopePlugin(), react()],
})
```

### 2. Mount `<BlameOverlay />`

Render `<BlameOverlay />` once near the root of your app (e.g. in `App.tsx`):

```tsx
import { BlameOverlay } from 'blamescope'

export default function App() {
  return (
    <>
      {/* your app ... */}
      {import.meta.env.DEV && <BlameOverlay />}
    </>
  )
}
```

Wrapping it in `import.meta.env.DEV` ensures it is never shipped to production.

### 3. Start the blame server

Run the blamescope server alongside your Vite dev server:

```bash
# in one terminal
npx blamescope

# in another terminal
vite
```

Or add both to a single npm script:

```json
"scripts": {
  "dev": "blamescope & vite"
}
```

## Usage

- **Hover** over any component in the browser — a tooltip appears with:
  - Latest commit message, author, and relative date
  - Commit hash
  - Total commits and contributor breakdown
- **Hold `Alt`** to pin the tooltip so you can select and copy text.
- **Press `Escape`** to unpin.

## Manual annotation with `withBlame`

The Vite plugin auto-detects named function components. For components it cannot reach (anonymous functions, `React.forwardRef`, etc.), use the `withBlame` HOC:

```tsx
import { withBlame } from 'blamescope'

const Button = withBlame(
  React.forwardRef<HTMLButtonElement, ButtonProps>((props, ref) => (
    <button ref={ref} {...props} />
  )),
  { file: 'src/components/Button.tsx', component: 'Button' }
)
```

## API

### `blameScopePlugin(root?: string)`

Vite plugin. Accepts an optional `root` path (defaults to `process.cwd()`). Must be placed **before** the React plugin in the `plugins` array.

### `<BlameOverlay />`

React component. Renders the hover tooltip. No props required. Mount once per app.

### `withBlame(Component, meta)`

Higher-order component for manual annotation.

| Param | Type | Description |
|---|---|---|
| `Component` | `ComponentType<P>` | The component to wrap |
| `meta.file` | `string` | Relative path to the source file |
| `meta.component` | `string` | Display name shown in the tooltip |

### Blame server

The server listens on `http://localhost:4317` and exposes:

```
GET /ownership?file=<relative-path>
```

Returns JSON with `latestCommit`, `latestAuthor`, `latestDate`, `commitHash`, `latestEmail`, `totalCommits`, and `contributors`.

## Notes

- The overlay and plugin are intended for **development only**. Do not include them in production builds.
- The project must have a git history; the server calls `git log` and `git shortlog` under the hood.
- The server only accepts relative paths and rejects path-traversal attempts.

## Current limitations

Blamescope v0.1 only supports **React + Vite** projects. The Vite plugin relies on Babel to parse JSX/TSX and MagicString to inject attributes, so it is tightly coupled to the Vite build pipeline. Other setups are not supported yet.

## Roadmap

The following integrations are planned for future releases:
- **Remix / React Router v7** — same plugin approach adapted for Vite-based Remix projects (Can be used almost directly, with little to no modification ✅)
- **Next.js** — webpack/Turbopack plugin variant that injects `data-blamescope` during the Next.js build ⏳
- **Vue 3** — Vite plugin that injects blame attributes on the root element of single-file components (`.vue`) ⏳
- **Svelte** — preprocessor that annotates component root nodes ⏳
