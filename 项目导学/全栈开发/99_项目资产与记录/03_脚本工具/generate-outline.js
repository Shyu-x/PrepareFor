#!/usr/bin/env node

/**
 * 自动大纲生成脚本
 * 用于为所有Markdown文档生成大纲，统计标题等的内容并形成树形结构
 */

const fs = require('fs');
const path = require('path');

// 配置选项
const CONFIG = {
  // 要扫描的目录
  directories: ['.', 'React核心', '前端基础', 'TypeScript模块', '01_Node.js核心模块', '02_Express_Koa框架', '03_数据库', '04_API设计与认证', '05_后端工程化与部署运维', '06_数据结构与算法'],
  
  // 要忽略的文件
  ignoreFiles: [
    'node_modules',
    '.git',
    'outline.md',
    'outline_*.md',
    'QWEN.md',
    'CLAUDE.md',
    'GEMINI.md',
    'generate-outline.js',
    'generate-outline-output.md'
  ],
  
  // 要忽略的目录
  ignoreDirs: ['node_modules', '.git'],
  
  // 最大标题层级
  maxDepth: 6,
  
  // 是否包含文件路径
  includeFilePath: true,
  
  // 输出格式
  outputFormat: 'tree', // 'tree' 或 'json'
};

/**
 * 检查文件是否应该被忽略
 */
function shouldIgnore(filePath, ignoreList) {
  const fileName = path.basename(filePath);
  return ignoreList.some(pattern => {
    if (pattern.includes('*')) {
      const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
      return regex.test(fileName);
    }
    return fileName === pattern;
  });
}

/**
 * 提取Markdown文件中的标题
 */
