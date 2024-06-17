import { ResolvedCloudflareSpaConfig } from './CloudflareSpaConfig';
import { getViteConfig } from './utils';
import { transform as swcTransform } from '@swc/core';
import { writeFile } from 'node:fs';
import type { PluginOption } from 'vite';

export const swcPlugin = (config: ResolvedCloudflareSpaConfig) => {
  const { allowedApiPaths, excludedApiPaths, swcConfig } = config;

  return {
    name: 'vite-plugin-wrangler-spa:swc',
    apply: (_, { command, mode }) => command === 'build' && mode === 'page-function',
    config: () => getViteConfig(config),
    transform: (code) => swcTransform(code, swcConfig),
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
