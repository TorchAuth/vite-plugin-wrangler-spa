import { ResolvedCloudflareSpaConfig } from './CloudflareSpaConfig';
import { unstable_dev } from 'wrangler';
import type { PluginOption } from 'vite';

export const miniflarePlugin = (config: ResolvedCloudflareSpaConfig) => {
  const { functionEntrypoint, wranglerConfig, allowedApiPaths } = config;

  // force wrangler settings that are required for function HMR to work
  if (!wranglerConfig.experimental) wranglerConfig.experimental = {};
  wranglerConfig.experimental.liveReload = true;
  wranglerConfig.experimental.testMode = false;

  return {
    name: 'vite-plugin-wrangler-spa:miniflare',
    apply: 'serve',
    configResolved: async (viteConfig) => {
      viteConfig.server.proxy = allowedApiPaths.reduce(
        (acc, curr) => ({ ...acc, [curr]: `http://127.0.0.1:${wranglerConfig.port}` }),
        {}
      );
    },
    configureServer: async (devServer) => {
      return async () => {
        const wranglerDevServer = await unstable_dev(functionEntrypoint, wranglerConfig);
        devServer.httpServer?.on('close', async () => await wranglerDevServer.stop());
      };
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
