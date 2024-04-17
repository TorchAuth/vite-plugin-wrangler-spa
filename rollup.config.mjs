import { defineConfig } from 'rollup';
import copy from 'rollup-plugin-copy';
import ts from 'rollup-plugin-ts';

const options = defineConfig({
  input: 'src/index.ts',
  output: {
    dir: 'dist',
    format: 'esm',
  },
  external: ['wrangler', 'vite', 'node:fs', 'node:stream', 'set-cookie-parser'],
  plugins: [
    copy({
      targets: [
        { src: './README.md', dest: './dist' },
        { src: './LICENSE', dest: './dist' },
        { src: './package.json', dest: './dist' },
      ],
    }),
    ts(),
  ],
});

export default options;
