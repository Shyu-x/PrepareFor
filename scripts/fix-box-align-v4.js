/**
 * 字符图严格对齐修复脚本 v4
 * 处理代码块内的字符图
 */

const fs = require('fs');
const path = require('path');

const booksDir = path.join(__dirname, '..', '书籍');
const encoding = 'utf8';

// ==================== 核心算法 ====================

/**
 * 计算字符串的显示宽度（全角=2，半角=1）
 */
function getDisplayWidth(str) {
  let width = 0;
  for (const char of str) {
    const code = char.charCodeAt(0);

    // 全角字符
    if (
      (code >= 0x4E00 && code <= 0x9FFF) ||  // 中文
      (code >= 0x3400 && code <= 0x4DBF) ||  // 中文扩展A
      (code >= 0xFF01 && code <= 0xFF5E) ||  // 全角ASCII
      (code >= 0x3000 && code <= 0x303F) ||  // CJK标点
      (code >= 0x30A0 && code <= 0x30FF) ||  // 片假名
      (code >= 0x3040 && code <= 0x309F)      // 平假名
    ) {
      width += 2;
    } else if (char === ' ') {
      width += 1;
    } else {
      width += 1;
    }
  }
  return width;
}

/**
 * 判断是否为边框字符
 */
function isBorderChar(char) {
  return '┏┓┗┛━┃│┌┐└┘├┤┬┴┼═║╔╗╚╝╠╣╦╩╬'.includes(char);
}

/**
 * 判断是否为边框行
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
 * 判断是否包含框图字符
 */
function hasBoxChars(line) {
  const boxChars = '┏┓┗┛━┃│┌┐└┘';
  for (const char of line) {
    if (boxChars.includes(char)) return true;
  }
  return false;
}

/**
 * 规范化边框字符
 */
function normalizeBorderChars(content) {
  const charMap = {
    '┌': '┏', '┐': '┓', '└': '┗', '┘': '┛',
    '─': '━', '│': '┃', '├': '┣', '┤': '┫',
    '┬': '┳', '┴': '┻', '┼': '╋'
  };

  let result = content;
  for (const [old, newChar] of Object.entries(charMap)) {
    result = result.split(old).join(newChar);
  }
  return result;
}

/**
 * 修复单个字符图
 */
function fixBox(boxLines) {
  if (boxLines.length < 2) return boxLines;

  // 计算每行的显示宽度
  const lineWidths = boxLines.map(line => getDisplayWidth(line));
  const maxWidth = Math.max(...lineWidths);

  return boxLines.map((line, idx) => {
    const currentWidth = lineWidths[idx];
    const paddingNeeded = maxWidth - currentWidth;

    if (paddingNeeded <= 0) return line;

    const trimmed = line.trimEnd();

    if (isBorderLine(line)) {
      // 边框行：填充边框字符
      // 找到右侧边框字符
      let rightBorder = '';
      let content = trimmed;

      for (let i = trimmed.length - 1; i >= 0; i--) {
        if (isBorderChar(trimmed[i])) {
          rightBorder = trimmed[i] + rightBorder;
        } else {
          content = trimmed.substring(0, i + 1);
          break;
        }
      }

      const fillChar = '━';
      return content + fillChar.repeat(paddingNeeded) + rightBorder;
    } else {
      // 内容行：填充空格
      return line + ' '.repeat(paddingNeeded);
    }
  });
}

/**
 * 在代码块内查找并修复字符图
 */
function processCodeBlock(lines, startIdx, endIdx) {
  const blockLines = lines.slice(startIdx, endIdx + 1);
  const boxGroups = [];
  let currentBox = [];
  let boxStart = -1;

  // 找出所有框图行
  for (let i = 0; i < blockLines.length; i++) {
    const line = blockLines[i];
    const trimmed = line.trim();

    if (!trimmed) {
      if (currentBox.length > 0) {
        currentBox.push(line);
      }
      continue;
    }

    // 检查是否为框图相关行
    const isBoxRelated =
      /^[┏┓┗┛━]/.test(trimmed) ||
      /[┏┓┗┛━]$/.test(trimmed) ||
      /^[┃│]/.test(trimmed) ||
      /[┃│]$/.test(trimmed);

    if (isBoxRelated) {
      if (currentBox.length === 0) {
        boxStart = i;
      }
      currentBox.push(line);
    } else {
      if (currentBox.length > 0) {
        boxGroups.push({ lines: currentBox, start: boxStart });
        currentBox = [];
        boxStart = -1;
      }
    }
  }

  // 处理最后一组
  if (currentBox.length > 0) {
    boxGroups.push({ lines: currentBox, start: boxStart });
  }

  // 修复每个框图组
  let offset = 0;
  for (const group of boxGroups) {
    const fixed = fixBox(group.lines);

    // 计算组内每个框图的边界并修复
    let i = 0;
    while (i < fixed.length) {
      const line = fixed[i];
      const trimmed = line.trim();

      // 找到框图开始
      if (/^[┏┓]/.test(trimmed)) {
        // 找到这个框图的所有行
        const boxLines = [line];
        let j = i + 1;
        while (j < fixed.length) {
          const nextLine = fixed[j];
          const nextTrimmed = nextLine.trim();

          if (!nextTrimmed) {
            boxLines.push(nextLine);
            j++;
            continue;
          }

          // 检查是否属于当前框图
          const hasLeft = /^[┃│]/.test(nextTrimmed);
          const hasRight = /[┃│]$/.test(nextTrimmed);
          const isBottom = /[┗┛]$/.test(nextTrimmed);

          if (hasLeft || hasRight || isBottom) {
            boxLines.push(nextLine);
            if (isBottom) break;
            j++;
          } else {
            break;
          }
        }

        // 修复这个框图
        if (boxLines.length >= 2) {
          const fixedBox = fixBox(boxLines);
          // 替换
          for (let k = 0; k < fixedBox.length; k++) {
            blockLines[group.start + i + k] = fixedBox[k];
          }
        }
        i = j + 1;
      } else {
        i++;
      }
    }
  }

  return blockLines;
}

/**
 * 处理单个文件
 */
function processFile(filePath) {
  let content = fs.readFileSync(filePath, encoding);
  const original = content;

  // 规范化边框字符
  content = normalizeBorderChars(content);

  const lines = content.split('\n');
  const processedLines = [...lines];
  let modified = false;

  // 解析代码块
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    // 找到代码块开始
    if (trimmed.startsWith('```')) {
      // 找到代码块结束
      let j = i + 1;
      while (j < lines.length) {
        if (lines[j].trim().startsWith('```')) {
          break;
        }
        j++;
      }

      // 处理代码块内容
      if (j > i + 1) {
        const blockContent = processCodeBlock(lines, i + 1, j - 1);
        for (let k = 0; k < blockContent.length; k++) {
          processedLines[i + 1 + k] = blockContent[k];
        }
        modified = true;
      }

      i = j + 1;
      continue;
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

console.log('🔧 字符图严格对齐修复 v4...\n');

const result = processDirectory(booksDir);

console.log(`\n📊 统计:`);
console.log(`  - 处理文件: ${result.processed}`);
console.log(`  - 修复文件: ${result.count}`);
console.log(`\n🎉 完成!`);
