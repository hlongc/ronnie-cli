/**
 * 更新命令模块
 * 用于将 ronnie-cli 更新到最新版本
 */
import ora from "ora";
import { execSync } from "child_process";
import chalk from "../utils/chalk";
import log from "../utils/log";
import { name, version } from "../../package.json";
import { getLatestVersion } from "../utils/getLatestVersion";

/**
 * 创建加载动画实例
 * 用于在更新过程中显示友好的加载提示
 */
const spinner = ora({
  text: "ronnie-cli 正在检查最新版本...",
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
 * 更新函数 - 将 ronnie-cli 更新到最新版本
 *
 * 执行流程:
 * 1. 检查最新版本
 * 2. 比较当前版本与最新版本
 * 3. 如果需要更新，执行 npm install 命令
 * 4. 验证更新是否成功
 * 5. 处理可能的错误情况
 */
export async function update() {
  try {
    // 启动加载动画
    spinner.start();

    // 获取 npm 仓库中的最新版本
    const latestVersion = await getLatestVersion(name);

    // 如果当前版本已经是最新版本，则不需要更新
    if (latestVersion === version) {
      spinner.succeed(chalk.green(`已经是最新版本 ${version}`));
      return;
    }

    // 更新加载动画文本，显示版本更新信息
    spinner.text = `正在从 ${version} 更新到 ${latestVersion}...`;

    // 执行 npm 更新命令，使用 execSync 同步执行
    // stdio: "ignore" 表示忽略命令的标准输出和错误输出
    execSync(`npm install -g ${name}@latest`, { stdio: "ignore" });

    // 验证更新是否成功
    try {
      // 停止加载动画
      spinner.stop();

      // 通过执行 ronnie -v 命令获取更新后的版本号
      const updatedVersion = execSync(`ronnie -v`, { encoding: "utf8" }).trim();

      // 显示更新成功信息，包含版本变化
      spinner.succeed(
        chalk.green(`ronnie-cli已更新: ${version} → ${updatedVersion}`)
      );

      // 如果更新后的版本与最新版本不一致，可能存在问题
      if (updatedVersion !== latestVersion) {
        // 发出警告，提示用户可能的问题
        log.warning(
          chalk.yellow(
            `注意: 更新后的版本 (${updatedVersion}) 与最新版本 (${latestVersion}) 不一致`
          )
        );
        log.warning(chalk.yellow(`可能需要检查 npm 缓存或环境变量配置`));
        log.warning(
          chalk.yellow(
            `尝试运行: ${chalk.green("npm cache clean --force")} 然后重新更新`
          )
        );
      }
    } catch (error) {
      // 如果无法获取更新后的版本（可能是命令执行失败）
      spinner.succeed(
        chalk.green(`ronnie-cli已更新到最新版本 ${latestVersion}`)
      );

      // 发出警告，提示用户手动验证
      log.warning(
        chalk.yellow(
          `但无法验证更新是否生效，请手动检查版本: ${chalk.green("ronnie -v")}`
        )
      );
    }
  } catch (err) {
    // 如果更新过程中发生错误（如网络问题、权限问题等）
    spinner.fail(chalk.red("更新失败，请检查网络或手动更新"));

    // 提示用户手动更新的命令
    log.warning(
      chalk.yellow(
        `手动更新命令: ${chalk.green(`npm install -g ${name}@latest`)}`
      )
    );

    // 输出错误详情，方便调试
    console.error(err);
  }
}
