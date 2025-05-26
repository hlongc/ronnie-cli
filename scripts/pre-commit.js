#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { select } = require("@inquirer/prompts");

// 用户配置文件路径
const USER_CONFIG_PATH = path.join(
  process.cwd(),
  ".version-upgrade-config.json"
);

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

// 获取上次选择
function getLastChoice() {
  try {
    if (fs.existsSync(USER_CONFIG_PATH)) {
      const config = JSON.parse(fs.readFileSync(USER_CONFIG_PATH, "utf8"));
      return config.lastChoice || "none";
    }
  } catch (err) {
    // 如果读取失败，忽略错误，返回默认值
    console.warn("无法读取上次选择，使用默认值");
  }
  return "none";
}

// 保存用户选择
function saveUserChoice(choice) {
  try {
    const config = { lastChoice: choice };
    fs.writeFileSync(USER_CONFIG_PATH, JSON.stringify(config, null, 2) + "\n");
  } catch (err) {
    // 如果保存失败，只记录警告，不影响主流程
    console.warn("无法保存用户选择");
  }
}

async function main() {
  try {
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
        // 否则使用上次选择或默认值
        upgradeType = getLastChoice();
      }

      if (silent) {
        console.log(
          `静默模式: 使用${
            options.upgradeType ? "指定" : "上次"
          }选择 "${upgradeType}"`
        );
      }
    } else {
      // 获取上次选择作为默认值
      const lastChoice = getLastChoice();

      // 交互式提示用户选择版本升级类型
      upgradeType = await select({
        message: "是否要在本次提交中升级版本?",
        choices: [
          { name: "不升级，继续提交", value: "none" },
          { name: "升级主版本 (major)", value: "major" },
          { name: "升级次版本 (minor)", value: "minor" },
          { name: "升级补丁版本 (patch)", value: "patch" },
        ],
        default: lastChoice,
      });

      // 保存用户选择
      saveUserChoice(upgradeType);
    }

    // 如果选择不升级，则继续提交流程
    if (upgradeType === "none") {
      console.log("继续提交流程...");
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

    // 终止提交流程
    process.exit(1);
  } catch (error) {
    console.error("\x1b[31m错误: 发生未预期的异常\x1b[0m");
    console.error(error);
    // 如果出错，允许提交继续进行
    process.exit(0);
  }
}

main();
