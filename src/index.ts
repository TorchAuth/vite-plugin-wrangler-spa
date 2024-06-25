import { CloudflareSpaConfig, ResolvedCloudflareSpaConfig } from './CloudflareSpaConfig';
import { mergeConfig } from 'vite';
import { miniflarePlugin } from './miniflarePlugin';
import { swcPlugin } from './swcPlugin';

const defaultCloudflareSpaConfig: ResolvedCloudflareSpaConfig = {
  allowedApiPaths: ['^/api/*'],
  excludedApiPaths: [],
  functionEntrypoint: 'functions/index.ts',
  external: [],
  wranglerConfig: {
    port: 55554,
    logLevel: 'log',
    experimental: {
      disableExperimentalWarning: true, //disable because it's annoying
    },
  },
  wranglerConfigPath: 'wrangler.toml',
  swcConfig: {
    minify: true,
    sourceMaps: true,
    inlineSourcesContent: true,
    jsc: {
      target: 'esnext',
      parser: {
        tsx: true,
        syntax: 'typescript',
        decorators: true,
      },
      transform: {
        decoratorMetadata: true,
        legacyDecorator: true,
      },
      minify: {
        compress: true,
        mangle: true,
      },
      loose: true,
    },
  },
};

export const viteWranglerSpa = (config: CloudflareSpaConfig = defaultCloudflareSpaConfig) => {
  const runtimeConfig = mergeConfig(defaultCloudflareSpaConfig, config, true) as ResolvedCloudflareSpaConfig;

  return [miniflarePlugin(runtimeConfig), swcPlugin(runtimeConfig)];
};
