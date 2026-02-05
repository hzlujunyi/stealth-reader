# StealthReader

一款极简的 TXT 电子书阅读器，专为需要低调阅读场景设计。

![preview](https://img.shields.io/badge/platform-Windows%20%7C%20macOS-blue) ![license](https://img.shields.io/badge/license-MIT-green) [![Buy Me a Coffee](https://img.shields.io/badge/Buy%20Me%20a%20Coffee-ffdd00?logo=buy-me-a-coffee&logoColor=black)](https://buymeacoffee.com/junyi) [![Ko-fi](https://img.shields.io/badge/Ko--fi-ff5e5b?logo=ko-fi&logoColor=white)](https://ko-fi.com/junyilu)

## 特性

- **极简界面** - 无边框窗口，外观朴素，不引人注目
- **鼠标离开自动隐藏** - 鼠标移出窗口自动隐藏，移入自动显示
- **系统托盘** - 最小化到托盘，不显示在任务栏，更加隐蔽
- **窗口置顶** - 始终保持在其他窗口之上
- **透明度调节** - 可调节窗口透明度，与背景融为一体
- **背景色吸取** - 支持吸取屏幕任意位置颜色作为背景
- **智能换行** - 根据窗口宽度自动重排文本
- **阅读进度保存** - 自动保存阅读进度，下次打开继续阅读
- **章节目录** - 自动识别章节，支持快速跳转
- **全文搜索** - 支持关键词搜索
- **阅读统计** - 记录阅读时长和进度
- **多种编码支持** - 自动检测 GBK、UTF-8 等多种编码

## 截图

```
┌───────────────────────────────────┐
│ 第一章 初入江湖                    │
│ 那是一个风雨交加的夜晚...          │
└───────────────────────────────────┘
```

## 安装

### 下载安装

从 [Releases](../../releases) 页面下载：

**Windows:**
- **便携版** (`StealthReader x.x.x.exe`) - 无需安装，双击即可运行
- **安装版** (`StealthReader Setup x.x.x.exe`) - 标准 Windows 安装程序

**macOS:**
- **DMG 安装包** (`StealthReader-x.x.x.dmg`) - 拖入 Applications 即可
- **ZIP 压缩包** (`StealthReader-x.x.x-mac.zip`) - 解压后直接运行

### 从源码构建

```bash
# 克隆仓库
git clone https://github.com/hzlujunyi/stealth-reader.git
cd stealth-reader

# 安装依赖
npm install

# 开发模式运行
npm run dev

# 打包 Windows
npm run build:win

# 打包 macOS (需在 macOS 上执行)
npm run build:mac
```

## 使用方法

### 基本操作

| 操作 | 说明 |
|------|------|
| 右键点击 | 打开菜单 |
| 右键拖动 | 移动窗口 |
| 滚轮 | 逐行滚动 |
| 左键点击 | 翻页（可在设置中开启） |

### 键盘快捷键

| 按键 | 功能 |
|------|------|
| `↓` / `j` / `Space` | 下一行 |
| `↑` / `k` | 上一行 |
| `PageDown` | 下一页 |
| `PageUp` | 上一页 |
| `Home` | 跳到开头 |
| `End` | 跳到结尾 |
| `P` | 显示/隐藏进度条 |

### 右键菜单

- **打开文件** - 选择 TXT 文件
- **目录** - 查看章节目录
- **搜索** - 全文搜索
- **设置** - 调整显示参数
- **统计** - 查看阅读统计

## 设置选项

### 显示设置

- **字体大小** - 调整文字大小 (12-24px)
- **显示行数** - 每次显示的行数 (1-10行)
- **文字颜色** - 自定义文字颜色
- **对齐方式** - 左对齐/居中/右对齐

### 窗口设置

- **透明度** - 窗口透明度 (0.1-1.0)
- **背景颜色** - 窗口背景色（支持吸色器）
- **窗口置顶** - 是否始终在最上层
- **鼠标离开隐藏** - 鼠标移出后自动隐藏
- **点击翻页** - 点击窗口翻页

### 自动滚动

- **自动翻页** - 开启自动翻页
- **翻页间隔** - 自动翻页的时间间隔

## 技术栈

- **Electron** - 跨平台桌面应用框架
- **Vue 3** - 前端框架 (Composition API)
- **Pinia** - 状态管理
- **TypeScript** - 类型安全
- **electron-vite** - 构建工具
- **electron-builder** - 打包工具

## 项目结构

```
reader/
├── src/
│   ├── main/           # Electron 主进程
│   │   └── index.ts
│   ├── preload/        # 预加载脚本
│   │   └── preload.ts
│   └── renderer/       # Vue 渲染进程
│       ├── components/
│       │   ├── Reader.vue         # 阅读器主组件
│       │   ├── Settings.vue       # 设置面板
│       │   ├── SearchPanel.vue    # 搜索面板
│       │   ├── TableOfContents.vue # 目录面板
│       │   ├── StatisticsPanel.vue # 统计面板
│       │   └── WelcomeScreen.vue  # 欢迎界面
│       ├── stores/
│       │   ├── book.ts           # 书籍状态
│       │   ├── settings.ts       # 设置状态
│       │   └── statistics.ts     # 统计状态
│       ├── App.vue
│       └── main.ts
├── public/
│   └── icon.ico        # 应用图标
├── package.json
└── electron.vite.config.ts
```

## 开发

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 类型检查
npm run typecheck

# 打包
npm run build
```

## 支持项目

如果这个项目对你有帮助，欢迎请作者喝杯咖啡：

<a href="https://buymeacoffee.com/junyi" target="_blank"><img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Buy Me A Coffee" height="50" ></a>
<a href="https://ko-fi.com/junyilu" target="_blank"><img src="https://ko-fi.com/img/githubbutton_sm.svg" alt="Ko-fi" height="50" ></a>

## 许可证

MIT License

## 致谢

感谢所有贡献者和使用者的支持！

---

**免责声明**：本软件仅供学习交流使用，请在合适的场合使用。
