/**
 * ronnie CLI 工具的入口文件
 * 负责定义和处理命令行指令
 */

// 导入 commander 库，用于构建命令行工具
import { Command } from "commander";
// 从 package.json 导入版本号
import { version } from "../package.json";
// 导入 create 命令的实现
import { create } from "./command/create";
import { update } from "./command/update";
import { setupSignalHandlers } from "./utils/signal-handler";

// 设置信号处理器，必须在程序开始时调用
setupSignalHandlers();

// 初始化命令行程序，设置程序名称为 "ronnie"
const program = new Command("ronnie");
// 设置版本号和版本选项标志
program.version(version, "-v,--version");

// 定义 create 子命令
program
  .command("create [project-name]")
  .description("create a new project powered by ronnie-cli")
  .action((projectName) => {
    // 调用 create 函数处理创建项目的逻辑
    create(projectName);
  });

program
  .command("update")
  .description("更新ronnie-cli")
  .action(() => {
    update();
  });

// 解析命令行参数并执行对应的命令
program.parse();
