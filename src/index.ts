import { CloudflareSpaConfig, ResolvedCloudflareSpaConfig } from './CloudflareSpaConfig';
import { miniflarePlugin } from './miniflarePlugin';
import { swcPlugin } from './swcPlugin';

const defaultCloudflareSpaConfig: ResolvedCloudflareSpaConfig = {
  allowedApiPaths: ['/api/*'],
  excludedApiPaths: [],
  functionEntrypoint: 'functions/index.ts',
  external: [],
  wranglerConfig: {
    logLevel: 'log',
    experimental: {
      disableExperimentalWarning: true, //disable because it's annoying
    },
  },
  wranglerConfigPath: 'wrangler.toml',
};

export const viteWranglerSpa = (config: CloudflareSpaConfig = defaultCloudflareSpaConfig) => {
  // merge configs
  const runtimeConfig: ResolvedCloudflareSpaConfig = {
    ...defaultCloudflareSpaConfig, // start with defaults
    ...config, // add user config
  };

  // force wrangler settings that are required for function HMR to work
  if (!runtimeConfig.wranglerConfig.experimental) runtimeConfig.wranglerConfig.experimental = {};
  runtimeConfig.wranglerConfig.experimental.liveReload = true;
  runtimeConfig.wranglerConfig.experimental.testMode = true;

  return [miniflarePlugin(runtimeConfig), swcPlugin(runtimeConfig)];
};
