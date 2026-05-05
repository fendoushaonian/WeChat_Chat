# 朋友圈文案助手 · Moments Writer

一款基于 **百度文心大模型** 的朋友圈文案生成桌面应用，支持 **Windows** 和 **macOS**。

![](https://img.shields.io/badge/Electron-29-47848F) ![](https://img.shields.io/badge/React-18-61DAFB) ![](https://img.shields.io/badge/TypeScript-5-3178C6) ![](https://img.shields.io/badge/TailwindCSS-3-06B6D4) ![](https://img.shields.io/badge/Baidu-千帆_ERNIE-CC0000)

## ✨ 功能特性

- **16 种场景模板**：日常、美食、旅行、咖啡、健身、读书、职场、情感、节日、萌宠、穿搭、居家、随笔、励志、育儿、带货
- **10 种文案风格**：文艺清新、幽默搞笑、温柔治愈、高级简约、炸裂激情、古风诗意、小红书风、商务正式、咆哮鬼畜、懒癌摆烂
- **细粒度控制**：心情标签、长度（短/中/长）、生成条数（1/3/5/8 条）、emoji、话题标签
- **多模型支持**：ERNIE 4.5 Turbo / 4.0 / 4.0 Turbo / 3.5 / Speed / Lite / Tiny
- **两种鉴权方式**：V2 千帆 ModelBuilder (Bearer Token，推荐) 或 V1 API Key + Secret Key
- **历史记录 + 搜索 + 收藏夹**：全部本地存储，随时翻查
- **一键复制** 到剪贴板
- **毛玻璃 UI** + 渐变配色 + 圆角卡片
- **跨平台**：打包为 Windows `.exe` 安装包和 macOS `.dmg` 镜像

## 📦 快速开始

### 环境要求

- **Node.js 18+** (推荐 20 LTS)
- **npm** 或 **pnpm** / **yarn**

### 安装依赖

```bash
npm install
```

### 本地开发（热更新）

```bash
npm run dev
```

会同时启动 Vite 开发服务器（:5173）和 Electron 主进程。

### 打包发布

```bash
# 当前平台
npm run dist

# 仅打包 Windows (在 Windows 上运行)
npm run dist:win

# 仅打包 macOS (需要在 macOS 上运行)
npm run dist:mac
```

产物位于 `release/` 目录：
- Windows: `朋友圈文案助手-1.0.0-Setup.exe`
- macOS: `朋友圈文案助手-1.0.0-arm64.dmg` / `-x64.dmg`

## 🔑 配置百度 API

### 方式一：千帆 ModelBuilder V2（推荐，最简单）

1. 登录 [百度智能云控制台](https://console.bce.baidu.com/iam/#/iam/apikey/list)
2. 创建一个 **API Key**，格式类似 `bce-v3/ALTAK-xxxxxxxx/xxxxxxxxxxxxxxxxxx`
3. 打开应用 → 偏好设置 → 鉴权方式选 **V2** → 填入 API Key
4. 点击「测试连接」确认可用

### 方式二：经典 V1（API Key + Secret Key）

1. 登录 [千帆大模型平台](https://console.bce.baidu.com/qianfan/ais/console/applicationConsole/application)
2. 创建应用，获取 **API Key** 和 **Secret Key**
3. 打开应用 → 偏好设置 → 鉴权方式选 **V1** → 分别填入

> **注意**：百度文心大模型部分模型有免费额度（如 ERNIE-Speed / ERNIE-Lite / ERNIE-Tiny），超出后按 tokens 计费。详情见[百度千帆定价](https://cloud.baidu.com/doc/WENXINWORKSHOP/s/hlrk4akp7)。

## 🗂 项目结构

```
文案助手/
├── electron/                  # Electron 主进程
│   ├── main.js               # 主进程入口 + IPC
│   ├── preload.js            # 预加载脚本
│   └── baidu.js              # 百度千帆 API 封装
├── src/                       # React 渲染进程
│   ├── main.tsx              # 入口
│   ├── App.tsx               # 应用外壳
│   ├── index.css             # 全局样式 + TailwindCSS
│   ├── types.ts              # TypeScript 类型
│   ├── constants.ts          # 场景/风格/模型常量
│   ├── prompt.ts             # Prompt 构造 + 结果切分
│   ├── store.ts              # Zustand 全局状态
│   └── components/
│       ├── TitleBar.tsx      # 顶部标题栏
│       ├── Sidebar.tsx       # 左侧导航
│       ├── Generator.tsx     # 文案生成页
│       ├── History.tsx       # 历史记录
│       ├── Favorites.tsx     # 我的收藏
│       ├── Settings.tsx      # 偏好设置
│       ├── ResultCard.tsx    # 结果卡片
│       └── Toast.tsx         # 吐司提示
├── index.html
├── package.json              # 含 electron-builder 打包配置
├── vite.config.ts
├── tailwind.config.js
├── postcss.config.js
└── tsconfig.json
```

## 🛡️ 数据隐私

- 所有配置（API Key / 历史记录 / 偏好）都保存在本地：
  - Windows: `%APPDATA%\moments-writer\moments-writer-store.json`
  - macOS: `~/Library/Application Support/moments-writer/moments-writer-store.json`
- **文案生成请求只会发送到 `qianfan.baidubce.com`（百度千帆）或 `aip.baidubce.com`（V1 鉴权换 token）**，不经过任何第三方服务。
- CSP 策略已在 `index.html` 中限制只允许连接百度官方域名。

## 🧩 常见问题

**Q: 启动后提示"请先到偏好设置填写 API Key"？**
A: 点击左侧「偏好设置」，按照上文「配置百度 API」的步骤填入 API Key 即可。

**Q: 提示「千帆接口 HTTP 401」或 Token 错误？**
A: 确认 API Key 有效，并且你的账号已在[千帆 ModelBuilder](https://console.bce.baidu.com/qianfan/ais/console/onlineService)开通了对应模型的服务。

**Q: macOS 打开提示"已损坏，移到废纸篓"？**
A: 未签名应用常见提示。执行 `xattr -cr /Applications/朋友圈文案助手.app` 后再启动。

**Q: 如何清除所有本地数据？**
A: 偏好设置页底部有「清除所有本地数据」按钮。

## 🧑‍💻 技术栈

- **Electron 29** — 跨平台桌面框架
- **Vite 5** — 极速构建
- **React 18** — UI 框架
- **TypeScript 5** — 类型系统
- **TailwindCSS 3** — 原子化 CSS
- **Zustand** — 轻量状态管理
- **Lucide React** — 图标
- **electron-builder** — 打包 `.exe` / `.dmg`
- **百度千帆 ERNIE** — 文心大模型

## 📜 License

MIT
