import { applyBlameScopeTransform } from "./babel-transform";

interface LoaderOptions {
  projectRoot?: string;
}

interface WebpackLoaderContext {
  resourcePath: string;
  rootContext?: string;
  getOptions?: () => LoaderOptions;
  callback: (
    err: Error | null,
    content?: string,
    sourceMap?: object | null
  ) => void;
}

/**
 * Webpack loader for Next.js — applies the same data-blamescope injection
 * as the Vite plugin. Registered automatically by `withBlamescope()` in
 * next.config.ts/js and runs only during `next dev`.
 */
function blameScopeLoader(this: WebpackLoaderContext, source: string): void {
  const callback = this.callback;
  const resourcePath = this.resourcePath;

  const options: LoaderOptions =
    this.getOptions ? this.getOptions() : {};
  const projectRoot =
    options.projectRoot || this.rootContext || process.cwd();

  const result = applyBlameScopeTransform(source, resourcePath, projectRoot);

  if (!result) {
    callback(null, source, null);
    return;
  }

  callback(null, result.code, result.map as object);
}

export default blameScopeLoader;
