# vite-wrangler-spa

This plugin allows both the React SPA and Cloudflare functions to run with LiveReload locally, and at the same time.

This solves a major pain point that currently exists, where you cannot work locally with LiveReload
for the React project, you are forced to use `preview`. This plugin allows both the React SPA and
Cloudflare functions to run with LiveReload locally, and at the same time.

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

_By default we use [Hono](https://hono.dev/top) as the router, but any other Cloudflare Functions compatible router could be used as well._

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

Any updates to the API will trigger a full refresh in the browser window, as well as print a console message.

You can also return HTML directly to facilitate HTMX applications:

```ts
const app = new Hono().basePath('/api');

const route = app.get('/page', (c) => {
  return c.html(<div>My HTMX content!</div>);
});
```

You can also utilize Hono's built in RPC functions to automatically map your Function API into your React SPA.
See the [Hono documentation](https://hono.dev/guides/rpc) for more information about this feature.

```ts
//App.tsx
const [remote, setRemote] = useState<string | undefined>(undefined);

useEffect(() => {
  async function fetchStuff() {
    const resp = await hc<AppType>('').api.hello.$get({
      query: { name: 'test' },
    });
    setRemote(await resp.text());
  }

  fetchStuff();
}, []);
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

## Build & Deploy to Cloudflare

Upon building, the final artifact is ready to be deployed. Your React app will be packaged as normal and the `functions` code will be packaged into a `_worker.js` file.

Additionally, a `_routes.json` file will also be created to prevent the functions from intercepting requests that should go to the frontend.
Route file contents are dictated by the `allowedApiPaths` and `excludedApiPaths` configuration options.

The final package will be placed into `/dist` and it can be uploaded directly to Cloudflare via wrangler, CI/CD, or the UI.

```sh
## Upload via wrangler
> npx wrangler pages deploy ./dist
```

## Hono Type Problems

_If using Hono as your Functions API framework_

Due to the way Hono declares it's own JSX types, situations can occur where they collide with the React types.
If the 2 code bases don't touch directly, this works fine. However, utilizing something such as Hono's `hc` client
will cause references between the two to be made, which can cause `tsc` to fail with errors when building.

To avoid this, a separate `tsconfig.json` file must be placed in the `functions` directory. See the React example for guidance.

This also can cause some shared bundles to be created. This is a known issue, and if it causes problems please open an issue.
