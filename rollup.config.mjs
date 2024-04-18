import { defineConfig } from 'rollup';
import ts from 'rollup-plugin-ts';

const options = defineConfig({
  input: 'src/index.ts',
  output: {
    dir: 'dist',
    format: 'esm',
  },
  external: ['wrangler', 'vite', 'node:fs', 'node:stream', 'set-cookie-parser'],
  plugins: [ts()],
});

export default options;
