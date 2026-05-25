import { defineConfig } from "tsup";

export default defineConfig([
  // ─── Client bundle: BlameOverlay + withBlame ───────────────────────────────
  // ESM build: banner ensures Next.js App Router treats this as a client module.
  // Vite ignores the directive (it's a no-op string expression there).
  {
    entry: { index: "src/index.ts" },
    format: ["esm"],
    dts: { resolve: true },
    external: ["react", "react-dom", "react/jsx-runtime"],
    outDir: "dist",
    sourcemap: true,
    clean: true,
    tsconfig: "tsconfig.build.json",
    banner: { js: '"use client";' },
  },

  // ─── Client bundle CJS: for Next.js pages router ───────────────────────────
  // Pages router uses webpack (CJS). Without a CJS build webpack shimming the
  // ESM can create a second React instance, causing the useState-on-null error.
  {
    entry: { index: "src/index.ts" },
    format: ["cjs"],
    outExtension: () => ({ js: ".cjs" }),
    dts: false,
    external: ["react", "react-dom", "react/jsx-runtime"],
    outDir: "dist",
    sourcemap: true,
    clean: false,
    tsconfig: "tsconfig.build.json",
    banner: { js: '"use client";' },
  },

  // ─── Vite plugin ───────────────────────────────────────────────────────────
  // @babel/core and magic-string are deps — mark external so npm installs them.
  {
    entry: { plugin: "src/plugin.ts" },
    format: ["esm"],
    dts: { resolve: true },
    external: [
      "vite",
      "path",
      "@babel/core",
      "magic-string",
      "@babel/plugin-syntax-typescript",
      "@babel/plugin-syntax-jsx",
    ],
    outDir: "dist",
    platform: "node",
    sourcemap: true,
    clean: false,
    tsconfig: "tsconfig.build.json",
  },

  // ─── Next.js plugin (ESM + CJS dual) ───────────────────────────────────────
  {
    entry: { next: "src/next.ts" },
    format: ["esm", "cjs"],
    dts: { resolve: true },
    external: ["path", "next"],
    outDir: "dist",
    platform: "node",
    sourcemap: true,
    clean: false,
    tsconfig: "tsconfig.build.json",
  },

  // ─── Next.js webpack loader (CJS — webpack requires CJS loaders) ───────────
  // @babel/core and magic-string resolve fine from blamescope's node_modules
  // at runtime. The syntax plugins are bundled so consumers don't need them.
  {
    entry: { "next-loader": "src/next-loader.ts" },
    format: ["cjs"],
    outExtension: () => ({ js: ".cjs" }),
    external: [
      "path",
      "@babel/core",
      "magic-string",
    ],
    outDir: "dist",
    platform: "node",
    sourcemap: true,
    clean: false,
    tsconfig: "tsconfig.build.json",
  },

  // ─── Server / bin ──────────────────────────────────────────────────────────
  {
    entry: { server: "src/server.js" },
    format: ["esm"],
    external: ["express", "cors", "child_process", "path"],
    outDir: "dist",
    platform: "node",
    sourcemap: true,
    clean: false,
    banner: {
      js: "#!/usr/bin/env node",
    },
  },
]);
