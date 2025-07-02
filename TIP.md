### 🔄 自动版本升级配置

#### 交互式版本升级

当您执行 `git commit` 命令时，系统会自动提示您是否要升级版本：

- **不升级，继续提交**：正常进行代码提交
- **升级主版本 (major)**：更新 package.json 中的 upgrade 字段为 "major"
- **升级次版本 (minor)**：更新 package.json 中的 upgrade 字段为 "minor"
- **升级补丁版本 (patch)**：更新 package.json 中的 upgrade 字段为 "patch"

如果您选择了升级版本，提交将被终止，您需要重新提交以包含对 package.json 的更改。

#### 记住上次选择

系统会自动记住您上次的选择，并在下次提交时将其作为默认选项。这个设置保存在项目根目录的 `.version-upgrade-config.json` 文件中。

#### 静默模式

您可以使用以下方式跳过交互式提示：

1. **命令行参数**：

   ```bash
   # 使用静默模式，采用上次的选择
   # 注意: 双破折号 -- 用于分隔 Git 参数和传递给钩子脚本的参数
   git commit -m "消息" -- --silent

   # 指定升级类型
   git commit -m "消息" -- --upgrade patch

   # 简写形式
   git commit -m "消息" -- -s
   git commit -m "消息" -- -u minor

   # 如果您想完全跳过钩子但仍需应用版本升级
   # 可以组合使用 --no-verify 和自定义参数
   git commit -m "消息" --no-verify -- --silent
   git commit -m "消息" --no-verify -- --upgrade patch
   ```

   > **注意**: 双破折号 `--` 是必需的，它告诉 Git 后面的参数应该传递给钩子脚本而不是 Git 命令本身。

2. **环境变量**：

   ```bash
   # 设置环境变量启用静默模式
   export VERSION_UPGRADE_SILENT=true
   git commit -m "消息"

   # 单次命令使用
   VERSION_UPGRADE_SILENT=true git commit -m "消息"
   ```

#### GitHub Actions 自动发布

在 `package.json` 中的 `upgrade` 字段指定了自动版本升级策略：

```json
{
  "name": "ronnie-cli",
  "version": "0.0.1",
  "upgrade": "patch" // 可选值: "major", "minor", "patch"
  // ... 其他配置
}
```

当代码推送到 `publish` 分支时，GitHub Actions 将根据 `upgrade` 字段指定的策略自动升级版本号。

### 🛠️ 开发者设置

首次克隆项目后，运行以下命令设置 Git 钩子：

```bash
node scripts/setup-hooks.js
```

这将安装必要的依赖并设置 pre-commit 钩子。
