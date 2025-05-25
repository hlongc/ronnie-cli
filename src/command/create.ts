/**
 * 项目创建命令实现文件
 * 负责处理创建新项目的逻辑，包括模板选择和项目克隆
 */

// 导入交互式命令行提示工具
import { input, select } from "@inquirer/prompts";
// 导入克隆工具函数
import { clone } from "../utils/clone";
import path from "path";
import fs from "fs";
import { Chalk } from "chalk";

const chalk = new Chalk({ level: 3 });

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

/**
 * 创建新项目的核心函数
 * @param projectName - 可选的项目名称，如果未提供则会通过交互式提示获取
 */
export async function create(projectName?: string) {
  // 如果未提供项目名称，则通过交互式提示获取
  if (!projectName) {
    projectName = await input({ message: "请输入项目名称", required: true });
    console.log(projectName);
  }

  const targetPath = path.resolve(process.cwd(), projectName);
  if (fs.existsSync(targetPath)) {
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
