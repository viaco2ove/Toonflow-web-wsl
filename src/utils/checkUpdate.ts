/**
 * 检查 GitHub 最新版本并与本地版本对比
 */

const GITHUB_API_URL = 'https://api.github.com/repos/viaco2ove/Toonflow-web-wsl/tags';
const RELEASE_URL = 'https://github.com/viaco2ove/Toonflow-web-wsl/releases';
const LAST_CHECK_TS_KEY = 'toonflow_last_update_check_ts';
const CHECK_INTERVAL_MS = 24 * 60 * 60 * 1000;

export interface UpdateInfo {
  hasUpdate: boolean;
  currentVersion: string;
  latestVersion: string;
  releaseUrl: string;
}

/**
 * 比较版本号
 * @param current 当前版本 (如 v1.0.7)
 * @param latest 最新版本 (如 v1.0.8)
 * @returns true 如果需要更新
 */
function compareVersions(current: string, latest: string): boolean {
  // 移除 'v' 前缀
  const currentParts = current.replace(/^v/, '').split('.').map(Number);
  const latestParts = latest.replace(/^v/, '').split('.').map(Number);

  for (let i = 0; i < Math.max(currentParts.length, latestParts.length); i++) {
    const currentPart = currentParts[i] || 0;
    const latestPart = latestParts[i] || 0;

    if (latestPart > currentPart) {
      return true;
    }
    if (latestPart < currentPart) {
      return false;
    }
  }

  return false;
}

/**
 * 从 GitHub API 获取最新 tag
 */
async function fetchLatestTag(): Promise<string | null> {
  try {
    const response = await fetch(GITHUB_API_URL);
    if (!response.ok) {
      // GitHub 未鉴权或频率受限时常见 403，这里静默降级，不影响主流程。
      return null;
    }

    const tags = await response.json();
    if (tags && tags.length > 0) {
      // 过滤出符合 vX.X.X 格式的 tag，并取第一个（最新的）
      const versionTags = tags.filter((tag: { name: string }) => /^v\d+\.\d+\.\d+$/.test(tag.name));
      if (versionTags.length > 0) {
        return versionTags[0].name;
      }
    }
    return null;
  } catch (error) {
    // 网络异常静默处理，避免在控制台制造红色噪音。
    return null;
  }
}

/**
 * 是否执行更新检查
 * - 默认仅生产环境执行
 * - 24 小时内最多检查一次
 */
export function shouldCheckForUpdate(): boolean {
  if (!import.meta.env.PROD) return false;
  try {
    const now = Date.now();
    const last = Number(localStorage.getItem(LAST_CHECK_TS_KEY) || 0);
    if (Number.isFinite(last) && last > 0 && now - last < CHECK_INTERVAL_MS) return false;
    localStorage.setItem(LAST_CHECK_TS_KEY, String(now));
  } catch {
    // localStorage 不可用时，不阻断检查
  }
  return true;
}

/**
 * 检查是否需要更新
 * @param currentVersion 当前版本
 */
export async function checkForUpdate(currentVersion: string): Promise<UpdateInfo> {
  const latestVersion = await fetchLatestTag();

  if (!latestVersion) {
    return {
      hasUpdate: false,
      currentVersion,
      latestVersion: currentVersion,
      releaseUrl: RELEASE_URL,
    };
  }

  const hasUpdate = compareVersions(currentVersion, latestVersion);

  return {
    hasUpdate,
    currentVersion,
    latestVersion,
    releaseUrl: RELEASE_URL,
  };
}

export { RELEASE_URL };
