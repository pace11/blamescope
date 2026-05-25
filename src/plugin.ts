import path from "path";
import { applyBlameScopeTransform } from "./babel-transform";

/**
 * Standalone Vite plugin — auto-injects `data-blamescope` onto the root JSX
 * element of every React component found in JSX/TSX files.
 *
 * Strategy: Babel runs visitors only (code: false) to collect insertion
 * offsets, then MagicString inserts the attribute at those positions.
 * The rest of the source is unchanged → no regeneration issues with OXC.
 *
 * Usage in vite.config.ts (add BEFORE react()):
 *   plugins: [blameScopePlugin(), react()]
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function blameScopePlugin(root?: string): any {
  const projectRoot = path.resolve(root ?? process.cwd()).replace(/\\/g, "/");

  return {
    name: "vite-plugin-blamescope",
    enforce: "pre",

    configResolved(config: any) {
      console.log("[blamescope] configResolved — root:", config.root);
    },

    buildStart() {
      console.log("[blamescope] plugin active — watching JSX/TSX files");
    },

    transform(code: any, id: any) {
      console.log("[blamescope] transform called:", id);
      return applyBlameScopeTransform(code, id, projectRoot);
    },
  };
}
