import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import { viteWranglerSpa } from '../../src';

export default defineConfig(() => {
  return {
    plugins: [
      react(),
      viteWranglerSpa({
        functionEntrypoint: 'functions/index.tsx',
        allowedApiPaths: ['^/api/*', '^/oauth/*'],
      }),
    ],
  };
});