function extractHeadings(content) {
  const headings = [];
  const lines = content.split('\n');
  
  for (const line of lines) {
    // 匹配标题 #, ##, ### 等
    const match = line.match(/^(#{1,6})\s+(.+)$/);
    if (match) {
      const level = match[1].length;
      const text = match[2].trim();
      
      // 清理标题文本（移除链接等）
      const cleanText = text
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // 移除链接
        .replace(/`([^`]+)`/g, '$1') // 移除代码标记
        .replace(/\*\*([^*]+)\*\*/g, '$1') // 移除粗体
        .replace(/\*([^*]+)\*/g, '$1'); // 移除斜体
      
      headings.push({
        level,
        text: cleanText
      });
    }
  }
  
  return headings;
}

/**
 * 读取文件内容
 */
function readFile(filePath) {
  try {
    const absolutePath = path.resolve(filePath);
    const content = fs.readFileSync(absolutePath, 'utf8');
    return content;
  } catch (error) {
    console.error(`读取文件失败: ${filePath}`, error.message);
    return null;
  }
}

/**
 * 处理单个文件
 */
function processFile(filePath, baseDir) {
  const relativePath = path.relative(baseDir, filePath);
  const content = readFile(filePath);
  
  if (!content) {
    return null;
  }
  
  const headings = extractHeadings(content);
  
  return {
    path: relativePath,
    type: 'file',
    headings
  };
}

/**
 * 处理目录
 */
function processDirectory(dirPath, baseDir, depth = 0) {
  if (depth > 5) {
    return null; // 避免过深的目录结构
  }
  
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  const result = {
    path: path.relative(baseDir, dirPath) || '.',
    type: 'directory',
    children: []
  };
  
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    
    // 检查是否应该忽略
    if (shouldIgnore(entry.name, CONFIG.ignoreDirs) && entry.isDirectory()) {
      continue;
    }
    
    if (shouldIgnore(entry.name, CONFIG.ignoreFiles) && entry.isFile()) {
      continue;
    }
    
    if (entry.isDirectory()) {
      const dirResult = processDirectory(fullPath, baseDir, depth + 1);
      if (dirResult && dirResult.children.length > 0) {
        result.children.push(dirResult);
      }
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      const fileResult = processFile(fullPath, baseDir);
      if (fileResult && fileResult.headings.length > 0) {
        result.children.push(fileResult);
      }
    }
  }
  
  return result;
}

/**
 * 格式化输出为树形结构
 */
function formatTree(node, prefix = '', isLast = true) {
  let output = '';
  
  if (node.type === 'directory') {
    const connector = isLast ? '└── ' : '├── ';
    const dirName = node.path === '.' ? '全栈开发/' : node.path + '/';
    output += `${prefix}${connector}${dirName}\n`;
    
    const newPrefix = isLast ? prefix + '    ' : prefix + '│   ';
    
    for (let i = 0; i < node.children.length; i++) {
      const child = node.children[i];
      const isLastChild = i === node.children.length - 1;
      output += formatTree(child, newPrefix, isLastChild);
    }
  } else if (node.type === 'file') {
    const connector = isLast ? '└── ' : '├── ';
    output += `${prefix}${connector}${node.path}\n`;
    
    // 添加标题
    for (const heading of node.headings) {
      const titlePrefix = isLast ? '    ' : '│   ';
      const titleConnector = '    └── ';
      const indent = titlePrefix + titleConnector;
      
      // 根据标题层级调整缩进
      const levelIndent = '  '.repeat(heading.level - 1);
      output += `${prefix}${titlePrefix}${levelIndent}# ${heading.text}\n`;
    }
  }
  
  return output;
}

/**
 * 格式化输出为JSON
 */
function formatJson(node) {
  return JSON.stringify(node, null, 2);
}

/**
 * 生成大纲
 */
function generateOutline() {
  const baseDir = process.cwd();
  const output = { type: 'directory', path: '.', children: [] };
  
  // 处理所有配置的目录
  for (const dir of CONFIG.directories) {
    const fullPath = path.join(baseDir, dir);
    
    if (fs.existsSync(fullPath) && fs.statSync(fullPath).isDirectory()) {
      const result = processDirectory(fullPath, baseDir);
      if (result && result.children.length > 0) {
        output.children.push(result);
      }
    }
  }
  
  // 格式化输出
  if (CONFIG.outputFormat === 'tree') {
    let outputText = '全栈开发知识库大纲\n';
    outputText += '=' .repeat(50) + '\n\n';
    
    for (let i = 0; i < output.children.length; i++) {
      const child = output.children[i];
      const isLast = i === output.children.length - 1;
      outputText += formatTree(child, '', isLast);
      outputText += '\n';
    }
    
    return outputText;
  } else {
    return formatJson(output);
  }
}

/**
 * 保存输出到文件
 */
function saveOutput(content, filename) {
  const outputPath = path.join(process.cwd(), filename);
  fs.writeFileSync(outputPath, content, 'utf8');
  console.log(`大纲已保存到: ${outputPath}`);
}

/**
 * 主函数
 */
function main() {
  const args = process.argv.slice(2);
  
  // 解析命令行参数
  let outputFile = null;
  
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--output' || args[i] === '-o') {
      outputFile = args[i + 1];
      i++;
    } else if (args[i] === '--help' || args[i] === '-h') {
      console.log(`
用法: node generate-outline.js [选项]

选项:
  --output, -o <file>  输出到指定文件
  --help, -h           显示帮助信息
  --json               使用JSON格式输出

示例:
  node generate-outline.js                    # 生成大纲并输出到控制台
  node generate-outline.js --output outline.md # 生成大纲并保存到outline.md
  node generate-outline.js --json             # 使用JSON格式输出
`);
      process.exit(0);
    } else if (args[i] === '--json') {
      CONFIG.outputFormat = 'json';
    }
  }
  
  // 生成大纲
  const outline = generateOutline();
  
  // 输出或保存
  if (outputFile) {
    saveOutput(outline, outputFile);
  } else {
    console.log(outline);
  }
}

// 运行主函数
main();
