# 项目初始化文档

## 日期
2025-12-31

## 环境信息
- Node.js: v22.21.1
- pnpm: v10.14.0
- React Native: v0.83.1
- 操作系统: Windows

## 初始化步骤

### 1. 创建 React Native 项目
```bash
npx @react-native-community/cli@latest init AutoClicker --skip-install
```

**说明**:
- 使用 `@react-native-community/cli` 而不是已弃用的 `react-native init`
- React Native 0.71+ 默认使用 TypeScript，无需指定模板
- 使用 `--skip-install` 跳过自动安装，以便使用 pnpm

### 2. 安装依赖
```bash
cd AutoClicker
pnpm install
```

**安装结果**:
- 成功安装 794 个包
- 安装时间: 1分43秒
- 主要依赖:
  - react: 19.2.0
  - react-native: 0.83.1
  - typescript: 5.9.3

### 3. 项目结构
初始化后的项目结构:
```
AutoClicker/
├── android/              # Android 原生代码
├── ios/                  # iOS 原生代码
├── node_modules/         # 依赖包
├── src/                  # 源代码目录
├── .gitignore
├── App.tsx               # 应用入口
├── app.json              # 应用配置
├── babel.config.js       # Babel 配置
├── Gemfile               # Ruby 依赖
├── index.js              # 入口文件
├── jest.config.js        # Jest 配置
├── metro.config.js       # Metro 打包配置
├── package.json          # 项目配置
├── tsconfig.json         # TypeScript 配置
└── README.md             # 项目说明
```

### 4. 创建文档目录
```bash
mkdir -p docs
```

## 注意事项

1. **弃用警告**:
   - eslint@8.57.1 已弃用，建议后续升级到 v9+
   - 5个子依赖已弃用，但不影响项目运行

2. **pnpm 版本**:
   - 当前使用 10.14.0
   - 最新版本 10.27.0 可用
   - 可选择性升级: `corepack use pnpm@10.27.0`

3. **网络问题**:
   - 部分包下载时出现 ECONNRESET 错误
   - pnpm 自动重试并成功完成安装

## 下一步

1. 安装核心依赖 (zustand, react-native-paper, 等)
2. 创建项目目录结构
3. 设置 TypeScript 类型定义
4. 实现状态管理

## 运行指令

### Android
```bash
# 启动 Metro bundler
pnpm start

# 运行 Android 应用
pnpm android
```

### 开发工具
```bash
# 运行测试
pnpm test

# 代码检查
pnpm lint

# TypeScript 类型检查
pnpm tsc --noEmit
```
