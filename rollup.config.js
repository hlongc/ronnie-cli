import { defineConfig } from "rollup";
import nodeResolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import external from "rollup-plugin-node-externals";
import json from "@rollup/plugin-json";
import terser from "@rollup/plugin-terser";
import typescript from "rollup-plugin-typescript2";

export default defineConfig([
  {
    input: { index: "src/index.ts" },
    output: [{ dir: "dist", format: "cjs" }],
    plugins: [
      nodeResolve(),
      external({ deps: false }),
      typescript(),
      json(),
      commonjs(),
      terser(),
    ],
  },
]);
