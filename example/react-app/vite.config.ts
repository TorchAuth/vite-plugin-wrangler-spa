import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import viteWranglerSpa from '../../src';

const pagesPlugins = [
  react(),
  viteWranglerSpa({
    functionEntrypoint: 'functions/index.tsx',
  }),
];

const functionBuildPlugins = [
  viteWranglerSpa({
    functionEntrypoint: 'functions/index.tsx',
  }),
];

export default defineConfig(({ mode, command }) => ({
  plugins:
    mode === 'page-function' && command === 'build'
      ? functionBuildPlugins
      : pagesPlugins,
}));
