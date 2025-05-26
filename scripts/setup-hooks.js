#!/usr/bin/env node

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

// 确保 scripts 目录存在
const scriptsDir = path.join(process.cwd(), "scripts");
if (!fs.existsSync(scriptsDir)) {
  fs.mkdirSync(scriptsDir);
}

// 安装 Husky
console.log("安装 Husky...");
execSync("npm run prepare", { stdio: "inherit" });

// 确保 pre-commit 脚本有执行权限
console.log("设置执行权限...");
try {
  execSync("chmod +x .husky/pre-commit", { stdio: "inherit" });
  execSync("chmod +x scripts/pre-commit.js", { stdio: "inherit" });
  console.log("执行权限设置完成");
} catch (error) {
  console.warn("设置执行权限时出错，如果您在 Windows 上，这可能是正常的");
}

console.log("Git 钩子设置完成！");
