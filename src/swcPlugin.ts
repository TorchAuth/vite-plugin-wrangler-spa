import { ResolvedCloudflareSpaConfig } from './CloudflareSpaConfig';
import { UserConfig } from 'vite';
import { builtinModules } from 'node:module';
import { transform as swcTransform } from '@swc/core';
import { writeFile } from 'node:fs';
import type { PluginOption } from 'vite';

const getViteConfig = ({ functionEntrypoint, external }: ResolvedCloudflareSpaConfig) => {
  return {
    ssr: {
      external,
      noExternal: true,
    },
    esbuild: false, // we use SWC to build
    build: {
      sourcemap: true, // always include sourcemaps
      rollupOptions: {
        external: [...builtinModules, /^node:/],
        input: functionEntrypoint,
        preserveEntrySignatures: 'allow-extension',
        output: { entryFileNames: '_worker.js' },
      },
      emptyOutDir: false,
      ssr: true,
    },
  } as UserConfig;
};

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
            include: allowedApiPaths.map((x) => x.replace('^', '')),
            exclude: excludedApiPaths.map((x) => x.replace('^', '')),
          },
          null,
          2
        ),
        (err) => (err ? console.error(err.message) : null)
      ),
  } as PluginOption;
};
