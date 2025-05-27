#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const readline = require("readline");

// 跟踪打开的文件描述符，以便正确关闭
let ttyFd = null;

// 检测是否在CI/CD环境中运行
function isRunningInCI() {
  // 检查常见的CI环境变量
  return !!(
    process.env.CI || // Travis CI, CircleCI, GitLab CI, GitHub Actions, etc.
    process.env.CONTINUOUS_INTEGRATION ||
    process.env.BUILD_NUMBER || // Jenkins
    process.env.JENKINS_URL ||
    process.env.TEAMCITY_VERSION || // TeamCity
    process.env.GITLAB_CI ||
    process.env.GITHUB_ACTIONS ||
    process.env.TRAVIS
  );
}

// 解析命令行参数
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    silent: false,
    upgradeType: null,
  };

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--silent" || args[i] === "-s") {
      options.silent = true;
    } else if (args[i] === "--upgrade" || args[i] === "-u") {
      if (
        i + 1 < args.length &&
        ["major", "minor", "patch", "none"].includes(args[i + 1])
      ) {
        options.upgradeType = args[i + 1];
        i++;
      }
    }
  }

  return options;
}

// 检查是否处于静默模式
function isSilentMode(options) {
  // 优先检查命令行参数
  if (options.silent) {
    return true;
  }

  // 然后检查环境变量
  return (
    process.env.VERSION_UPGRADE_SILENT === "true" ||
    process.env.VERSION_UPGRADE_SILENT === "1"
  );
}

// 确保在退出前关闭所有资源
function cleanupResources() {
  try {
    // 关闭 TTY 文件描述符
    if (ttyFd !== null) {
      fs.closeSync(ttyFd);
      ttyFd = null;
    }
  } catch (err) {
    console.warn("清理资源时出错:", err.message);
  }
}

/**
 * 使用 Node.js 内置的 readline 模块进行交互式选择
 * @returns {Promise<string>} 用户选择的升级类型
 */
function getInteractiveChoiceWithReadline() {
  return new Promise((resolve, reject) => {
    try {
      // 尝试连接到 /dev/tty（在类Unix系统上）
      let inputStream = process.stdin;
      let outputStream = process.stdout;

      if (process.platform !== "win32") {
        try {
          // 尝试打开 /dev/tty 作为输入
          ttyFd = fs.openSync("/dev/tty", "r+");
          if (ttyFd) {
            console.log("成功连接到 /dev/tty");
            // 不要覆盖全局的 stdin/stdout，仅用于 readline
            inputStream = fs.createReadStream("", { fd: ttyFd });
            outputStream = fs.createWriteStream("", { fd: ttyFd });
          }
        } catch (err) {
          console.warn("无法打开 /dev/tty，将使用标准输入/输出");
        }
      }

      // 创建 readline 接口
      const rl = readline.createInterface({
        input: inputStream,
        output: outputStream,
        terminal: true,
      });

      // 设置超时
      const timeout = setTimeout(() => {
        rl.close();
        console.log("\n选择超时，使用默认选项");
        resolve("none");
      }, 30000); // 30秒超时

      // 显示选项
      console.log("\n请选择版本升级类型:");
      console.log("0) 不升级，继续提交 [默认]");
      console.log("1) 升级主版本 (major)");
      console.log("2) 升级次版本 (minor)");
      console.log("3) 升级补丁版本 (patch)");

      // 提问
      rl.question("输入选项 (1-4): ", (answer) => {
        clearTimeout(timeout); // 清除超时
        rl.close();

        // 映射回答到选项
        const choiceMap = {
          0: "none",
          1: "major",
          2: "minor",
          3: "patch",
          "": "none", // 默认值
        };

        const choice = choiceMap[answer.trim()] || "none";
        resolve(choice);
      });

      // 处理 readline 接口关闭
      rl.on("close", () => {
        clearTimeout(timeout);

        // 无论如何都确保文件描述符被关闭
        if (ttyFd !== null) {
          try {
            fs.closeSync(ttyFd);
            ttyFd = null;
          } catch (err) {
            console.warn("关闭 TTY 文件描述符失败:", err.message);
          }
        }

        // 如果是由于其他原因关闭的，则使用默认值
        if (!rl.closed) {
          console.log("输入被中断，使用默认选项");
          resolve("none");
        }
      });
    } catch (err) {
      console.warn("交互选择发生错误:", err.message);

      // 确保出错时也关闭文件描述符
      if (ttyFd !== null) {
        try {
          fs.closeSync(ttyFd);
          ttyFd = null;
        } catch (closeErr) {
          // 忽略关闭错误
        }
      }

      reject(err);
    }
  });
}

