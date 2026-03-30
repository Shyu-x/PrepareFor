/**
 * Markdown 内容规范检查脚本
 *
 * 规范要求（仅适用于书籍目录）：
 * - 一级标题：`# 第X卷-卷名`
 * - 二级标题：`## 第Y章 章名`
 * - 三级标题：`### X.Y 节名` (数字编号)
 * - 四级标题：`#### X.Y.Z 小节名`
 * - 代码块必须有语言标记
 * - 表格必须对齐
 *
 * 不检查的文件（可忽略）：
 * - 目录.md
 * - 验证报告.md
 * - 排版规范.md
 * - 书籍结构规划.md
 * - 目录结构规划.md
 */

const fs = require('fs');
const path = require('path');

const BOOKS_DIR = path.join(__dirname, '..', '书籍');

// 忽略的文件列表（不在书籍目录下的配置文件）
const IGNORE_FILES = [
  '目录.md',
  '验证报告.md',
  '排版规范.md',
  '书籍结构规划.md',
  '目录结构规划.md',
];

// 规范模式
const PATTERNS = {
  // 一级标题：# 第X卷-卷名
  level1: /^# 第\d+卷-.+$/m,
  // 二级标题：## 第Y章 章名
  level2: /^## 第\d+章 .+$/m,
  // 三级标题：### X.Y 节名 (数字.数字格式)
  level3: /^### \d+\.\d+ .+$/m,
  // 四级标题：#### X.Y.Z 小节名 (数字.数字.数字格式)
  level4: /^#### \d+\.\d+\.\d+ .+$/m,
  // 代码块语言标记
  codeBlock: /```\w+/,
};

class MarkdownValidator {
  constructor() {
    this.results = {
      passed: [],
      failed: [],
      warnings: [],
    };
    this.stats = {
      totalFiles: 0,
      totalErrors: 0,
      totalWarnings: 0,
    };
  }

  /**
   * 获取所有 Markdown 文件
   */
  getMarkdownFiles(dir) {
    const files = [];

    function walk(directory) {
      const items = fs.readdirSync(directory);

      for (const item of items) {
        const fullPath = path.join(directory, item);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
          // 跳过 node_modules, .git 等目录
          if (!['node_modules', '.git', '.next', 'dist'].includes(item)) {
            walk(fullPath);
          }
        } else if (item.endsWith('.md')) {
          // 跳过忽略的文件
          if (!IGNORE_FILES.includes(item)) {
            files.push(fullPath);
          }
        }
      }
    }

    walk(dir);
    return files;
  }

  /**
   * 验证单个文件
   */
  validateFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const relativePath = path.relative(BOOKS_DIR, filePath);
    const errors = [];
    const warnings = [];

    // 检查一级标题
    const level1Matches = content.match(PATTERNS.level1);
    if (!level1Matches) {
      errors.push('缺少一级标题（# 第X卷-卷名）');
    }

    // 检查二级标题
    const level2Matches = content.match(PATTERNS.level2);
    if (!level2Matches) {
      errors.push('缺少二级标题（## 第Y章 章名）');
    }

    // 检查三级标题格式
    const level3Matches = content.match(/^### .+$/gm);
    if (level3Matches) {
      const invalidLevel3 = level3Matches.filter(line => {
        // 检查是否使用数字.数字格式
        return !/^### \d+\.\d+ .+$/.test(line);
      });
      if (invalidLevel3.length > 0) {
        warnings.push(`三级标题应使用数字格式（如 ### 1.1）：${invalidLevel3.join(', ')}`);
      }
    }

    // 检查代码块语言标记
    const codeBlocks = content.match(/```[\s\S]*?```/g) || [];
    const unlabeledBlocks = codeBlocks.filter(block => {
      const lines = block.split('\n');
      const firstLine = lines[0].trim();
      return firstLine === '```' || firstLine === '````';
    });

    if (unlabeledBlocks.length > 0) {
      warnings.push(`有 ${unlabeledBlocks.length} 个代码块缺少语言标记`);
    }

    // 检查表格格式
    const tables = content.match(/\|.+\|/g) || [];
    if (tables.length > 0) {
      // 检查表格对齐格式
      const alignmentLines = tables.filter(line => line.match(/^[\s|:|-]+$/));
      if (alignmentLines.length > 0) {
        const invalidAlignments = alignmentLines.filter(line => {
          // 检查是否有统一的格式
          const parts = line.split('|').filter(p => p.trim());
          return parts.some(p => !p.match(/^:?-+:?$/));
        });
        if (invalidAlignments.length > 0) {
          warnings.push('部分表格对齐格式不规范');
        }
      }
    }

    return { errors, warnings, relativePath };
  }

  /**
   * 运行验证
   */
  run() {
    console.log('🔍 开始检查 Markdown 文件...\n');

    const files = this.getMarkdownFiles(BOOKS_DIR);
    this.stats.totalFiles = files.length;

    console.log(`📁 发现 ${files.length} 个 Markdown 文件\n`);
    console.log('─'.repeat(60));

    for (const file of files) {
      const { errors, warnings, relativePath } = this.validateFile(file);

      if (errors.length > 0) {
        this.results.failed.push({
          file: relativePath,
          errors,
          warnings,
        });
        this.stats.totalErrors += errors.length;
        this.stats.totalWarnings += warnings.length;

        console.log(`\n❌ ${relativePath}`);
        errors.forEach(err => console.log(`   └─ ${err}`));
        if (warnings.length > 0) {
          warnings.forEach(warn => console.log(`   ⚠️  ${warn}`));
        }
      } else if (warnings.length > 0) {
        this.results.warnings.push({
          file: relativePath,
          warnings,
        });
        this.stats.totalWarnings += warnings.length;

        console.log(`\n⚠️  ${relativePath}`);
        warnings.forEach(warn => console.log(`   └─ ${warn}`));
      } else {
        this.results.passed.push(relativePath);
      }
    }

    this.printSummary();
    return this.results;
  }

  /**
   * 打印总结
   */
  printSummary() {
    console.log('\n' + '─'.repeat(60));
    console.log('\n📊 检查结果汇总\n');

    console.log(`   总文件数：${this.stats.totalFiles}`);
    console.log(`   ✅ 通过：${this.results.passed.length}`);
    console.log(`   ❌ 失败：${this.results.failed.length}`);
    console.log(`   ⚠️  警告：${this.results.warnings.length}`);
    console.log(`   📝 总错误：${this.stats.totalErrors}`);
    console.log(`   📝 总警告：${this.stats.totalWarnings}`);

    if (this.results.failed.length > 0) {
      console.log('\n\n❌ 需要修复的文件：');
      this.results.failed.forEach(item => {
        console.log(`   - ${item.file}`);
      });
    }

    if (this.results.warnings.length > 0) {
      console.log('\n\n⚠️  有警告的文件：');
      this.results.warnings.forEach(item => {
        console.log(`   - ${item.file}`);
      });
    }

    console.log('\n' + '='.repeat(60));

    // 退出码：有错误返回 1
    if (this.stats.totalErrors > 0) {
      console.log('\n❌ 检查未通过，请修复上述错误！\n');
      process.exit(1);
    } else if (this.stats.totalWarnings > 0) {
      console.log('\n⚠️  检查通过，但有警告信息。\n');
    } else {
      console.log('\n✅ 所有文件检查通过！\n');
    }
  }
}

// 运行验证
const validator = new MarkdownValidator();
validator.run();
