import { ResolvedCloudflareSpaConfig } from './CloudflareSpaConfig';
import { UserConfig } from 'vite';
import { builtinModules } from 'node:module';

export const getViteConfig = ({ functionEntrypoint, external }: ResolvedCloudflareSpaConfig) => {
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
