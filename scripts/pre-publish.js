#!/usr/bin/env node

/**
 * 发布前检查脚本
 * 限制条件：
 * 1. 只能在main分支执行发布
 * 2. 在CI环境中跳过检测
 * 3. 禁止在本地环境进行发布
 */

const chalk = require("chalk");
const { isRunningInCI } = require("./common");
// 如果在CI环境中，跳过检测
if (isRunningInCI()) {
  console.log(chalk.blue("在CI环境中检测到发布操作，跳过分支检查"));
  process.exit(0);
}

// 禁止在本地环境发布
console.log(chalk.red("❌ 禁止在本地环境进行发布！"));
console.log(chalk.yellow("请使用CI流水线进行包的发布操作。"));
process.exit(1);
