import { UnstableDevOptions } from 'wrangler';

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
   * **default: []**
   */
  excludedApiPaths: string[];

  /**
   * Any modules that should not explicitly be bundled with the Pages Function _worker.js.
   * Commonly used for misbehaving modules that don't bundle well.
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
   * See wrangler documentation for more information
   */
  wranglerConfig: UnstableDevOptions;

  /**
   * Location of your `wrangler.toml` file for usage in setting up Wrangler local services
   *
   * **default: 'wrangler.toml'**
   */
  wranglerConfigPath: string;
};
