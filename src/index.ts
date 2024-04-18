import { CloudflareSpaConfig } from './CloudflareSpaConfig';
import { UnstableDevWorker, unstable_dev } from 'wrangler';
import { convertWranglerResponse, makeWranglerFetch } from './utils';
import { writeFileSync } from 'node:fs';
import type { Plugin, PluginOption } from 'vite';

let wranglerDevServer: UnstableDevWorker;

export default function viteWranglerSpa(
  config?: CloudflareSpaConfig
): PluginOption {
  const functionEntrypoint = config?.functionEntrypoint || 'functions/index.ts';
  const wranglerConfig = config?.wranglerConfig || {
    logLevel: 'log',
  };
  // force these settings so HMR works
  wranglerConfig.experimental = {
    liveReload: true,
    testMode: false,
    disableExperimentalWarning: true, //disable because it's annoying
  };
  const allowedApiPaths = config?.allowedApiPaths || ['/api/*'];
  const excludedApiPaths = config?.excludedApiPaths || [];

  return [
    {
      name: 'vite-wrangler-spa',

      /** Start the wrangler miniflare server */
      configureServer: async (devServer) => {
        if (!wranglerDevServer) {
          wranglerDevServer = await unstable_dev(
            functionEntrypoint,
            wranglerConfig
          );
        }

        //setup middleware to redirect requests to miniflare
        devServer.middlewares.use(async (req, res, next) => {
          const { url } = req;
          if (url === undefined) throw new Error('url is undefined!');

          if (excludedApiPaths.find((x) => new RegExp(x).test(url)))
            return next();

          /** only direct specific requests to the miniflare server so the SPA still renders correctly */
          if (allowedApiPaths.find((x) => new RegExp(x).test(url))) {
            console.log(url);
            const resp = await makeWranglerFetch(req, wranglerDevServer);

            convertWranglerResponse(resp, res);
            return res;
          }

          // skip miniflare and serve requested URL from the SPA application
          return next();
        });
      },

      // /** Send HMR message to browser to reload page and emit message whenever Functions file changes */
      async handleHotUpdate(ctx) {
        if (ctx.file.includes(functionEntrypoint.split('/')[0]))
          ctx.server.hot.send({
            type: 'custom',
            event: 'function-update',
            data: { file: ctx.file },
          });
      },

      // Add the functions directory as another entrypoint
      // Is there a better way to do this?
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
  import.meta.hot.on('function-update', (data) => {
    console.log(\`%c 🔥 Cloudflare Pages Function - update detected in file: '\${data.file}'\`, outputColor);
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
    } as Plugin,
  ];
}
