/**
 * 检测是否在CI/CD环境中运行
 * 通过检查各种CI服务的环境变量来判断
 *
 * @returns {boolean} 是否在CI环境中运行
 */
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

module.exports = {
  isRunningInCI,
};
