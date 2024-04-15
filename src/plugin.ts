import type { Plugin as VitePlugin } from 'vite';
import { UnstableDevWorker, unstable_dev } from 'wrangler';
import { CloudflareSpaConfig, defaultOptions } from './CloudflareSpaConfig';
import { makeWranglerFetch, convertWranglerResponse } from './utils';
import { writeFileSync } from 'fs';

let wranglerDevServer: UnstableDevWorker;

export function viteWranglerSpa(config?: CloudflareSpaConfig): VitePlugin {
  const {
    functionEntrypoint,
    wranglerConfig,
    allowedApiPaths,
    excludedApiPaths,
  } = {
    ...defaultOptions,
    ...config,
  };
  const plugin: VitePlugin = {
    name: 'vite-wrangler-spa',

    /** Start the wrangler miniflare server */
    configureServer: async (devServer) => {
      if (!wranglerDevServer) {
        wranglerDevServer = await unstable_dev(
          functionEntrypoint!,
          wranglerConfig
        );
      }

      //setup middleware to redirect requests to miniflare
      devServer.middlewares.use(async (req, res, next) => {
        const { url } = req;
        if (url === undefined) throw new Error('url is undefined!');

        /** only direct specific requests to the miniflare server so the SPA still renders correctly */
        if (
          allowedApiPaths?.find((x) =>
            new RegExp(`${x.replace('*', '')}`).test(url)
          ) &&
          !excludedApiPaths?.find((x) =>
            new RegExp(`${x.replace('*', '')}`).test(url)
          ) // TODO: is this correct?
        ) {
          const resp = await makeWranglerFetch(req, wranglerDevServer);

          // @ts-expect-error webworker Response/Request types collide with NodeJs types
          convertWranglerResponse(resp, res);
          return res;
        }

        // skip miniflare and serve requested URL from the SPA application
        return next();
      });
    },

    // /** Send HMR message to browser to reload page and emit message whenever Functions file changes */
    async handleHotUpdate(ctx) {
      if (ctx.file.includes(functionEntrypoint!.split('/')[0]))
        ctx.server.hot.send({
          type: 'custom',
          event: 'function-update',
          data: { file: ctx.file },
        });
    },

    // Add the functions directory as another entrypoint
    options(options) {
      options.preserveEntrySignatures = 'allow-extension';
      options.input = {
        ['app']: options.input as string,
        ['api']: functionEntrypoint!,
      };
    },

    /** setup listener on dev mode page */
    transformIndexHtml: {
      order: 'pre',
      handler: () => [
        {
          tag: 'script',
          attrs: { type: 'module' },
          children: `
if (import.meta.hot) {
  let outputColor = "color:cyan; font-weight:bold;"
  console.log("%c ⚙️ Cloudflare Pages Functions HMR active!", outputColor);
  import.meta.hot.on('function-update', (data) => {
    console.log(\`%c ⚙️ Function update detected in file: '\${data.file}'\`, outputColor)
    location.reload(true);
  }); 
}`,
        },
      ],
    },

    /** Worker file must be named _worker.js and located in the root in order for Cloudflare to use it */
    outputOptions(options) {
      options.entryFileNames = (chunk) =>
        chunk.name === 'api' ? '_worker.js' : `${chunk.name}-[hash].js`;
    },

    /** Create a _routes file to avoid functions from firing on all routes and intercepting SPA traffic */
    writeBundle() {
      writeFileSync(
        'dist/_routes.json',
        JSON.stringify(
          {
            version: 1,
            include: allowedApiPaths,
            exclude: excludedApiPaths,
          },
          null,
          2
        )
      );
    },
  };
  return plugin;
}
