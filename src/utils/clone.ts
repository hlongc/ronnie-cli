/**
 * Git 克隆工具模块
 * 提供从远程仓库克隆项目到本地的功能
 */

// 导入 simple-git 库，用于执行 Git 操作
import { simpleGit, SimpleGitOptions } from "simple-git";
// 导入操作系统模块，用于获取 CPU 核心数
import os from "os";
// 导入进度估算器，用于显示克隆进度
import createLogger from "progress-estimator";
import figlet from "figlet";
import log from "./log";
import chalk from "./chalk";

/**
 * 创建进度日志记录器
 * 用于在命令行中显示克隆进度
 */
const logger = createLogger({
  spinner: {
    interval: 100, // 动画帧切换间隔时间（毫秒）
    frames: ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠴", "⠦", "⠇", "⠇"].map(
      (frame) => {
        return chalk.green(frame); // 将每个帧设置为绿色
      }
    ),
  },
});

/**
 * Git 操作的配置选项
 */
const gitOptions: Partial<SimpleGitOptions> = {
  baseDir: process.cwd(), // 基础目录，设置为当前工作目录
  binary: "git", // Git 可执行文件的路径
  maxConcurrentProcesses: os.cpus().length, // 最大并发进程数，设置为 CPU 核心数
  trimmed: false, // 是否修剪输出结果
};

async function printer() {
  const data = await figlet.text("ronnie-cli", {
    font: "Standard",
  });
  console.log(chalk.bgBlueBright(data));
}

/**
 * 克隆远程 Git 仓库到本地
 *
 * @param url - 远程仓库的 URL 地址，如 git@github.com:user/repo.git
 * @param projectName - 本地项目文件夹名称，克隆后的仓库将保存在此文件夹中
 * @param options - Git 克隆命令的额外选项数组，如 ['-b', 'main'] 指定分支
 */
export async function clone(
  url: string,
  projectName: string,
  options: string[]
) {
  try {
    // 初始化 Git 实例
    const git = simpleGit(gitOptions);

    // 执行克隆操作并显示进度
    await logger(
      git.clone(url, projectName, options),
      chalk.blueBright("下载中..."), // 进度提示信息
      { estimate: 7000 } // 估计完成时间（毫秒）
    );

    // 克隆成功后的提示信息
    console.log();
    log.success(`${chalk.green("下载成功")}`);
    console.log(chalk.blackBright("========================"));
    console.log(chalk.blackBright("===感谢使用ronnie-cli==="));
    console.log(chalk.blackBright("========================"));

    await printer();
  } catch (e) {
    // 克隆失败时的错误处理
    log.error(chalk.red("下载失败"));
    console.log(e);
  }
}
