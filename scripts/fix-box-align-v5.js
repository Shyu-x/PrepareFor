/**
 * 字符图严格对齐修复脚本 v5
 * 简化版 - 直接处理代码块内的所有行
 */

const fs = require('fs');
const path = require('path');

const booksDir = path.join(__dirname, '..', '书籍');
const encoding = 'utf8';

// ==================== 核心算法 ====================

/**
 * 计算显示宽度（全角=2，半角=1）
 */
function getDisplayWidth(str) {
  let width = 0;
  for (const char of str) {
    const code = char.charCodeAt(0);
    // 中文和全角
    if (
      (code >= 0x4E00 && code <= 0x9FFF) ||  // 中文
      (code >= 0x3400 && code <= 0x4DBF) ||  // 中文扩展A
      (code >= 0xFF01 && code <= 0xFF5E) ||  // 全角ASCII
      (code >= 0x3000 && code <= 0x303F) ||  // CJK标点
      (code >= 0x30A0 && code <= 0x30FF) ||  // 片假名
      (code >= 0x3040 && code <= 0x309F)      // 平假名
    ) {
      width += 2;
    } else {
      width += 1;
    }
  }
  return width;
}

/**
 * 判断是否为边框行（只有边框字符和空格）
 */
function isBorderOnlyLine(line) {
  const trimmed = line.trim();
  if (!trimmed) return false;
  for (const char of trimmed) {
    if (!'┏┓┗┛━┃│ '.includes(char)) return false;
  }
  return true;
}

/**
 * 规范化边框字符
 */
function normalizeChars(content) {
  const map = {
    '┌': '┏', '┐': '┓', '└': '┗', '┘': '┛',
    '─': '━', '│': '┃'
  };
  let result = content;
  for (const [old, n] of Object.entries(map)) {
    result = result.split(old).join(n);
  }
  return result;
}

/**
 * 修复框图
 */
function fixDiagram(lines) {
  if (lines.length < 2) return lines;

  // 计算最大宽度
  const widths = lines.map(l => getDisplayWidth(l));
  const maxWidth = Math.max(...widths);

  // 逐行修复
  return lines.map((line, idx) => {
    const currentWidth = widths[idx];
    const diff = maxWidth - currentWidth;

    if (diff <= 0) return line;

    const trimmed = line.trimEnd();

    if (isBorderOnlyLine(line)) {
      // 边框行：找到右侧边框字符，填充━
      let rightBorder = '';
      let content = trimmed;

      for (let i = trimmed.length - 1; i >= 0; i--) {
        if ('┏┓┗┛━┃│'.includes(trimmed[i])) {
          rightBorder = trimmed[i] + rightBorder;
        } else {
          content = trimmed.substring(0, i + 1);
          break;
        }
      }

      return content + '━'.repeat(diff) + rightBorder;
    } else {
      // 内容行：填充空格
      return line + ' '.repeat(diff);
    }
  });
}

/**
 * 查找框图组
 */
function findDiagramGroups(lines) {
  const groups = [];
  let currentGroup = [];
  let groupStart = -1;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // 空行
    if (!trimmed) {
      if (currentGroup.length > 0) {
        currentGroup.push(line);
      }
      continue;
    }

    // 检查是否包含框图字符
    const hasBox = /[┏┓┗┛━┃│]/.test(trimmed);

    if (hasBox) {
      if (currentGroup.length === 0) {
        groupStart = i;
      }
      currentGroup.push(line);
    } else {
      if (currentGroup.length > 0) {
        groups.push({ lines: currentGroup, start: groupStart });
        currentGroup = [];
        groupStart = -1;
      }
    }
  }

  if (currentGroup.length > 0) {
    groups.push({ lines: currentGroup, start: groupStart });
  }

  return groups;
}

/**
 * 处理文件
 */
function processFile(filePath) {
  let content = fs.readFileSync(filePath, encoding);
  const original = content;

  // 规范化
  content = normalizeChars(content);

  const lines = content.split('\n');
  const result = [...lines];

  // 解析代码块
  let i = 0;
  let modified = false;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    // 代码块开始
    if (trimmed.startsWith('```') && trimmed.length > 3) {
      // 找到代码块结束
      let j = i + 1;
      while (j < lines.length) {
        if (lines[j].trim().startsWith('```')) break;
        j++;
      }

      // 处理代码块内的框图
      if (j > i + 1) {
        const blockLines = lines.slice(i + 1, j);
        const groups = findDiagramGroups(blockLines);

        for (const group of groups) {
          if (group.lines.length >= 2) {
            const fixed = fixDiagram(group.lines);
            for (let k = 0; k < fixed.length; k++) {
              result[i + 1 + group.start + k] = fixed[k];
            }
            modified = true;
          }
        }
      }

      i = j + 1;
      continue;
    }

    i++;
  }

  if (modified) {
    const newContent = result.join('\n');
    if (newContent !== original) {
      fs.writeFileSync(filePath, newContent, encoding);
      return true;
    }
  }

  return false;
}

/**
 * 遍历目录
 */
function processDirectory(dir) {
  const files = fs.readdirSync(dir);
  let count = 0;
  let processed = 0;

  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      const r = processDirectory(filePath);
      count += r.count;
      processed += r.processed;
    } else if (file.endsWith('.md')) {
      processed++;
      if (processFile(filePath)) {
        console.log(`✅ ${filePath}`);
        count++;
      }
    }
  }

  return { count, processed };
}

// ==================== 主函数 ====================

console.log('🔧 字符图严格对齐修复 v5...\n');

const result = processDirectory(booksDir);

console.log(`\n📊 统计:`);
console.log(`  - 处理文件: ${result.processed}`);
console.log(`  - 修复文件: ${result.count}`);
console.log(`\n🎉 完成!`);
