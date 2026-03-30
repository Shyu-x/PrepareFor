# webEnvOS

一个基于 Web 的开发环境，具有类似 VSCode 的 IDE 界面，支持多主题和文档与代码分离功能。

## ✨ 特性

### 🎨 多主题系统
- **Windows 11**: 经典蓝色调，圆角设计
- **KDE Plasma**: 深色主题，科技感十足
- **GNOME**: 简洁现代，圆角设计
- **macOS**: 流畅优雅，毛玻璃效果

### 💻 IDE 界面
- 类似 VSCode 的布局
- 文件树浏览器
- 多标签页编辑器
- 可分离的文档区块
- 状态栏信息
- 可折叠的面板（终端、问题、输出）

### 📚 文档与代码分离
- 文档区块可放置在左侧、右侧或底部
- 支持 Markdown 格式
- 可切换文档/代码视图
- 支持添加、删除、隐藏文档

### 🔧 技术栈
- **前端**: Next.js 14 (App Router)
- **UI**: Ant Design + Tailwind CSS
- **状态管理**: Zustand + SWR
- **类型系统**: TypeScript

## 🚀 快速开始

### 安装依赖

```bash
npm install
```

### 运行开发服务器

```bash
npm run dev
```

打开 [http://localhost:3000](http://localhost:3000) 查看结果。

### 构建生产版本

```bash
npm run build
npm start
```

## 📁 项目结构

```
webenv-os/
├── src/
│   ├── app/              # Next.js App Router
│   ├── components/       # React 组件
│   ├── store/            # Zustand 状态管理
│   ├── styles/           # 样式配置
│   ├── types/            # TypeScript 类型定义
│   └── lib/              # 工具库
├── scripts/              # 脚本文件
├── public/               # 静态资源
└── docs/                 # 文档
```

## 🎯 核心组件

### ThemeProvider
管理全局主题，将 CSS 变量注入到 DOM。

### IDELayout
整合所有 IDE 组件，提供完整的 IDE 界面。

### FileTree
显示和管理文件系统树。

### Editor
代码编辑器，支持多标签页和文件保存。

### DocBlock
文档区块组件，支持 Markdown 渲染。

### StatusBar
显示 IDE 状态信息。

### ThemeSelector
主题切换界面。

## 🔧 状态管理

### useThemeStore
- 当前主题管理
- 主题列表
- 主题配置获取

### useIDEStore
- 文件树管理
- 编辑器状态
- 面板状态
- 文档区块管理
- IDE 设置

## 🎨 主题系统

主题系统基于 CSS 变量实现，支持动态切换。每个主题包含：

- **颜色**: 主色、背景、文本、边框等
- **圆角**: 不同层级的圆角
- **阴影**: 多级阴影效果
- **字体**: 主字体和等宽字体
- **布局**: 各区域尺寸

## 📝 开发指南

### 添加新组件

1. 在 `src/components/` 创建组件文件
2. 导出组件
3. 在需要的地方导入使用

### 添加新主题

1. 在 `src/styles/theme.ts` 添加主题配置
2. 主题选择器会自动显示新主题

### 添加新功能

1. 更新状态管理（store）
2. 创建或更新组件
3. 更新样式
4. 测试功能

## 🧪 验证

运行验证脚本检查项目状态：

```bash
npx tsx scripts/verify.ts
```

## 📋 待办事项

- [ ] 集成后端 API (NestJS)
- [ ] 集成 Docker/Kubernetes 管理
- [ ] 添加实时协作功能
- [ ] 集成 Monaco Editor 或 CodeMirror
- [ ] 添加终端模拟 (xterm.js)
- [ ] 实现插件系统
- [ ] 添加主题市场

## 🤝 贡献

欢迎贡献代码！请遵循以下步骤：

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

## 📄 许可证

待定

## 🙏 致谢

- [Next.js](https://nextjs.org/)
- [Ant Design](https://ant.design/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Zustand](https://zustand-demo.pmnd.rs/)
- [SWR](https://swr.vercel.app/)

---

*项目创建时间: 2026-01-22*
*版本: 0.1.0*
