import { CloudflareSpaConfig } from './CloudflareSpaConfig';
import { getViteConfig } from './util';
import { transform } from '@swc/core';
import { writeFileSync } from 'node:fs';
import type { Plugin, PluginOption } from 'vite';
import type { Options as SWCOptions } from '@swc/core';

export const swcPlugin: (config?: CloudflareSpaConfig) => PluginOption = (config?: CloudflareSpaConfig) => {
  if (!config?.swcEnabled) return false;

  return {
    name: 'vite-plugin-wrangler-spa:swc',

    config: () => getViteConfig(config),

    transform(code) {
      return transform(code, {
        ...swcDefaults,
        sourceMaps: true,
      });
    },

    /** Create a _routes file to avoid functions from firing on all routes and intercepting SPA traffic */
    writeBundle() {
      writeFileSync(
        'dist/_routes.json',
        JSON.stringify(
          {
            version: 1,
            include: config?.allowedApiPaths || ['/api/*'],
            exclude: config?.excludedApiPaths || [],
          },
          null,
          2
        )
      );
    },
  } as Plugin;
};

const swcDefaults: SWCOptions = {
  minify: true,
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
