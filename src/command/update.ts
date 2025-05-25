import ora from "ora";
import process from "child_process";
import chalk from "../utils/chalk";

const spinner = ora({
  text: "ronnie-cli 正在更新中...",
  spinner: {
    interval: 100, // 动画帧切换间隔时间（毫秒）
    frames: ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠴", "⠦", "⠇", "⠇"].map(
      (frame) => {
        return chalk.green(frame); // 将每个帧设置为绿色
      }
    ),
  },
});

export async function update() {
  spinner.start();
  process.exec("npm install -g ronnie-cli@latest", (err) => {
    spinner.stop();
    if (err) {
      console.log(chalk.red("更新失败"));
    } else {
      console.log(chalk.green("更新完成"));
    }
  });
}
