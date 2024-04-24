# @torchauth/vite-plugin-wrangler-spa

[![NPM Version](https://img.shields.io/npm/v/vite-wrangler-spa)](https://www.npmjs.com/package/vite-wrangler-spa)

This plugin allows both the React SPA and Cloudflare functions to run with LiveReload locally, and at the same time.

This solves a major pain point that currently exists, where you cannot work locally with LiveReload for the React project,
you are forced to use `preview`. This plugin allows both the React SPA and Cloudflare functions to run with LiveReload
locally, and at the same time.

- Write React code the same as any other Vite project, with LiveReload
- Cloudflare function code can be written within the configurable `functions` directory
  - This is served in parallel via `miniflare` along with the React SPA code
  - [Hono](https://hono.dev/top) is the preferred router, but any Cloudflare compatible router could also be used
- Make requests from the React project to the `miniflare` endpoints
- Full access to Cloudflare local services via `wrangler` configuration
  - D1
  - R2
  - KV
  - etc

Much of this plugin takes inspiration from
[`@hono/vite-cloudflare-pages`](https://github.com/honojs/vite-plugins/tree/main/packages/cloudflare-pages), so thank you to
the Hono team.

## Usage

_A detailed example can be found in the `examples` directory, but a brief overview of installing and configuring this plugin
is as follows_

This plugin is intended to be used with a standard Vite React application, though other SPA frameworks may also work.

```sh
## Create a new Vite React application
> create vite@latest my-react-app -- --template react-swc-ts
> cd my-react-app

## Create folder to hold Cloudflare Pages Functions code
> mkdir functions

## Install @torchauth/vite-plugin-wrangler-spa
> npm i -D @torchauth/vite-plugin-wrangler-spa

## Install Hono
> npm i hono
```

Alter your `vite.config.ts` file to include this plugin:

```ts
import { defineConfig } from 'vite';
import { viteWranglerSpa } from '@torchauth/vite-plugin-wrangler-spa';
import react from '@vitejs/plugin-react-swc';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig(() => {
  return {
    plugins: [
      tsconfigPaths(), // if using paths
      react(),
      viteWranglerSpa({
        functionEntrypoint: 'functions/index.tsx',
        allowedApiPaths: ['/api/*', '/oauth/*'],
      }),
    ],
  };
});
```

Add an `index.ts` file to the `functions` directory:

```ts
import { Hono } from 'hono';

const app = new Hono().basePath('/api');

const route = app.get((c) => {
  return c.json({
    test: true,
  });
});

export type AppType = typeof route;

export default app;
```

Start development mode by running `vite`.

## Vite Plugin Configuration

All settings are optional, with the default being used when no other value is set.

| Name               |                                                   Description                                                    |                                                                                                                                                    Default |
| ------------------ | :--------------------------------------------------------------------------------------------------------------: | ---------------------------------------------------------------------------------------------------------------------------------------------------------: |
| allowedApiPaths    |             These are url paths that should be directed to the Cloudflare function, and not the SPA.             |                                                                                                                                                `["/api/*]` |
| excludedApiPaths   | These are url paths that should **not** be directed to the Cloudflare function, and will always route to the SPA |                                                                                                                                                       `[]` |
| functionEntrypoint |            The file (/tsx?/) that will be used as the entry point for the Cloudflare Pages functions.            |                                                                                                                                       `functions/index.ts` |
| wranglerConfig     |                                 Pass through for Wrangler configuration objects                                  | [see Wrangler documentation](https://github.com/cloudflare/workers-sdk/blob/c81fa65cbc4b1749ab31afb114cc3cb40e22fef9/packages/wrangler/src/api/dev.ts#L13) |
| wranglerConfigPath |              Location of your `wrangler.toml` file for usage in setting up Wrangler local services               |                                                                                                                                            `wrangler.toml` |
| external           |                                 Any Function packages that should not be bundled                                 |                                                                                                                                                       `[]` |

## API Endpoints

_By default we presume [Hono](https://hono.dev/top) as the router, but any other Cloudflare Functions compatible router
could be used as well._

API endpoints are ran via Pages Functions. Cloudflare services should be available on the Context object with the router.

```ts
const app = new Hono().basePath('/api');

const route = app.get('/hello', (c) => {
  // Hono's context.env property will contain references to any services bound to the Pages
  console.log(c.env);

  return c.json({
    test: true,
  });
});
```

Any updates to the API will trigger a full refresh in the browser window, as well as print a console message in the browser.

### Allowed/Excluded Api Paths

**Excluded api paths take precedence over allowed api paths**

The `allowedApiPaths` and `excludedApiPaths` plugin settings will determine which routes get routed to the frontend or
backend.

| Path           |               Result                |
| -------------- | :---------------------------------: |
| `/some`        |             exact match             |
| `/some/*`      |   match all routes with `/some/`    |
| `/some/path`   |             exact match             |
| `/some/path/*` | match all routes with `/some/path/` |

Strings should be in the format of a url fragment `/some/path`. Asterisks can be used at the end of a path (`/some/path/*`)
as a wild card to catch all routes. This string is applied directly to the `_routes.json` file, more elaborate RegExs will
not work correctly once deployed to Cloudflare.

[See Cloudflare \_routes.json documentation for more information.](https://developers.cloudflare.com/pages/functions/routing/#create-a-_routesjson-file)

### Hono HTML Endpoints

You can also return HTML directly to facilitate HTMX applications:

```ts
const app = new Hono().basePath('/api');

const route = app.get('/page', (c) => {
  return c.html(<div>My HTMX content!</div>);
});
```

_**Beware when importing types from backend `/functions` into your frontend application. Depending on how they are exported,
it could pull your entire Function bundle into your frontend code. Always double-check the final bundle to ensure you
haven't accidentally imported more than you wanted.**_

#### Optional: Add Hono/jsx types to functions directory

Using Hono JSX can cause typing errors due to collisions with standard JSX types. Add a `tsconfig.json` file to the
`functions` directory to fix type issues that may occur. These settings may need to be altered to fit your specific
environment.

```json
{
  "compilerOptions": {
    "target": "ESNext",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "lib": ["ESNext"],
    "jsx": "react-jsx",
    "jsxImportSource": "hono/jsx",
    "types": ["hono"]
  }
}
```

## Build & Deploy to Cloudflare

To produce a prodution bundle, **two build steps are required**. This is to ensure code separation between the static
frontend and the Function backend code.

```sh
## Build production bundle
> vite build && vite build --mode page-function
```

Your React app will be packaged as normal and the `functions` code will be packaged into a `_worker.js` file.

The final package will be placed into `/dist` and it can be uploaded directly to Cloudflare via wrangler, CI/CD, or the UI.

```sh
## Upload via wrangler
> npx wrangler pages deploy ./dist
```

Additionally, a `_routes.json` file will also be created to prevent the functions from intercepting requests that should go
to the frontend. Route file contents are dictated by the `allowedApiPaths` and `excludedApiPaths` configuration options.

Final distribution bundles should be inspected to make sure server-side packages aren't making their way into your frontend
code, and frontend packages aren't making their way into your Function bundle. While they probably won't cause issues, they
will increase bundle size.

Also, don't forget to update your `wrangler.toml` file to include
[`compatibility_flags`](https://developers.cloudflare.com/workers/wrangler/configuration/#use-runtime-apis-directly), and
ensure your Cloudflare Pages configuration has been updated as well.
