import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import viteWranglerSpa from '../../src';

export default defineConfig({
  build: {
    minify: false,
  },
  plugins: [
    react(),
    viteWranglerSpa({
      functionEntrypoint: 'functions/index.tsx',
    }),
  ],
});
