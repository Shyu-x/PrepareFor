/**
 * 版本管理脚本
 * 用于自动更新版本号和生成变更日志
 *
 * 作者: Shyu
 * 使用方法: node scripts/version.js [major|minor|patch]
 */

const fs = require('fs');
const path = require('path');

const VERSION_FILE = path.join(__dirname, 'VERSION.md');
const ROOT_DIR = path.join(__dirname, '..');
const PACKAGE_JSON = path.join(ROOT_DIR, 'package.json');

// 读取当前版本
function getCurrentVersion() {
  const content = fs.readFileSync(PACKAGE_JSON, 'utf8');
  const pkg = JSON.parse(content);
  return pkg.version;
}

// 解析版本号
function parseVersion(version) {
  const [major, minor, patch] = version.split('.').map(Number);
  return { major, minor, patch };
}

// 格式化版本号
function formatVersion(version) {
  return `${version.major}.${version.minor}.${version.patch}`;
}

// 更新版本
function bumpVersion(currentVersion, type) {
  const version = parseVersion(currentVersion);

  switch (type) {
    case 'major':
      version.major += 1;
      version.minor = 0;
      version.patch = 0;
      break;
    case 'minor':
      version.minor += 1;
      version.patch = 0;
      break;
    case 'patch':
      version.patch += 1;
      break;
    default:
      console.error('无效的版本类型，请使用 major, minor 或 patch');
      process.exit(1);
  }

  return formatVersion(version);
}

// 更新 package.json
function updatePackageJson(newVersion) {
  const pkg = JSON.parse(fs.readFileSync(PACKAGE_JSON, 'utf8'));
  pkg.version = newVersion;
  fs.writeFileSync(PACKAGE_JSON, JSON.stringify(pkg, null, 2) + '\n');
  console.log(`✓ 更新 package.json: ${newVersion}`);
}

// 更新 VERSION.md
function updateVersionMd(newVersion, type) {
  const date = new Date().toISOString().split('T')[0];
  let content = fs.readFileSync(VERSION_FILE, 'utf8');

  // 替换当前版本
  content = content.replace(/## 当前版本[\s\S]*?```\s*\n.*?\n```/, `## 当前版本\n\n\`\`\`\n${newVersion}\n\`\`\``);

  // 添加版本历史
  const changelogEntry = `### ${newVersion} (${date})

#### 新增功能
- 新版本发布

#### 修复
- 优化和改进

---

`;

  // 在第一个 ### 之后插入
  content = content.replace(/(## 版本历史\n)/, `$1${changelogEntry}`);

  fs.writeFileSync(VERSION_FILE, content);
  console.log(`✓ 更新 VERSION.md`);
}

// 主函数
function main() {
  const type = process.argv[2] || 'patch';

  console.log(`\n🚀 PrepareFor 版本管理器`);
  console.log(`   作者: Shyu\n`);

  const currentVersion = getCurrentVersion();
  console.log(`当前版本: ${currentVersion}`);

  const newVersion = bumpVersion(currentVersion, type);
  console.log(`新版本: ${newVersion}\n`);

  // 确认
  const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  });

  readline.question(`确认更新版本 [${currentVersion}] -> [${newVersion}]? (y/n): `, (answer) => {
    readline.close();

    if (answer.toLowerCase() === 'y') {
      updatePackageJson(newVersion);
      updateVersionMd(newVersion, type);
      console.log(`\n✅ 版本更新完成!\n`);
    } else {
      console.log('\n❌ 已取消\n');
    }
  });
}

main();
