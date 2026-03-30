/**
 * 文件命名规范化脚本 v2
 * 移除章节文件夹内的重复前缀，统一命名为清晰格式
 */

const fs = require('fs');
const path = require('path');

const booksDir = path.join(__dirname, '..', '书籍');

// 定义所有需要重命名的文件
const renameMap = {
  // 第5卷 项目实战案例
  '第5卷-项目实战案例': {
    '第1章-WebEnv-OS': {
      '1-1 项目介绍与架构.md': '项目介绍与架构.md',
      '1-2 核心技术实现.md': '核心技术实现.md',
      '1-3 面试问题汇总.md': '面试问题汇总.md'
    },
    '第2章-FastDocument': {
      '2-1 项目介绍与架构.md': '项目介绍与架构.md',
      '2-2 核心技术实现.md': '核心技术实现.md',
      '2-3 面试问题汇总.md': '面试问题汇总.md'
    },
    '第3章-UnoThree': {
      '3-1 项目介绍与架构.md': '项目介绍与架构.md',
      '3-2 核心技术实现.md': '核心技术实现.md',
      '3-3 面试问题汇总.md': '面试问题汇总.md'
    }
  }
};

function renameFiles() {
  let renamedCount = 0;
  let errorCount = 0;

  // 处理每个卷
  for (const [volumeName, chapters] of Object.entries(renameMap)) {
    const volumePath = path.join(booksDir, volumeName);

    if (!fs.existsSync(volumePath)) {
      console.log(`⚠️ 卷不存在: ${volumePath}`);
      continue;
    }

    // 处理每个章节
    for (const [chapterName, files] of Object.entries(chapters)) {
      const chapterPath = path.join(volumePath, chapterName);

      if (!fs.existsSync(chapterPath)) {
        console.log(`⚠️ 章节不存在: ${chapterPath}`);
        continue;
      }

      // 重命名文件
      for (const [oldName, newName] of Object.entries(files)) {
        const oldPath = path.join(chapterPath, oldName);
        const newPath = path.join(chapterPath, newName);

        if (fs.existsSync(oldPath)) {
          if (oldName !== newName) {
            // 如果目标文件已存在，先删除
            if (fs.existsSync(newPath)) {
              fs.unlinkSync(newPath);
            }
            fs.renameSync(oldPath, newPath);
            console.log(`✅ ${volumeName}/${chapterName}`);
            console.log(`   ${oldName} → ${newName}`);
            renamedCount++;
          }
        } else {
          // 文件名可能已经被修改过
          console.log(`⚠️ 文件不存在: ${oldPath}`);
          errorCount++;
        }
      }
    }
  }

  console.log(`\n📊 总共重命名了 ${renamedCount} 个文件`);
  if (errorCount > 0) {
    console.log(`⚠️ ${errorCount} 个文件未找到（可能已重命名）`);
  }
}

// 运行
renameFiles();
