import { CloudflareSpaConfig } from './CloudflareSpaConfig';
import { builtinModules } from 'module';

export const getViteConfig = (config?: CloudflareSpaConfig) => {
  const input = config?.functionEntrypoint || 'functions/index.ts';
  const external = config?.external || [];

  return {
    ssr: {
      external,
      noExternal: true,
    },
    esbuild: false, // we use SWC to build
    build: {
      rollupOptions: {
        external: [...builtinModules, /^node:/],
        input,
        preserveEntrySignatures: 'allow-extension',
        output: { entryFileNames: '_worker.js' },
      },
      emptyOutDir: false,
      ssr: true,
    },
  };
};
