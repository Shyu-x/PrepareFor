/**
 * 框图规范化脚本
 * 将半角边框字符转换为全角，确保中文对齐
 */

const fs = require('fs');
const path = require('path');

const booksDir = path.join(__dirname, '..', '书籍');

// 半角到全角的边框字符映射
const charMap = {
  '┌': '┏',  // 左上角
  '┐': '┓',  // 右上角
  '└': '┗',  // 左下角
  '┘': '┛',  // 右下角
  '─': '━',  // 水平线
  '│': '┃',  // 垂直线
  '├': '┣',  // 左边tee
  '┤': '┫',  // 右边tee
  '┬': '┳',  // 上边tee
  '┴': '┻',  // 下边tee
  '┼': '╋',  // 交叉
  '┏': '┏',  // 保持不变
  '┓': '┓',
  '┗': '┗',
  '┛': '┛',
  '━': '━',
  '┃': '┃',
};

// 遍历所有md文件
function processDirectory(dir) {
  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      processDirectory(filePath);
    } else if (file.endsWith('.md')) {
      processFile(filePath);
    }
  });
}

// 处理单个文件
function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8');
  let originalContent = content;

  // 转换边框字符
  Object.keys(charMap).forEach(char => {
    // 使用正则替换，确保正确处理
    content = content.split(char).join(charMap[char]);
  });

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`✅ 规范化: ${filePath}`);
    return true;
  }
  return false;
}

// 主函数
console.log('🔧 开始规范化框图字符...\n');

let count = 0;
function countDir(dir) {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      countDir(filePath);
    } else if (file.endsWith('.md')) {
      count++;
    }
  });
}

countDir(booksDir);
console.log(`📁 发现 ${count} 个Markdown文件\n`);

processDirectory(booksDir);

console.log('\n🎉 框图字符规范化完成！');
