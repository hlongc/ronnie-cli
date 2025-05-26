/**
 * 项目创建命令实现文件
 * 负责处理创建新项目的逻辑，包括模板选择和项目克隆
 */

// 导入交互式命令行提示工具
import { input, select, confirm } from "@inquirer/prompts";
// 导入克隆工具函数
import { clone } from "../utils/clone";
import path from "path";
import fs from "fs-extra";
import fetch from "node-fetch";
import { name, version } from "../../package.json";
import chalk from "../utils/chalk";

/**
 * 模板信息接口定义
 * 描述了一个项目模板的基本信息
 */
interface TemplateInfo {
  name: string; // 模板名称
  branch: string; // Git 分支名称
  git: string; // Git 仓库地址
  description: string; // 模板描述信息
}

/**
 * 模板配置映射
 * 存储所有可用的项目模板信息
 */
const templateMap: Map<string, TemplateInfo> = new Map([
  [
    "eslint插件",
    {
      name: "eslint插件",
      branch: "main",
      git: "git@github.com:hlongc/eslint-plugin-ronnie.git",
      description: "eslint插件",
    },
  ],
  [
    "big-react",
    {
      name: "big-react",
      branch: "dev",
      git: "git@github.com:hlongc/big-react.git",
      description: "big-react",
    },
  ],
]);

async function getLatestVersion(packageName: string) {
  const response = await fetch(`https://registry.npmjs.org/${packageName}`);
  const data = (await response.json()) as any;
  return data["dist-tags"].latest as string;
}

/**
 * 检查当前版本是否过时
 */
async function checkVersion() {
  const latestVersion = await getLatestVersion(name);
  if (latestVersion > version) {
    console.log(
      `当前版本 ${chalk.red(version)} 已过时，建议升级到最新版本 ${chalk.green(
        latestVersion
      )}`
    );
    console.log(
      `可通过 ${chalk.green(
        `npm install -g ${name}@latest`
      )} 升级 或者 ${chalk.green(`ronnie update`)} 升级`
    );
  }
}
/**
 * 创建新项目的核心函数
 * @param projectName - 可选的项目名称，如果未提供则会通过交互式提示获取
 */
export async function create(projectName?: string) {
  // 如果未提供项目名称，则通过交互式提示获取
  if (!projectName) {
    projectName = (
      await input({
        message: "请输入项目名称",
        required: true,
        validate: (value) => {
          if (!value.trim()) {
            return "项目名称不能为空";
          }
          return true;
        },
      })
    ).trim();
  }

  // 检查更新
  await checkVersion();

  const isCurrentDir = projectName === ".";
  projectName = isCurrentDir ? path.resolve("../", process.cwd()) : projectName;

  const targetPath = path.resolve(process.cwd(), projectName);

  if (fs.existsSync(targetPath)) {
    if (isCurrentDir) {
      const ensure = await confirm({
        message: "确定在当前目录创建项目吗？会进行覆盖操作",
        default: true,
      });
      if (ensure) {
        fs.emptyDirSync(targetPath);
      } else {
        console.log(chalk.red("取消创建"));
        return;
      }
    } else {
      console.log(chalk.red(`项目 ${projectName} 已存在`));
      const goon = await select({
        message: "项目已存在，是否进行覆盖？",
        choices: [
          { name: "覆盖", value: true },
          { name: "取消", value: false },
        ],
      });
      if (goon) {
        fs.rmSync(targetPath, { recursive: true, force: true });
      } else {
        console.log(chalk.red("取消创建"));
        return;
      }
    }
  }

  // 将模板映射转换为选择列表格式
  const choices = Array.from(templateMap).map(
    ([templateName, templateInfo]) => {
      return {
        name: templateName,
        value: templateName,
        description: templateInfo.description,
      };
    }
  );

  // 通过交互式提示选择项目模板
  const template = await select({ message: "请选择模板", choices });
  // 获取选定模板的详细信息
  const templateInfo = templateMap.get(template);
  // 如果找到模板信息，则执行克隆操作
  if (templateInfo) {
    clone(templateInfo.git, projectName, ["-b", templateInfo.branch]);
  }
}