async function main() {
  try {
    // 注册退出处理，确保清理资源
    process.on("exit", cleanupResources);

    // 检查是否在CI/CD环境中
    if (isRunningInCI()) {
      console.log("\x1b[33m检测到CI/CD环境，跳过版本升级检查\x1b[0m");
      process.exit(0); // 在CI环境中允许提交继续
    }

    // 解析命令行参数
    const options = parseArgs();
    const silent = isSilentMode(options);

    // 获取 package.json 路径
    const packageJsonPath = path.join(process.cwd(), "package.json");

    // 检查 package.json 是否存在
    if (!fs.existsSync(packageJsonPath)) {
      console.error("\x1b[31m错误: 未找到 package.json 文件\x1b[0m");
      process.exit(0); // 允许提交继续，因为这可能不是一个 Node.js 项目
    }

    // 检查文件权限
    try {
      fs.accessSync(packageJsonPath, fs.constants.R_OK | fs.constants.W_OK);
    } catch (err) {
      console.error(
        "\x1b[31m错误: 无法读取或写入 package.json 文件 (权限问题)\x1b[0m"
      );
      console.error(err.message);
      process.exit(0);
    }

    let upgradeType;

    // 如果是静默模式或者指定了升级类型
    if (silent || options.upgradeType) {
      // 如果指定了升级类型，使用指定的类型
      if (options.upgradeType) {
        upgradeType = options.upgradeType;
      } else {
        // 否则使用环境变量或默认值
        upgradeType = process.env.VERSION_UPGRADE || "none";
      }

      if (silent) {
        console.log(`静默模式: 使用指定选择 "${upgradeType}"`);
      }
    } else {
      // 尝试使用 readline 进行交互式选择
      try {
        upgradeType = await getInteractiveChoiceWithReadline();
        console.log(`用户选择: ${upgradeType}`);
      } catch (err) {
        // 如果交互方式失败，使用环境变量或默认值
        console.warn("无法获取交互式选择，使用备选方案");
        upgradeType = process.env.VERSION_UPGRADE || "none";
        console.log(`使用备选选项: ${upgradeType}`);
      }
    }

    // 如果选择不升级，则继续提交流程
    if (upgradeType === "none") {
      console.log("继续提交流程...");
      // 在退出前确保资源被清理
      cleanupResources();
      process.exit(0);
    }

    // 读取 package.json 文件
    let packageJson;
    try {
      const fileContent = fs.readFileSync(packageJsonPath, "utf8");
      packageJson = JSON.parse(fileContent);
    } catch (err) {
      if (err instanceof SyntaxError) {
        console.error(
          "\x1b[31m错误: package.json 文件格式无效 (JSON 解析错误)\x1b[0m"
        );
      } else {
        console.error("\x1b[31m错误: 读取 package.json 文件失败\x1b[0m");
      }
      console.error(err.message);
      process.exit(0);
    }

    // 更新 upgrade 字段
    packageJson.upgrade = upgradeType;

    // 写回 package.json 文件
    try {
      fs.writeFileSync(
        packageJsonPath,
        JSON.stringify(packageJson, null, 2) + "\n"
      );
    } catch (err) {
      console.error("\x1b[31m错误: 无法写入 package.json 文件\x1b[0m");
      console.error(err.message);
      process.exit(0);
    }

    console.log(
      `\x1b[33m已更新 package.json 中的 upgrade 字段为: ${upgradeType}\x1b[0m`
    );
    console.log("\x1b[33m提交已终止，请重新提交以包含这些更改。\x1b[0m");
    console.log("\x1b[33m执行以下命令继续:\x1b[0m");
    console.log("\x1b[36m  git add package.json\x1b[0m");
    console.log('\x1b[36m  git commit -m "你的提交信息"\x1b[0m');

    // 在终止提交前确保资源被清理
    cleanupResources();
    process.exit(1);
  } catch (error) {
    console.error("\x1b[31m错误: 发生未预期的异常\x1b[0m");
    console.error(error);
    // 如果出错，允许提交继续进行，但发出警告
    console.warn("\x1b[33m由于错误，将使用默认选项 'none' 继续提交\x1b[0m");

    // 确保在异常情况下也清理资源
    cleanupResources();
    process.exit(0); // 允许提交继续
  }
}

// 添加信号处理
process.on("SIGINT", () => {
  console.log("\n已捕获 SIGINT 信号，使用默认选项继续...");
  cleanupResources();
  process.exit(0); // 允许提交继续
});

process.on("SIGTERM", () => {
  console.log("\n已捕获 SIGTERM 信号，使用默认选项继续...");
  cleanupResources();
  process.exit(0); // 允许提交继续
});

// 捕获未处理的 Promise 拒绝
process.on("unhandledRejection", (reason) => {
  console.error("\x1b[31m未处理的 Promise 拒绝:\x1b[0m", reason);
  cleanupResources();
  process.exit(0); // 允许提交继续
});

// 执行主函数
main().catch((error) => {
  console.error("\x1b[31m主函数执行失败:\x1b[0m", error);
  cleanupResources();
  process.exit(0); // 允许提交继续
});

// 打印环境变量使用说明（只在非交互式模式下显示）
if (!process.stdin.isTTY) {
  console.log("\x1b[32m版本升级提示:\x1b[0m");
  console.log(
    "如果在非交互式环境中运行，可以使用环境变量 VERSION_UPGRADE 设置升级类型:"
  );
  console.log(
    '\x1b[36m  VERSION_UPGRADE=major git commit -m "提交信息"   # 升级主版本\x1b[0m'
  );
  console.log(
    '\x1b[36m  VERSION_UPGRADE=minor git commit -m "提交信息"   # 升级次版本\x1b[0m'
  );
  console.log(
    '\x1b[36m  VERSION_UPGRADE=patch git commit -m "提交信息"   # 升级补丁版本\x1b[0m'
  );
}
