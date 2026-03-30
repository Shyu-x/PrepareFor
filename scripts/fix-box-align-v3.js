/**
 * 字符图严格对齐修复脚本 v3
 * 使用精确的全角/半角宽度计算算法
 *
 * 核心算法：
 * 1. 计算每行显示宽度（全角=2，半角=1）
 * 2. 找出最大宽度作为基准
 * 3. 逐行填充对齐
 */

const fs = require('fs');
const path = require('path');

const booksDir = path.join(__dirname, '..', '书籍');
const encoding = 'utf8';

// ==================== 核心算法 ====================

/**
 * 计算字符串的显示宽度
 * 全角字符（中文、日文、标点）= 2
 * 半角字符（英文、数字、符号）= 1
 */
function getDisplayWidth(str) {
  let width = 0;
  for (const char of str) {
    const code = char.charCodeAt(0);

    // 全角字符范围
    if (
      // 中文
      (code >= 0x4E00 && code <= 0x9FFF) ||
      // 中文扩展 A
      (code >= 0x3400 && code <= 0x4DBF) ||
      // 中文扩展 B
      (code >= 0x20000 && code <= 0x2A6DF) ||
      // 全角 ASCII (！～)
      (code >= 0xFF01 && code <= 0xFF5E) ||
      // 全角字母
      (code >= 0xFF00 && code <= 0xFFEF) ||
      // CJK 标点符号
      (code >= 0x3000 && code <= 0x303F) ||
      // 片假名
      (code >= 0x30A0 && code <= 0x30FF) ||
      // 平假名
      (code >= 0x3040 && code <= 0x309F)
    ) {
      width += 2;
    } else if (char === ' ') {
      width += 1; // 半角空格
    } else {
      width += 1; // 其他半角字符
    }
  }
  return width;
}

/**
 * 判断是否为边框字符
 */
function isBorderChar(char) {
  const borderChars = '┏┓┗┛━┃│┌┐└┘├┤┬┴┼═║╔╗╚╝╠╣╦╩╬';
  return borderChars.includes(char);
}

/**
 * 判断是否为边框行（只包含边框字符和空格）
 */
function isBorderLine(line) {
  const content = line.trim();
  if (!content) return false;
  for (const char of content) {
    if (!isBorderChar(char) && char !== ' ') {
      return false;
    }
  }
  return true;
}

/**
 * 分析字符图结构
 */
function analyzeBox(lines, startIdx, endIdx) {
  const boxLines = lines.slice(startIdx, endIdx + 1);

  // 确定边框字符
  const topBorderChars = '┏┓━'; // 顶部可能使用的边框
  const sideBorderChars = '┃│'; // 侧边框
  const cornerChars = '┏┓┗┛'; // 角落字符

  let hasTopBorder = false;
  let hasSideBorder = false;

  // 检测边框类型
  const firstLine = boxLines[0].trim();
  const lastLine = boxLines[boxLines.length - 1].trim();

  // 检查是否有顶部/底部边框
  for (const char of firstLine) {
    if (topBorderChars.includes(char)) {
      hasTopBorder = true;
      break;
    }
  }

  // 检查是否有侧边框
  for (const line of boxLines) {
    if (sideBorderChars.includes(line[0]) || sideBorderChars.includes(line[line.length - 1])) {
      hasSideBorder = true;
      break;
    }
  }

  return {
    lines: boxLines,
    startIdx,
    endIdx,
    hasTopBorder,
    hasSideBorder,
    hasTop: hasTopBorder,
    hasBottom: hasTopBorder
  };
}

/**
 * 检测行是否属于某个字符图
 */
function isBoxLine(line, idx, allLines) {
  const trimmed = line.trim();
  if (!trimmed) return false;

  // 检测顶部边框
  if (/^[┏┌┍┎┐]/.test(trimmed)) return true;

  // 检测底部边框
  if (/[┛┚┙┘]$/.test(trimmed)) return true;

  // 检测侧边框
  if (/^[┃│]/.test(line) || /[┃│]$/.test(trimmed)) {
    // 检查是否在某个框图内
    // 向前查找顶部
    for (let i = idx - 1; i >= 0; i--) {
      const prev = allLines[i].trim();
      if (!prev) continue;
      if (/^[┏┌┍┎┐]/.test(prev)) return true;
      break;
    }
  }

  return false;
}

/**
 * 查找字符图的边界
 */
function findBoxBoundaries(lines, startIdx) {
  const boxLines = [lines[startIdx]];
  let endIdx = startIdx;

  const topPattern = /^[┏┌┍┎┐]/;
  const bottomPattern = /[┛┚┙┘]$/;
  const sidePattern = /^[┃│]/;

  for (let i = startIdx + 1; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // 空行检查
    if (!trimmed) {
      // 检查下一行是否还是框图内容
      if (i + 1 < lines.length) {
        const nextLine = lines[i + 1];
        if (isBoxLine(nextLine, i + 1, lines)) {
          boxLines.push(line);
          endIdx = i;
          continue;
        }
      }
      // 空行可能是框图内部
      if (boxLines.length > 1) {
        boxLines.push(line);
        endIdx = i;
      }
      continue;
    }

    // 边框行或内容行
    if (isBoxLine(line, i, lines)) {
      boxLines.push(line);
      endIdx = i;

      // 如果遇到底部边框，框图结束
      if (bottomPattern.test(trimmed)) {
        break;
      }
    } else {
      break;
    }
  }

  return { lines: boxLines, endIdx };
}

/**
 * 修复单个字符图
 */
