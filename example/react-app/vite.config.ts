import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import { viteWranglerSpa } from '../../src';

export default defineConfig(({ mode, command }) => {
  return {
    build: {
      minify: true,
    },
    plugins: [
      react(),
      viteWranglerSpa({
        miniflareEnabled: command === 'serve',
        swcEnabled: mode === 'page-function' && command === 'build',
        functionEntrypoint: 'functions/index.tsx',
        allowedApiPaths: ['/api/*', '/oauth/*'],
      }),
    ],
  };
});
