import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import viteWranglerSpa from '../../src';

const devPlugins = [
  react(),
  viteWranglerSpa({
    functionEntrypoint: 'functions/index.tsx',
    allowedApiPaths: ['/api/*', '/oauth/*'],
  }),
];
const pagesBuildPlugins = [react()];
const functionBuildPlugins = [
  viteWranglerSpa({
    functionEntrypoint: 'functions/index.tsx',
    allowedApiPaths: ['/api/*', '/oauth/*'],
  }),
];

export default defineConfig(({ mode, command }) => {
  let plugins = devPlugins;
  if (command === 'build') {
    plugins = pagesBuildPlugins;
    if (mode === 'page-function') plugins = functionBuildPlugins;
  }

  return {
    build: {
      minify: true,
    },
    plugins,
  };
});
