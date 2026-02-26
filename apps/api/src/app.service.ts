import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class AppService {
  private readonly logger = new Logger(AppService.name);
  
  // 稳健的目录定位：基于当前工作目录寻找根目录下的文档
  // 假设后端在 apps/api 目录下运行，则需要向上两级
  private docsDir = path.resolve(process.cwd(), '../../前端面试题汇总');

  constructor() {
    this.logger.log(`Docs directory initialized at: ${this.docsDir}`);
    if (!fs.existsSync(this.docsDir)) {
      this.logger.error(`CRITICAL: Docs directory NOT FOUND at ${this.docsDir}`);
    }
  }

  getHello(): string {
    return 'API Server is running!';
  }

  getDocsList() {
    if (!fs.existsSync(this.docsDir)) return [];
    return this.walkDir(this.docsDir);
  }

  private walkDir(dir: string) {
    const results = [];
    // 强制使用 utf8 读取目录
    const list = fs.readdirSync(dir);

    list.forEach((file) => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);

      if (stat && stat.isDirectory()) {
        // 排除隐藏目录和 node_modules
        if (!file.startsWith('.') && file !== 'node_modules') {
          results.push({
            title: file,
            key: file,
            type: 'directory',
            children: this.walkDir(filePath),
          });
        }
      } else if (file.endsWith('.md')) {
        // 计算相对路径作为 key，并统一使用正斜杠供前端使用
        const relativePath = path.relative(this.docsDir, filePath).replace(/\\/g, '/');
        results.push({
          title: file.replace('.md', ''),
          key: relativePath,
          type: 'file',
        });
      }
    });

    return results;
  }

  getDocContent(filename: string) {
    try {
      // 1. 彻底解码前端传来的路径
      const decodedPath = decodeURIComponent(filename);
      // 2. 将正斜杠转回系统分隔符，并与基准目录拼接成绝对路径
      const absolutePath = path.resolve(this.docsDir, decodedPath.replace(/\//g, path.sep));
      
      this.logger.log(`Attempting to read file: ${absolutePath}`);

      // 安全校验：防止路径穿越攻击，确保请求的文件在 docsDir 范围内
      if (!absolutePath.startsWith(this.docsDir)) {
        return { error: 'Access denied: Path traversal detected' };
      }

      if (!fs.existsSync(absolutePath)) {
        return { error: `File not found: ${decodedPath}` };
      }

      const content = fs.readFileSync(absolutePath, 'utf8');
      return { content };
    } catch (e) {
      this.logger.error(`Error reading doc: ${e.message}`);
      return { error: `Internal error: ${e.message}` };
    }
  }

  // PlantUML 相关保持不变...
  renderPlantUml(code: string): { svg?: string; error?: string } {
    const encoded = this.encodePlantUml(code);
    return { svg: `https://www.plantuml.com/plantuml/svg/${encoded}` };
  }

  private encodePlantUml(plantuml: string): string {
    return Buffer.from(plantuml).toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  }
}