function fixBox(boxLines) {
  if (boxLines.length < 2) return boxLines;

  // 计算每行的显示宽度
  const lineWidths = boxLines.map(line => getDisplayWidth(line));

  // 找出最大宽度
  const maxWidth = Math.max(...lineWidths);

  // 逐行修复
  return boxLines.map((line, idx) => {
    const currentWidth = lineWidths[idx];
    const paddingNeeded = maxWidth - currentWidth;

    if (paddingNeeded <= 0) return line;

    const trimmed = line.trimEnd(); // 移除尾部空格后重新计算

    // 判断是边框行还是内容行
    if (isBorderLine(line)) {
      // 边框行：在末尾填充边框字符
      // 找出右侧边框字符
      const trimmedContent = line.trimEnd();
      let rightBorder = '';
      let content = trimmedContent;

      // 找到右侧边框
      for (let i = trimmedContent.length - 1; i >= 0; i--) {
        if (isBorderChar(trimmedContent[i])) {
          rightBorder = trimmedContent[i] + rightBorder;
        } else {
          content = trimmedContent.substring(0, i + 1);
          break;
        }
      }

      // 用边框字符填充
      const fillChar = '━';
      return content + fillChar.repeat(paddingNeeded) + rightBorder;
    } else {
      // 内容行：在末尾填充空格
      return line + ' '.repeat(paddingNeeded);
    }
  });
}

/**
 * 规范化边框字符为统一的全角版本
 */
function normalizeBorderChars(content) {
  const charMap = {
    '┌': '┏', '┐': '┓', '└': '┗', '┘': '┛',
    '─': '━', '│': '┃', '├': '┣', '┤': '┫',
    '┬': '┳', '┴': '┻', '┼': '╋',
    '╭': '┏', '╮': '┓', '╯': '┛', '╰': '┗'
  };

  let result = content;
  for (const [oldChar, newChar] of Object.entries(charMap)) {
    result = result.split(oldChar).join(newChar);
  }
  return result;
}

/**
 * 处理单个文件
 */
function processFile(filePath) {
  let content = fs.readFileSync(filePath, encoding);
  const original = content;

  // 先规范化边框字符
  content = normalizeBorderChars(content);

  const lines = content.split('\n');
  const processedLines = [...lines];
  let modified = false;

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];

    // 检测是否为框图开始（顶部边框）
    if (/^[┏┌┍┎┐]/.test(line.trim())) {
      // 找到框图边界
      const { lines: boxLines, endIdx } = findBoxBoundary(lines, i);

      if (boxLines.length >= 2) {
        // 修复框图
        const fixedLines = fixBox(boxLines);

        // 替换原内容
        for (let j = 0; j < fixedLines.length; j++) {
          processedLines[i + j] = fixedLines[j];
        }

        modified = true;
        i = endIdx + 1;
        continue;
      }
    }

    i++;
  }

  if (modified) {
    const newContent = processedLines.join('\n');
    if (newContent !== original) {
      fs.writeFileSync(filePath, newContent, encoding);
      return true;
    }
  }

  return false;
}

/**
 * 查找框图边界（改进版）
 */
function findBoxBoundary(lines, startIdx) {
  const boxLines = [];
  const topPattern = /^[┏┌┍┎┐]/;
  const bottomPattern = /[┛┚┙┘]$/;
  const sidePattern = /^[┃│]/;

  // 收集连续的相关行
  for (let i = startIdx; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // 空行：检查前后是否是框图
    if (!trimmed) {
      // 如果前面已经有框图内容，检查是否应该继续
      if (boxLines.length > 0) {
        // 检查下一行是否是框图内容
        if (i + 1 < lines.length) {
          const nextTrimmed = lines[i + 1].trim();
          if (nextTrimmed && !isBoxRelatedLine(nextTrimmed)) {
            break;
          }
        }
        boxLines.push(line);
        continue;
      }
      continue;
    }

    // 检查是否是框图相关行
    if (isBoxRelatedLine(trimmed)) {
      boxLines.push(line);

      // 遇到底部边框，框图结束
      if (bottomPattern.test(trimmed)) {
        break;
      }
    } else {
      // 非框图行
      if (boxLines.length > 0) {
        // 可能框图已经结束
        break;
      }
    }
  }

  return { lines: boxLines, endIdx: startIdx + boxLines.length - 1 };
}

/**
 * 判断行是否与框图相关
 */
function isBoxRelatedLine(trimmed) {
  // 顶部/底部边框
  if (/^[┏┓┗┛━]/.test(trimmed) || /[┏┓┗┛━]$/.test(trimmed)) return true;
  // 侧边框
  if (/^[┃│]/.test(trimmed) || /[┃│]$/.test(trimmed)) return true;
  // 内容行（有侧边框）
  if (/^[ ┃│┏┌]/.test(trimmed) && /[┃│ ┏┘]$/.test(trimmed)) return true;

  return false;
}

/**
 * 遍历目录
 */
function processDirectory(dir) {
  const files = fs.readdirSync(dir);
  let count = 0;
  let processed = 0;

  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      const result = processDirectory(filePath);
      count += result.count;
      processed += result.processed;
    } else if (file.endsWith('.md')) {
      processed++;
      if (processFile(filePath)) {
        console.log(`✅ ${filePath}`);
        count++;
      }
    }
  });

  return { count, processed };
}

// ==================== 主函数 ====================

console.log('🔧 严格字符图对齐修复开始...\n');
console.log('算法说明:');
console.log('  - 全角字符宽度 = 2');
console.log('  - 半角字符宽度 = 1');
console.log('  - 最大宽度作为对齐基准');
console.log('  - 边框行填充边框字符，内容行填充空格\n');

const result = processDirectory(booksDir);

console.log(`\n📊 统计:`);
console.log(`  - 处理文件: ${result.processed}`);
console.log(`  - 修复文件: ${result.count}`);
console.log(`\n🎉 完成!`);
