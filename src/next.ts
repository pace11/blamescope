import path from "path";

type NextConfig = Record<string, any>;

/**
 * Wraps your Next.js config to enable blamescope during `next dev`.
 *
 * Supports both App Router (Next.js 13+) and Pages Router.
 *
 * Usage in next.config.ts:
 * ```ts
 * import { withBlamescope } from '@pace11/blamescope/next'
 *
 * const nextConfig = { ... }
 * export default withBlamescope(nextConfig)
 * ```
 *
 * Usage in next.config.js (CJS):
 * ```js
 * const { withBlamescope } = require('@pace11/blamescope/next')
 *
 * module.exports = withBlamescope({ ... })
 * ```
 */
export function withBlamescope(nextConfig: NextConfig = {}): NextConfig {
  return {
    ...nextConfig,
    webpack(
      config: any,
      options: { dev: boolean; isServer: boolean; dir: string }
    ) {
      // Only instrument during development
      if (options.dev) {
        const loaderPath = path.resolve(__dirname, "next-loader.cjs");

        config.module.rules.unshift({
          test: /\.[jt]sx$/,
          exclude: /node_modules/,
          enforce: "pre",
          use: [
            {
              loader: loaderPath,
              options: {
                projectRoot: options.dir || config.context || process.cwd(),
              },
            },
          ],
        });
      }

      // Forward to the user's own webpack customisation if present
      if (typeof nextConfig.webpack === "function") {
        return nextConfig.webpack(config, options);
      }

      return config;
    },
  };
}
