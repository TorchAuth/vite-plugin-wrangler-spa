import { UnstableDevOptions } from 'wrangler';
import type { Options as SWCOptions } from '@swc/core';

export type CloudflareSpaConfig = Partial<ResolvedCloudflareSpaConfig>;

export type ResolvedCloudflareSpaConfig = {
  /**
   * These are url paths that should be directed to the Cloudflare function, and not the SPA.
   *
   * In development mode, this will redirect matching requests to the miniflare functions server
   *
   * In production, a _routes.json file will be used with these values set to the 'included' property
   *
   * Paths can be as specific as necessary, but root paths should end with '/*'
   *
   * **default: ["/api/*"]**
   */
  allowedApiPaths: string[];

  /**
   * These are url paths that should **not** be directed to the Cloudflare function, and will always route to the SPA.
   *
   * This should only be defined if you have issues with functions running when they shouldn't be, rely on `allowedApiPaths` first.
   *
   * In production, a _routes.json file will be used with these values set to the 'excluded' property
   *
   * These values are ignored during local development.
   *
   * **default: []**
   */
  excludedApiPaths: string[];

  /**
   * Any modules that should not explicitly be bundled with the Pages Function _worker.js.
   * Commonly used for misbehaving CJS modules that don't bundle well.
   */
  external: string[];

  /**
   * The file that will be used as the entry point for the Cloudflare Pages functions
   *
   * If returning HTML from the root, you probably want *functions/index.tsx*
   *
   * **default: 'functions/index.ts'**
   */
  functionEntrypoint: string;

  /**
   * Pass through for Wrangler configuration objects
   *
   * Set up for things such as D1, R2, or KV can occur here, but setup via wrangler.toml is easier
   *
   * [see Wrangler documentation](https://github.com/cloudflare/workers-sdk/blob/c81fa65cbc4b1749ab31afb114cc3cb40e22fef9/packages/wrangler/src/api/dev.ts#L13)
   */
  wranglerConfig: UnstableDevOptions;

  /**
   * Location of your `wrangler.toml` file for usage in setting up Wrangler local services
   *
   * **default: 'wrangler.toml'**
   */
  wranglerConfigPath: string;

  /**
   * Configuration for SWC compilation
   *
   * [See SWC doccumentation for more information](https://swc.rs/docs/configuration/swcrc)
   */
  swcConfig: SWCOptions;
};
