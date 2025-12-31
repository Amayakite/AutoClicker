# 自动点击器 (AutoClicker)

一个基于 React Native 的 Android 自动点击应用，支持配置多个点击点并自动执行。

## 功能特性

- ✅ 配置多个点击点（支持拖拽排序）
- ✅ 单点配置（坐标、延迟、抖动、漂移）
- ✅ 全局配置（启动延迟、循环执行、震动反馈）
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

2. **添加点击点**
   - 点击左下角"添加点击点"按钮
   - 编辑坐标和配置参数

3. **调整顺序**
   - 长按列表项左侧拖拽图标
   - 上下拖动调整执行顺序

4. **全局设置**
   - 点击右上角齿轮图标
   - 配置启动延迟、循环次数等

5. **开始执行**
   - 点击右下角"运行"按钮
   - 应用将按配置自动执行点击

## 项目结构

```
AutoClicker/
├── android/              # Android 原生代码
├── src/
│   ├── components/       # UI 组件
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
3. **坐标获取**: 当前需要手动输入坐标
4. **性能考虑**: 建议点击点数量不超过 50 个

## 待实现功能

- ⏳ 屏幕坐标选择器
- ⏳ 悬浮窗快捷控制
- ⏳ 漂移功能完善
- ⏳ 执行日志
- ⏳ 配置导入导出

## 许可证

MIT License

## 作者

Generated with Claude Code
