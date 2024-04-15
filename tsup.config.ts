import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  dts: true,
  tsconfig: './tsconfig.json',
  splitting: false,
  minify: false,
  format: ['esm'],
  bundle: false,
  platform: 'node',
  external: ['wrangler', 'vite', 'fs', 'node:stream', 'set-cookie-parser'],
});
