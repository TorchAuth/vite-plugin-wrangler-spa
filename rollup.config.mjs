import { defineConfig } from 'rollup';
import ts from 'rollup-plugin-ts';

const options = defineConfig({
  input: 'src/index.ts',
  output: {
    dir: 'dist',
    format: 'esm',
  },
  external: ['wrangler', 'vite', /node:/, 'set-cookie-parser', '@swc/core', 'module'],
  plugins: [ts()],
});

export default options;
