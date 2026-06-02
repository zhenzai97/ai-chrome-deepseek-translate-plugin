# DeepSeek 文章翻译 Chrome 插件

基于 DeepSeek API 的 Chrome 浏览器扩展：一键翻译当前页面文章，支持 Markdown / PDF 下载。

## 功能

- 提取当前页面文章正文并全文翻译
- Side Panel 阅读完整译文
- 下载 Markdown（`.md`）或 PDF（`.pdf`）
- 不保存翻译历史，仅保留 API Key 等配置

## 开发环境

- Node.js 18+
- Google Chrome 120+

## 快速开始

```bash
# 安装依赖
npm install

# 生成占位图标
node scripts/generate-icons.mjs

# 开发构建（watch）
npm run dev

# 生产构建
npm run build

# 单元测试
npm test
```

## 加载扩展

1. 执行 `npm run build`
2. 打开 Chrome → `chrome://extensions`
3. 开启「开发者模式」
4. 点击「加载已解压的扩展程序」，选择项目下的 `dist` 目录

## 使用说明

1. 打开一篇外文文章页面
2. 点击扩展图标，打开侧边栏
3. 首次使用请在「设置」中填写 [DeepSeek API Key](https://platform.deepseek.com/)
4. 选择目标语言，点击「翻译全文」
5. 翻译完成后选择 Markdown 或 PDF 格式下载

## 权限说明

为从网页提取文章正文，扩展需要访问 `http://*/*` 与 `https://*/*`（安装或更新时 Chrome 会提示）。仅在你点击「翻译」时读取当前页内容，不会后台扫描浏览记录。

`chrome://`、Chrome 应用商店等内部页面无法注入脚本，属浏览器限制。

## 隐私说明

翻译时会将提取的文章正文发送至 DeepSeek API。译文仅保存在当前浏览器会话中，不会上传到其他服务器，也不会保存翻译历史。

## 项目结构

```
src/
├── background/     # Service Worker：消息路由、翻译编排、会话
├── content/        # 正文提取 Content Script
├── shared/         # 类型、常量、DeepSeek 客户端
├── sidepanel/      # 主界面与导出
└── options/        # 设置页
docs/               # 需求、技术方案、模块与实现步骤文档
```

## 文档

- [需求文档](./docs/需求文档.md)
- [技术方案](./docs/技术方案.md)
- [功能模块](./docs/功能模块.md)
- [实现步骤](./docs/实现步骤.md)
