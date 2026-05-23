import { defineConfig } from "tsup";

export default defineConfig([
  // ─── Client bundle: BlameOverlay + withBlame ───────────────────────────────
  {
    entry: { index: "src/index.ts" },
    format: ["esm"],
    dts: { resolve: true },
    external: ["react", "react-dom", "react/jsx-runtime"],
    outDir: "dist",
    sourcemap: true,
    clean: true,
    tsconfig: "tsconfig.build.json",
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
