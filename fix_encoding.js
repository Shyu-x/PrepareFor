const fs = require('fs');
const path = require('path');

const docsDir = 'D:/Develeping/PrepareFor/前端面试题汇总';

function fixFile(filePath) {
    const buffer = fs.readFileSync(filePath);
    // 逻辑：如果文件已经是乱码字符，我们需要将其从 GBK 字节流转换回原始字节，再按 UTF-8 读取
    // 但更稳妥的方法是：直接检测文件的内容。
    let content = buffer.toString('utf8');
    
    // 如果发现内容包含典型的 UTF8-as-GBK 乱码（如 闈, 鍩）
    if (content.includes('闂') || content.includes('闈') || content.includes('鍩') || content.includes('閸')) {
        // 说明文件之前被错误地以 GBK 编码写回了。我们需要用系统的 codepage (通常是 936) 来纠正。
        // 在 Node.js 中，如果直接 buffer.toString('binary') 配合一些技巧可以还原。
        // 但最简单的是：告诉用户我们检测到了损坏，尝试用 GBK 解码原始字节。
        content = require('child_process').execSync(`powershell -NoProfile -Command "Get-Content -Path '${filePath}' -Encoding Default"`).toString('utf8');
    }

    // 重新以干净的 UTF-8 (无BOM) 写入
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Fixed: ${path.basename(filePath)}`);
}

function walk(dir) {
    const files = fs.readdirSync(dir);
    files.forEach(file => {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            walk(fullPath);
        } else if (file.endsWith('.md')) {
            fixFile(fullPath);
        }
    });
}

walk(docsDir);
