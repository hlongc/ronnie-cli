/**
 * 信号处理器工具
 * 用于捕获 Ctrl+C (SIGINT) 信号并优雅地退出程序
 */

import chalk from "./chalk";

/**
 * 设置信号处理器
 * 当用户按下 Ctrl+C 时，显示友好的退出消息并退出程序
 */
export function setupSignalHandlers(): void {
  // 捕获 SIGINT 信号 (Ctrl+C)
  process.on("SIGINT", () => {
    console.log("\n");
    console.log(chalk.yellow("✨ 操作已取消，感谢使用！"));
    // 使用状态码 0 干净地退出程序
    process.exit(0);
  });

  // 捕获未处理的异常，避免显示堆栈信息
  process.on("uncaughtException", (err) => {
    console.log(chalk.red("退出操作"));
    // 使用状态码 1 表示错误退出
    process.exit(1);
  });
}
