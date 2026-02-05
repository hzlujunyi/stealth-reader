# 隐蔽阅读器 - 架构设计

## 技术栈
- **框架**: Electron 28+ (主进程) + Vue 3 (渲染进程)
- **构建工具**: Vite + electron-builder
- **状态管理**: Pinia
- **数据存储**: electron-store (本地JSON存储)
- **语言**: TypeScript

## 项目结构
```
reader/
├── electron/                 # Electron 主进程
│   ├── main.ts              # 主进程入口
│   ├── preload.ts           # 预加载脚本
│   └── ipc/                  # IPC 通信处理
│       ├── file.ts          # 文件操作
│       ├── window.ts        # 窗口控制
│       └── store.ts         # 数据存储
├── src/                      # Vue 渲染进程
│   ├── App.vue              # 主组件
│   ├── main.ts              # 渲染进程入口
│   ├── components/          # 组件
│   │   ├── Reader.vue       # 阅读器主界面
│   │   ├── Settings.vue     # 设置面板
│   │   ├── BookShelf.vue    # 书架
│   │   ├── TableOfContents.vue  # 目录
│   │   └── SearchPanel.vue  # 搜索面板
│   ├── stores/              # Pinia 状态管理
│   │   ├── book.ts          # 书籍状态
│   │   ├── settings.ts      # 设置状态
│   │   └── statistics.ts    # 统计数据
│   ├── utils/               # 工具函数
│   │   ├── txtParser.ts     # TXT解析(编码检测、目录提取)
│   │   └── timeTracker.ts   # 时长追踪
│   └── styles/              # 样式
├── package.json
├── vite.config.ts
└── electron-builder.json
```

## 核心模块设计

### 1. 窗口控制模块 (electron/ipc/window.ts)
```typescript
// 功能：
// - 无边框窗口创建
// - 透明度调节 (0-100%)
// - 窗口置顶
// - 鼠标离开自动隐藏 (监听 mouse-leave 事件)
// - 窗口大小拖拽调整
```

### 2. TXT解析模块 (src/utils/txtParser.ts)
```typescript
// 功能：
// - 自动检测文件编码 (UTF-8/GBK/GB2312)
// - 章节目录提取 (正则匹配: 第X章、第X节、Chapter X 等)
// - 按行分割文本
```

### 3. 阅读状态管理 (src/stores/book.ts)
```typescript
interface BookState {
  currentBook: {
    id: string;
    path: string;
    name: string;
    content: string[];      // 按行分割的内容
    chapters: Chapter[];    // 章节目录
    currentLine: number;    // 当前阅读行
    totalLines: number;
  } | null;
  books: BookInfo[];        // 书架列表
}
```

### 4. 设置状态管理 (src/stores/settings.ts)
```typescript
interface Settings {
  // 显示设置
  displayLines: number;       // 显示行数 (默认2)
  fontSize: number;           // 字号
  fontFamily: string;         // 字体
  textColor: string;          // 文字颜色
  backgroundColor: string;    // 背景色
  textAlign: 'left' | 'center' | 'right';

  // 窗口设置
  opacity: number;            // 透明度 0-100
  frameless: boolean;         // 无边框模式
  alwaysOnTop: boolean;       // 窗口置顶

  // 交互设置
  autoHideOnMouseLeave: boolean;  // 鼠标移开自动隐藏
  clickToNextPage: boolean;       // 点击翻页

  // 自动翻页
  autoScroll: boolean;        // 自动翻页开关
  autoScrollInterval: number; // 翻页间隔(秒)
}
```

### 5. 统计模块 (src/stores/statistics.ts)
```typescript
interface Statistics {
  todayReadingTime: number;      // 今日阅读时长(秒)
  totalReadingTime: number;      // 累计阅读时长(秒)
  bookReadingTime: Record<string, number>;  // 每本书阅读时长
  lastReadDate: string;          // 上次阅读日期
}
```

## 关键功能实现方案

### 鼠标移开自动隐藏
```typescript
// main.ts
mainWindow.on('mouse-leave', () => {
  if (settings.autoHideOnMouseLeave) {
    mainWindow.hide();
  }
});

// 通过全局鼠标位置检测，鼠标进入窗口区域时显示
```

### 目录自动识别
```typescript
// 常见章节标题正则
const chapterPatterns = [
  /^第[一二三四五六七八九十百千\d]+[章节回卷]/,
  /^Chapter\s+\d+/i,
  /^CHAPTER\s+\d+/i,
  /^\d+[、.]\s*.+/,
];
```

### 阅读时长统计
```typescript
// 使用 setInterval 每秒记录
// 窗口失焦或隐藏时暂停计时
// 数据持久化到 electron-store
```

## 界面布局

### 阅读界面 (极简模式)
```
┌────────────────────────────────────┐
│  这是第一行文字内容...              │  <- 可配置显示1-N行
│  这是第二行文字内容...              │
└────────────────────────────────────┘
```

### 右键菜单
```
┌──────────────────┐
│ 📖 打开书籍      │
│ 📑 目录          │
│ 🔍 查找          │
│ ─────────────── │
│ ⚙️ 设置          │
│ 📊 阅读统计      │
│ ─────────────── │
│ ❌ 退出          │
└──────────────────┘
```

## 数据存储结构

使用 electron-store 存储到本地JSON:
```json
{
  "books": [...],
  "settings": {...},
  "statistics": {...},
  "readingProgress": {
    "bookId": { "line": 100, "lastRead": "2024-01-01" }
  }
}
```

## 打包配置

### Windows
- 格式: NSIS 安装包 + 便携版 (portable)
- 图标: `public/icon.ico`
- 构建命令: `npm run build:win`

### macOS
- 格式: DMG 安装包 + ZIP 压缩包
- 图标: `public/icon.png` (建议 512x512 或 1024x1024)
- 托盘图标: `public/iconTemplate.png` (16x16 或 22x22，黑白模板图标)
- 构建命令: `npm run build:mac`
- 注意: macOS 构建需要在 macOS 系统上进行，或使用 CI/CD 服务

### 图标文件要求
```
public/
├── icon.ico          # Windows 应用图标 (256x256)
├── icon.png          # macOS 应用图标 (512x512 或 1024x1024)
└── iconTemplate.png  # macOS 托盘图标 (16x16，黑白)
```

- 目标体积: ~80-100MB
