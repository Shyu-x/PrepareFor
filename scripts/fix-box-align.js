/**
 * 框图规范化脚本 v2
 * 自动分析和修复框图对齐问题
 */

const fs = require('fs');
const path = require('path');

const booksDir = path.join(__dirname, '..', '书籍');

// 统计框图信息
function analyzeBox(content) {
  const lines = content.split('\n');
  const boxes = [];
  let inBox = false;
  let boxStart = -1;
  let boxLines = [];

  lines.forEach((line, idx) => {
    // 检测框图开始
    if (line.match(/^[┏┌┍┎┐]/)) {
      inBox = true;
      boxStart = idx;
      boxLines = [line];
    } else if (inBox) {
      if (line.match(/[┛┚┙┘]$/) || line.match(/^[┗┛┚┙┘]/)) {
        // 框图结束
        boxLines.push(line);
        boxes.push({
          start: boxStart,
          end: idx,
          lines: [...boxLines]
        });
        inBox = false;
        boxLines = [];
      } else if (line.match(/^[┃│]/)) {
        boxLines.push(line);
      }
    }
  });

  return boxes;
}

// 计算显示宽度（全角=2，半角=1）
function getDisplayWidth(str) {
  let width = 0;
  for (const char of str) {
    if (/[\u3000-\u303f\uff00-\uffef\u4e00-\u9faf\u3400-\u4dbf]/.test(char)) {
      width += 2; // 中文全角
    } else if (/[┏┓┗┛━┃│┏┓┗┛]/.test(char)) {
      width += 1; // 框图字符视为半宽
    } else if (/[！-～]/.test(char)) {
      width += 1; // 全角 ASCII
    } else {
      width += 1; // 半角
    }
  }
  return width;
}

// 修复单个框图
function fixBox(lines) {
  if (lines.length < 2) return lines;

  // 找出最大宽度
  let maxWidth = 0;
  lines.forEach(line => {
    maxWidth = Math.max(maxWidth, getDisplayWidth(line));
  });

  // 确保每行都达到最大宽度
  return lines.map(line => {
    const currentWidth = getDisplayWidth(line);
    const padding = maxWidth - currentWidth;

    if (padding > 0) {
      // 右侧填充空格
      return line + ' '.repeat(Math.ceil(padding));
    }
    return line;
  });
}

// 规范化全角边框字符
function normalizeChars(content) {
  const charMap = {
    '┌': '┏', '┐': '┓', '└': '┗', '┘': '┛',
    '─': '━', '│': '┃', '├': '┣', '┤': '┫',
    '┬': '┳', '┴': '┻', '┼': '╋'
  };

  let result = content;
  Object.keys(charMap).forEach(char => {
    result = result.split(char).join(charMap[char]);
  });
  return result;
}

// 处理文件
function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8');
  let original = content;

  // 规范化字符
  content = normalizeChars(content);

  // 分析并修复框图
  const boxes = analyzeBox(content);

  boxes.forEach(box => {
    const fixedLines = fixBox(box.lines);
    // 替换原内容
    const originalLines = content.split('\n');
    for (let i = box.start; i <= box.end; i++) {
      originalLines[i] = fixedLines[i - box.start];
    }
    content = originalLines.join('\n');
  });

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf-8');
    return true;
  }
  return false;
}

// 遍历目录
function processDirectory(dir) {
  const files = fs.readdirSync(dir);
  let count = 0;

  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      count += processDirectory(filePath);
    } else if (file.endsWith('.md')) {
      if (processFile(filePath)) {
        console.log(`✅ ${filePath}`);
        count++;
      }
    }
  });

  return count;
}

// 主函数
console.log('🔧 开始修复框图对齐问题...\n');

const total = processDirectory(booksDir);

console.log(`\n🎉 修复了 ${total} 个文件！`);
