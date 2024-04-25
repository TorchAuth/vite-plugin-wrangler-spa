import { ResolvedCloudflareSpaConfig } from './CloudflareSpaConfig';
import { getViteConfig } from './utils';
import { transform as swcTransform } from '@swc/core';
import { writeFile } from 'node:fs';
import type { PluginOption } from 'vite';
import type { Options as SWCOptions } from '@swc/core';

export const swcPlugin = (config: ResolvedCloudflareSpaConfig) => {
  const { allowedApiPaths, excludedApiPaths } = config;

  let runCommand: 'build' | 'serve';
  let runMode: string;
  const isPagesBuild = () => runCommand === 'build' && runMode === 'page-function';

  const plugin = {
    name: 'vite-plugin-wrangler-spa:swc',
    config: (_, { command, mode }) => {
      runCommand = command;
      runMode = mode;

      if (isPagesBuild()) return getViteConfig(config);
    },
    transform: (code) => (isPagesBuild() ? swcTransform(code, swcDefaults) : null),
    writeBundle: async () => {
      if (isPagesBuild())
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
        );
    },
  } as PluginOption;

  return plugin;
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
