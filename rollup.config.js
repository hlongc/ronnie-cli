/**
 * Rollup 配置文件
 * 用于构建 Node.js CLI 工具
 */

// 导入 Rollup 配置定义函数
import { defineConfig } from "rollup";
// 帮助解析 Node.js 模块（将 node_modules 中的依赖解析为 ES 模块）
import nodeResolve from "@rollup/plugin-node-resolve";
// 将 CommonJS 模块转换为 ES 模块，使其可以被 Rollup 处理
import commonjs from "@rollup/plugin-commonjs";
// 将 package.json 中的依赖项标记为外部依赖，不会被打包进最终产物
import external from "rollup-plugin-node-externals";
// 允许导入 JSON 文件作为 ES 模块
import json from "@rollup/plugin-json";
// 压缩和混淆代码，减小最终包的大小
import terser from "@rollup/plugin-terser";
// 处理 TypeScript 文件的编译，将 TS 转换为 JS
import typescript from "rollup-plugin-typescript2";

export default defineConfig([
  {
    // 入口文件配置，指定入口文件路径
    input: { index: "src/index.ts" },

    // 输出配置
    output: [
      {
        dir: "dist", // 输出目录
        format: "cjs", // 输出格式为 CommonJS，适用于 Node.js 环境
      },
    ],

    // 插件配置（按照处理顺序排列）
    plugins: [
      // 解析 Node.js 模块
      // 作用：查找并解析第三方依赖模块，使 Rollup 能够处理 node_modules 中的包
      nodeResolve(),

      // 标记外部依赖
      // 作用：将 package.json 中的依赖项标记为外部依赖，不会被打包进最终产物
      // 参数 deps: false 表示不自动将 dependencies 中的依赖标记为外部依赖
      external({ deps: false }),

      // 编译 TypeScript
      // 作用：将 TypeScript 代码转换为 JavaScript，使 Rollup 能够处理 .ts 文件
      typescript(),

      // 处理 JSON 文件
      // 作用：允许直接导入 JSON 文件，如 package.json 中的版本号等信息
      json(),

      // 转换 CommonJS 模块
      // 作用：将 CommonJS 格式的模块转换为 ES 模块，使 Rollup 能够处理
      commonjs(),

      // 代码压缩和混淆
      // 作用：减小最终包的大小，优化生产环境下的性能
      terser(),
    ],
  },
]);
