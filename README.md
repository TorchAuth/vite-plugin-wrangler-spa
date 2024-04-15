# vite-wrangler-spa

This vite-plugin can be used to render a full Cloudflare jamstack locally.

This solves a major pain point that currently exists, where you cannot work locally with LiveReload
for the React project, you are forced to use `preview`. This plugin allows both the React SPA and
Cloudflare functions to run with LiveReload locally.

- Write React code the same as any other Vite project, with LiveReload
- Cloudflare function code can be written within the `functions` directory
  - This is served in parallel via `miniflare` along with the React SPA code
- Make requests from the React project to the `miniflare` endpoints
- Full access to Cloudflare local services via `wrangler` configuration
  - D1
  - R2
  - KV
  - etc

## API Endpoint

API endpoints are ran via Pages Functions. By default we use Hono as the Router, but any other Cloudflare Functions
compatible router could be used as well. Cloudflare services should be available on the Context object with the router.

```ts
const app = new Hono().basePath("/api");

const route = app.get((c) => {
  // Hono's context.env property will contain references to any services bound to the Pages
  console.log(c.env);

  return c.json({
    test: true,
  });
});
```

## Build

Upon building, your React app will be packaged into a static application, and the `functions` will be
packaged into a `_worker.js` file. Additionally, a `_routes.json` file will also be created to prevent
the functions from intercepting requests that should go to the frontend.

The final package will be placed into `/dist` and it can be uploaded directly to Cloudflare via wrangler

```sh
> npx wrangler pages deploy ./dist
```

## Type Problems

Due to the way Hono declares it's own JSX types, situations can occur where they collide with the React types.
If the 2 code bases don't touch directly, this works fine. However, utilizing something such as Hono's `hc` client
will cause references between the two to be made, which will cause `tsc` to fail with errors.

Right now, I don't know of a way to avoid this.
