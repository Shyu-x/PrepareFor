/**
 * 全面文件命名规范化脚本
 * 移除所有章节文件夹内的数字前缀，避免生成 HTML 时出现重复编号
 *
 * 规则：
 * - "1-1 xxx.md" 在 "第1章" 文件夹 → "xxx.md"
 * - "2-1 xxx.md" 在 "第2章" 文件夹 → "xxx.md"
 */

const fs = require('fs');
const path = require('path');

const booksDir = path.join(__dirname, '..', '书籍');

// 需要处理的前缀模式
const prefixPatterns = [
  '1-1 ', '1-2 ', '1-3 ', '1-4 ', '1-5 ', '1-6 ', '1-7 ', '1-8 ', '1-9 ', '1-10 ',
  '2-1 ', '2-2 ', '2-3 ', '2-4 ', '2-5 ', '2-6 ', '2-7 ', '2-8 ', '2-9 ', '2-10 ',
  '3-1 ', '3-2 ', '3-3 ', '3-4 ', '3-5 ', '3-6 ', '3-7 ', '3-8 ', '3-9 ', '3-10 ',
  '4-1 ', '4-2 ', '4-3 ', '4-4 ', '4-5 ', '4-6 ', '4-7 ', '4-8 ', '4-9 ', '4-10 ',
  '5-1 ', '5-2 ', '5-3 ', '5-4 ', '5-5 ', '5-6 ', '5-7 ', '5-8 ', '5-9 ', '5-10 ',
  '6-1 ', '6-2 ', '6-3 ', '6-4 ', '6-5 ', '6-6 ', '6-7 ', '6-8 ', '6-9 ', '6-10 ',
  '7-1 ', '7-2 ', '7-3 ', '7-4 ', '7-5 ', '7-6 ', '7-7 ', '7-8 ', '7-9 ', '7-10 ',
];

// 特殊文件映射（保留特定名称）
const specialNames = {
  'README.md': 'README.md',
};

function shouldRename(filename) {
  // 保留特殊文件
  if (specialNames[filename]) return false;

  // 检查是否匹配前缀模式
  for (const prefix of prefixPatterns) {
    if (filename.startsWith(prefix)) {
      return true;
    }
  }
  return false;
}

function removePrefix(filename) {
  for (const prefix of prefixPatterns) {
    if (filename.startsWith(prefix)) {
      return filename.substring(prefix.length);
    }
  }
  return filename;
}

function processDirectory(dir) {
  let renamedCount = 0;

  if (!fs.existsSync(dir)) {
    console.log(`⚠️ 目录不存在: ${dir}`);
    return renamedCount;
  }

  const items = fs.readdirSync(dir);

  for (const item of items) {
    const itemPath = path.join(dir, item);
    const stat = fs.statSync(itemPath);

    if (stat.isDirectory()) {
      renamedCount += processDirectory(itemPath);
    } else if (item.endsWith('.md')) {
      if (shouldRename(item)) {
        const newName = removePrefix(item);
        const newPath = path.join(dir, newName);

        // 如果目标文件已存在，先删除
        if (fs.existsSync(newPath) && item !== newName) {
          fs.unlinkSync(newPath);
        }

        if (item !== newName) {
          fs.renameSync(itemPath, newPath);
          console.log(`✅ ${item} → ${newName}`);
          renamedCount++;
        }
      }
    }
  }

  return renamedCount;
}

console.log('🔄 开始规范化文件命名...\n');

const total = processDirectory(booksDir);

console.log(`\n📊 总共重命名了 ${total} 个文件`);
