import { CloudflareSpaConfig } from './CloudflareSpaConfig';
import { UnstableDevWorker, unstable_dev } from 'wrangler';
import { convertWranglerResponse, makeWranglerFetch } from './utils';
import { getViteConfig } from './util';
import type { Plugin, PluginOption } from 'vite';

export const miniflarePlugin: (config?: CloudflareSpaConfig) => PluginOption = (config?: CloudflareSpaConfig) => {
  if (!config?.miniflareEnabled) return false;

  let wranglerDevServer: UnstableDevWorker;

  const functionEntrypoint = config?.functionEntrypoint || 'functions/index.ts';
  const wranglerConfig = config?.wranglerConfig || {
    logLevel: 'log',
  };

  // force these Wrangler settings so HMR works for pages functions
  wranglerConfig.experimental = {
    liveReload: true,
    testMode: false,
    disableExperimentalWarning: true, //disable because it's annoying
  };

  const allowedApiPaths = config?.allowedApiPaths || ['/api/*'];
  const excludedApiPaths = config?.excludedApiPaths || [];

  return {
    name: 'vite-wrangler-spa:miniflare',

    config: () => getViteConfig(config),

    /** Start the wrangler miniflare server */
    configureServer: async (devServer) => {
      if (!wranglerDevServer) {
        wranglerDevServer = await unstable_dev(functionEntrypoint, wranglerConfig);
      }

      //setup middleware to redirect requests to miniflare
      devServer.middlewares.use(async (req, res, next) => {
        const { url } = req;
        if (url === undefined) throw new Error('url is undefined!');

        if (excludedApiPaths.find((x) => new RegExp(x).test(url))) return next();

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

    /** setup listener on dev mode page */
    transformIndexHtml: {
      order: 'pre',
      handler: () => [
        {
          tag: 'script',
          attrs: { type: 'module' },
          children: browserHmrNotification,
        },
      ],
    },
  } as Plugin;
};

const browserHmrNotification = `
if (import.meta.hot) {
  let outputColor = "color:cyan; font-weight:bold;"
  import.meta.hot.on('function-update', (data) => {
    console.log(\`%c 🔥 Cloudflare Pages Function - update detected in file: '\${data.file}'\`, outputColor);
    location.reload(true);
  }); 
}`;
