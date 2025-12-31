# GitHub Actions 自动构建指南

## 概述

本项目配置了 GitHub Actions 自动构建工作流，可以自动构建 Android APK 文件，无需本地环境。

## 构建产物

工作流会生成两个版本的 APK：

### 1. 开发版 APK (Debug)
- **文件名**: `AutoClicker-v1.0-debug.apk`
- **包名**: `com.autoclicker.debug`
- **特点**:
  - 可查看详细日志
  - 用于开发和调试
  - 可与生产版共存
  - 未经过代码优化
  - 文件体积较大

### 2. 生产版 APK (Release)
- **文件名**: `AutoClicker-v1.0-release.apk`
- **包名**: `com.autoclicker`
- **特点**:
  - 代码已优化
  - 文件体积较小
  - 性能更好
  - 用于正式发布

## 触发构建

### 自动触发
工作流会在以下情况自动运行：
- 推送代码到 `main` 或 `develop` 分支
- 创建针对 `main` 分支的 Pull Request

### 手动触发
1. 进入 GitHub 仓库页面
2. 点击 "Actions" 标签
3. 选择 "Android Build" 工作流
4. 点击 "Run workflow" 按钮
5. 选择分支并点击 "Run workflow"

## 下载 APK

### 方法 1: 从 Actions 页面下载
1. 进入 GitHub 仓库的 "Actions" 页面
2. 点击最新的成功构建（绿色勾号）
3. 滚动到页面底部的 "Artifacts" 部分
4. 下载对应的 APK：
   - `AutoClicker-Debug-APK` - 开发版
   - `AutoClicker-Release-APK` - 生产版

### 方法 2: 从构建摘要查看
1. 点击构建任务
2. 查看 "Summary" 页面
3. 可以看到版本信息和构建详情

## 构建时间

- 首次构建: 约 10-15 分钟
- 后续构建: 约 5-8 分钟（使用缓存）

## 构建状态

可以在 README 中添加构建状态徽章：

```markdown
![Android Build](https://github.com/YOUR_USERNAME/AutoClicker/workflows/Android%20Build/badge.svg)
```

## 工作流配置

工作流文件位于: `.github/workflows/android-build.yml`

### 主要步骤
1. **环境准备**
   - Node.js 22
   - pnpm 10
   - Java 17

2. **依赖缓存**
   - pnpm 依赖缓存
   - Gradle 缓存

3. **构建**
   - 安装 npm 依赖
   - 构建 Debug APK
   - 构建 Release APK

4. **上传产物**
   - Debug APK (保留 30 天)
   - Release APK (保留 90 天)

## 版本管理

版本号在 `android/app/build.gradle` 中配置：

```gradle
defaultConfig {
    versionCode 1        // 版本代码（整数）
    versionName "1.0"    // 版本名称（字符串）
}
```

### 更新版本
1. 修改 `versionCode` 和 `versionName`
2. 提交并推送代码
3. GitHub Actions 会自动使用新版本号构建

## 签名配置

### 当前配置
- Debug 和 Release 版本都使用 Android 默认的 debug keystore
- 适用于开发和测试

### 生产环境签名（可选）

如果需要发布到应用商店，需要配置生产签名：

1. **生成签名密钥**
```bash
keytool -genkeypair -v -storetype PKCS12 -keystore release.keystore -alias autoclicker -keyalg RSA -keysize 2048 -validity 10000
```

2. **配置 GitHub Secrets**
   - 进入仓库 Settings -> Secrets and variables -> Actions
   - 添加以下 secrets:
     - `RELEASE_KEYSTORE`: Base64 编码的 keystore 文件
     - `RELEASE_KEYSTORE_PASSWORD`: keystore 密码
     - `RELEASE_KEY_ALIAS`: key 别名
     - `RELEASE_KEY_PASSWORD`: key 密码

3. **修改 build.gradle**
```gradle
signingConfigs {
    release {
        if (System.getenv("CI")) {
            // CI 环境使用环境变量
            storeFile file("release.keystore")
            storePassword System.getenv("RELEASE_KEYSTORE_PASSWORD")
            keyAlias System.getenv("RELEASE_KEY_ALIAS")
            keyPassword System.getenv("RELEASE_KEY_PASSWORD")
        } else {
            // 本地环境使用 gradle.properties
            storeFile file("release.keystore")
            storePassword project.hasProperty("RELEASE_KEYSTORE_PASSWORD") ? RELEASE_KEYSTORE_PASSWORD : ""
            keyAlias project.hasProperty("RELEASE_KEY_ALIAS") ? RELEASE_KEY_ALIAS : ""
            keyPassword project.hasProperty("RELEASE_KEY_PASSWORD") ? RELEASE_KEY_PASSWORD : ""
        }
    }
}
```

## 故障排查

### 构建失败
1. 查看构建日志
2. 检查错误信息
3. 常见问题:
   - 依赖安装失败: 清除缓存重试
   - Gradle 构建失败: 检查 build.gradle 配置
   - 内存不足: GitHub Actions 提供 7GB 内存，通常足够

### 下载的 APK 无法安装
1. 确保下载完整（检查文件大小）
2. 解压 zip 文件获取 APK
3. 在 Android 设备上启用"未知来源"安装

### APK 文件过期
- Debug APK 保留 30 天
- Release APK 保留 90 天
- 过期后需要重新构建

## 优化建议

### 加速构建
1. 使用缓存（已配置）
2. 减少依赖数量
3. 使用增量构建

### 减小 APK 体积
1. 启用 ProGuard（Release 版本）
2. 移除未使用的资源
3. 使用 APK 分析工具

## 相关链接

- [GitHub Actions 文档](https://docs.github.com/en/actions)
- [React Native 构建文档](https://reactnative.dev/docs/signed-apk-android)
- [Android 签名文档](https://developer.android.com/studio/publish/app-signing)

## 常用命令

```bash
# 本地构建 Debug APK
cd android && ./gradlew assembleDebug

# 本地构建 Release APK
cd android && ./gradlew assembleRelease

# 清理构建
cd android && ./gradlew clean

# 查看构建任务
cd android && ./gradlew tasks
```

## 注意事项

1. **首次推送**: 确保 `.github/workflows/android-build.yml` 文件已提交
2. **分支保护**: 建议为 main 分支设置保护规则
3. **构建限制**: GitHub Actions 免费账户每月 2000 分钟
4. **存储限制**: Artifacts 存储空间有限，定期清理旧版本

## 支持

如有问题，请查看：
1. GitHub Actions 构建日志
2. 项目文档 `docs/` 目录
3. 提交 Issue 到 GitHub 仓库
