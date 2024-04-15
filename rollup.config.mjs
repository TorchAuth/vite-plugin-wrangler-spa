import { defineConfig } from "rollup";
import copy from "rollup-plugin-copy";
import ts from "rollup-plugin-ts";

const options = defineConfig({
  input: "src/index.ts",
  output: {
    dir: "dist",
    format: "esm",
  },
  external: ["wrangler", "vite", "fs", "node:stream", "set-cookie-parser"],
  plugins: [
    copy({
      targets: [
        { src: "../../README.md", dest: "./" },
        { src: "../../LICENSE", dest: "./" },
      ],
    }),
    ts({
      transpiler: "swc",
    }),
  ],
});

export default options;
