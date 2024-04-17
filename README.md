# vite-wrangler-spa

This plugin allows both the React SPA and Cloudflare functions to run with LiveReload locally, and at the same time.

This solves a major pain point that currently exists, where you cannot work locally with LiveReload
for the React project, you are forced to use `preview`. This plugin allows both the React SPA and
Cloudflare functions to run with LiveReload locally, and at the same time.

- Write React code the same as any other Vite project, with LiveReload
- Cloudflare function code can be written within the configurable `functions` directory
  - This is served in parallel via `miniflare` along with the React SPA code
- Make requests from the React project to the `miniflare` endpoints
- Full access to Cloudflare local services via `wrangler` configuration
  - D1
  - R2
  - KV
  - etc

## Usage

_A detailed example can be found in the `examples` directory, but a brief overview of installing and configuring this plugin is as follows_

This plugin is intended to be used with a standard Vite React application, though other SPA frameworks may also work.

```sh
## Create a new Vite React application
> create vite@latest my-react-app -- --template react-swc-ts
> cd my-react-app

## Create folder to hold Cloudflare Pages Functions code
> mkdir functions

## Install vite-wrangler-spa
> npm i -D vite-wrangler-spa

## Install Hono
> npm i hono
```

Alter your `vite.config.ts` file to include this plugin:

```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import viteWranglerSpa from 'vite-wrangler-spa';

export default defineConfig({
  build: {
    minify: false,
  },
  plugins: [react(), viteWranglerSpa()],
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

Add a `tsconfig.json` file to the `functions` directory to fix type issues:

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

## API Endpoints

_By default we use Hono as the router, but any other Cloudflare Functions compatible router could be used as well._

API endpoints are ran via Pages Functions. Cloudflare services should be available on the Context object with the router.

```ts
const app = new Hono().basePath('/api');

const route = app.get((c) => {
  // Hono's context.env property will contain references to any services bound to the Pages
  console.log(c.env);

  return c.json({
    test: true,
  });
});
```

Any updates to the API will trigger a full refresh in the browser window, as well as print a console message.

You can also return HTML directly to facilitate HTMX applications:

```ts
const app = new Hono().basePath('/api');

const route = app.get((c) => {
  return c.html(<div>My HTMX content!</div>);
});
```

## Vite Plugin Configuration

All settings are optional, with the default being used when no other value is set.

| Name               |                                                   Description                                                    |                    Default |
| ------------------ | :--------------------------------------------------------------------------------------------------------------: | -------------------------: |
| allowedApiPaths    |             These are url paths that should be directed to the Cloudflare function, and not the SPA.             |                `["/api/*]` |
| excludedApiPaths   | These are url paths that should **not** be directed to the Cloudflare function, and will always route to the SPA |                       `[]` |
| functionEntrypoint |                 The file that will be used as the entry point for the Cloudflare Pages functions                 |       `functions/index.ts` |
| wranglerConfig     |                                 Pass through for Wrangler configuration objects                                  | see Wrangler documentation |
| wranglerConfigPath |              Location of your `wrangler.toml` file for usage in setting up Wrangler local services               |            `wrangler.toml` |

## Build

Upon building, your React app will be packaged into a static application, and the `functions` will be
packaged into a `_worker.js` file. Additionally, a `_routes.json` file will also be created to prevent
the functions from intercepting requests that should go to the frontend. Route file contents are dictated by the
`allowedApiPaths` and `excludedApiPaths`.

The final package will be placed into `/dist` and it can be uploaded directly to Cloudflare via wrangler

```sh
> npx wrangler pages deploy ./dist
```

## Hono Type Problems

_If using Hono as your Functions API framework_

Due to the way Hono declares it's own JSX types, situations can occur where they collide with the React types.
If the 2 code bases don't touch directly, this works fine. However, utilizing something such as Hono's `hc` client
will cause references between the two to be made, which will cause `tsc` to fail with errors when building.

To avoid this, either use some other mechanism(axios, etc) for contacting the Functions API, or don't use `tsc` for
type-checking.

Right now, I don't know of a way to avoid this.
