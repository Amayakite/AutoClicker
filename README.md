# 自动点击器 (AutoClicker)

一个基于 React Native 的 Android 自动点击应用，支持**多脚本管理**和**可视化点位编辑**。

## 功能特性

- ✅ **多脚本管理** - 创建、编辑、复制、删除多个脚本
- ✅ **可视化点位编辑器** - 悬浮窗瞄准镜样式，拖动定位
- ✅ 单点配置（坐标、延迟、抖动、漂移）
- ✅ 脚本级配置（启动延迟、循环执行）
- ✅ 全局配置（震动反馈）
- ✅ 数据持久化（自动保存配置）
- ✅ Material Design UI
- ✅ 无障碍服务集成

## 技术栈

- React Native 0.83.1
- TypeScript 5.9.3
- Zustand (状态管理)
- React Native Paper (UI 组件)
- Kotlin (Android 原生模块)

## 快速开始

### 方式一：使用 GitHub Actions 自动构建（推荐）

如果你的本地环境无法构建，可以使用 GitHub Actions 自动构建 APK：

1. **推送代码到 GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/YOUR_USERNAME/AutoClicker.git
   git push -u origin main
   ```

2. **等待自动构建**
   - 进入 GitHub 仓库的 "Actions" 页面
   - 等待构建完成（约 10-15 分钟）

3. **下载 APK**
   - 在 Actions 页面底部的 "Artifacts" 部分
   - 下载 `AutoClicker-Debug-APK`（开发版）或 `AutoClicker-Release-APK`（生产版）

详细说明请查看：[GitHub Actions 快速开始](docs/05-github-actions-quickstart.md)

### 方式二：本地构建

#### 环境要求

- Node.js 22+
- pnpm 10+
- Android Studio
- JDK 17

#### 安装依赖

```bash
cd AutoClicker
pnpm install
```

#### 运行应用

```bash
# 启动 Metro bundler
pnpm start

# 运行 Android (新终端)
pnpm android
```

## 使用说明

1. **启用无障碍服务**
   - 打开应用
   - 点击"去设置"按钮
   - 在系统设置中启用"AutoClicker"无障碍服务

2. **创建脚本**
   - 点击"新建脚本"按钮
   - 输入脚本名称和描述

3. **编辑点位**
   - 点击脚本卡片上的"编辑点位"按钮
   - 打开悬浮窗可视化编辑器
   - 点击"添加点位"在屏幕中央创建瞄准镜标记
   - 拖动瞄准镜到目标位置
   - 点击编辑按钮配置延迟、抖动等参数

4. **运行脚本**
   - 点击脚本卡片上的"运行"按钮
   - 应用将按配置自动执行点击

## 项目结构

```
AutoClicker/
├── android/              # Android 原生代码
├── src/
│   ├── components/       # UI 组件
│   │   ├── ScriptList.tsx           # 脚本列表
│   │   ├── ClickPointList.tsx       # 点击点列表（旧版）
│   │   └── FloatingEditor/          # 悬浮窗编辑器
│   │       ├── FloatingEditor.tsx   # 编辑器主容器
│   │       ├── EditorPanel.tsx      # 操作面板
│   │       ├── MarkerLayer.tsx      # 标记层
│   │       └── TargetMarker.tsx     # 瞄准镜标记
│   ├── screens/          # 页面
│   ├── store/            # 状态管理
│   ├── services/         # 业务逻辑
│   ├── native/           # 原生模块接口
│   ├── types/            # TypeScript 类型
│   ├── utils/            # 工具函数
│   └── constants/        # 常量配置
├── docs/                 # 项目文档
└── App.tsx               # 应用入口
```

## 文档

- [项目总结](docs/00-project-summary.md)
- [项目初始化](docs/01-project-initialization.md)
- [核心功能实现](docs/02-core-implementation.md)
- [构建和测试](docs/03-build-and-test.md)
- [GitHub Actions 指南](docs/04-github-actions-guide.md)
- [GitHub Actions 快速开始](docs/05-github-actions-quickstart.md)

## 开发命令

```bash
# 开发
pnpm start                # 启动 Metro bundler
pnpm android              # 运行 Android
pnpm test                 # 运行测试
pnpm lint                 # 代码检查

# 构建
cd android && ./gradlew assembleRelease    # 构建 APK
cd android && ./gradlew bundleRelease      # 构建 AAB

# 清理
pnpm start -- --reset-cache               # 清理缓存
cd android && ./gradlew clean             # 清理构建
```

## 注意事项

1. **权限要求**: 必须启用无障碍服务才能使用
2. **Android 版本**: 最低支持 Android 7.0 (API 24)
3. **性能考虑**: 每个脚本最多支持 50 个点击点

## 已完成功能

- ✅ 多脚本管理（创建、编辑、复制、删除）
- ✅ 悬浮窗可视化点位编辑器
- ✅ 瞄准镜样式可拖动标记
- ✅ 点位参数配置（延迟、抖动等）
- ✅ 脚本执行引擎
- ✅ 数据持久化

## 许可证

MIT License

## 作者

Generated with Claude Code
