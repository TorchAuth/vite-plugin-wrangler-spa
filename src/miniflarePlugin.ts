import { ResolvedCloudflareSpaConfig } from './CloudflareSpaConfig';
import { UnstableDevWorker, unstable_dev } from 'wrangler';
import { doesPathMatch, getViteConfig } from './utils';
import { makeMiniflareFetch } from './utils';
import type { PluginOption } from 'vite';

export const miniflarePlugin = (config: ResolvedCloudflareSpaConfig) => {
  const { functionEntrypoint, wranglerConfig, excludedApiPaths, allowedApiPaths } = config;

  // force wrangler settings that are required for function HMR to work
  if (!wranglerConfig.experimental) wranglerConfig.experimental = {};
  wranglerConfig.experimental.liveReload = true;
  wranglerConfig.experimental.testMode = false;

  let wranglerDevServer: UnstableDevWorker;

  return {
    name: 'vite-plugin-wrangler-spa:miniflare',
    apply: (_, { command }) => command === 'serve',
    config: () => getViteConfig(config),
    configureServer: async (devServer) => {
      if (!wranglerDevServer) {
        wranglerDevServer = await unstable_dev(functionEntrypoint, wranglerConfig);
        devServer.httpServer?.on('close', async () => await wranglerDevServer.stop());
      }

      devServer.middlewares.use(async (req, res, next) => {
        const { url } = req;
        if (url === undefined) throw new Error('url is undefined!');

        if (excludedApiPaths.find((x) => doesPathMatch(x, url))) return next();
        if (allowedApiPaths.find((x) => doesPathMatch(x, url))) {
          console.log('path match');
          return await makeMiniflareFetch(req, res, wranglerDevServer.fetch);
        }

        return next();
      });
    },
    handleHotUpdate: async (ctx) => {
      if (ctx.file.includes(functionEntrypoint.split('/')[0]))
        ctx.server.hot.send({
          type: 'custom',
          event: 'function-update',
          data: { file: ctx.file },
        });
    },
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
  } as PluginOption;
};

const browserHmrNotification = `
if (import.meta.hot) {
  let outputColor = "color:cyan; font-weight:bold;"
  import.meta.hot.on('function-update', (data) => {
    console.log(\`%c 🔥 Cloudflare Pages Function - update detected in file: '\${data.file}'\`, outputColor);
    location.reload(true);
  }); 
}`;
