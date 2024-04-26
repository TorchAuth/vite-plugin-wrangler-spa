import { ResolvedCloudflareSpaConfig } from './CloudflareSpaConfig';
import { getViteConfig } from './utils';
import { transform as swcTransform } from '@swc/core';
import { writeFile } from 'node:fs';
import type { PluginOption } from 'vite';
import type { Options as SWCOptions } from '@swc/core';

export const swcPlugin = (config: ResolvedCloudflareSpaConfig) => {
  const { allowedApiPaths, excludedApiPaths } = config;

  return {
    name: 'vite-plugin-wrangler-spa:swc',
    apply: (_, { command, mode }) => command === 'build' && mode === 'page-function',
    config: () => getViteConfig(config),
    transform: (code) => swcTransform(code, swcDefaults),
    writeBundle: async () =>
      await writeFile(
        'dist/_routes.json',
        JSON.stringify(
          {
            version: 1,
            include: allowedApiPaths,
            exclude: excludedApiPaths,
          },
          null,
          2
        ),
        (err) => (err ? console.error(err.message) : null)
      ),
  } as PluginOption;
};

const swcDefaults: SWCOptions = {
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
};
