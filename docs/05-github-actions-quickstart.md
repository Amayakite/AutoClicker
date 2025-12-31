# GitHub Actions 快速开始

## 第一步：推送代码到 GitHub

### 1. 初始化 Git 仓库（如果还没有）
```bash
cd AutoClicker
git init
git add .
git commit -m "Initial commit: AutoClicker project with GitHub Actions"
```

### 2. 创建 GitHub 仓库
1. 访问 https://github.com/new
2. 仓库名称: `AutoClicker`
3. 选择 Public 或 Private
4. 不要初始化 README（我们已经有了）
5. 点击 "Create repository"

### 3. 关联远程仓库并推送
```bash
git remote add origin https://github.com/YOUR_USERNAME/AutoClicker.git
git branch -M main
git push -u origin main
```

## 第二步：查看自动构建

### 1. 进入 Actions 页面
推送代码后，GitHub Actions 会自动开始构建：
1. 进入你的 GitHub 仓库
2. 点击 "Actions" 标签
3. 你会看到 "Android Build" 工作流正在运行

### 2. 监控构建进度
- 🟡 黄色圆圈：构建进行中
- ✅ 绿色勾号：构建成功
- ❌ 红色叉号：构建失败

点击构建任务��以查看详细日志。

## 第三步：下载 APK

### 构建成功后
1. 点击成功的构建任务
2. 滚动到页面底部
3. 在 "Artifacts" 部分，你会看到：
   - **AutoClicker-Debug-APK** - 开发版（可查看日志）
   - **AutoClicker-Release-APK** - 生产版

4. 点击下载对应的 APK
5. 解压 zip 文件
6. 将 APK 传输到 Android 设备安装

## 第四步：安装 APK

### 在 Android 设备上
1. 启用"未知来源"安装：
   - 设置 -> 安全 -> 未知来源
   - 或：设置 -> 应用 -> 特殊访问权限 -> 安装未知应用

2. 使用文件管理器找到 APK 文件

3. 点击安装

4. 安装完成后，启用无障碍服务：
   - 打开应用
   - 点击"去设置"
   - 启用"AutoClicker"无障碍服务

## 手动触发构建

如果你想在不推送代码的情况下构建：

1. 进入 GitHub 仓库的 "Actions" 页面
2. 点击左侧的 "Android Build"
3. 点击右侧的 "Run workflow" 按钮
4. 选择分支（通常是 main）
5. 点击绿色的 "Run workflow" 按钮

## 版本更新

### 更新版本号
编辑 `android/app/build.gradle`:
```gradle
defaultConfig {
    versionCode 2        // 每次发布递增
    versionName "1.1"    // 版本名称
}
```

### 提交并推送
```bash
git add android/app/build.gradle
git commit -m "Bump version to 1.1"
git push
```

GitHub Actions 会自动使用新版本号构建。

## 两个版本的区别

### Debug 版本（开发版）
- **包名**: `com.autoclicker.debug`
- **用途**: 开发和调试
- **特点**:
  - 可以查看详细日志
  - 可以使用 Chrome DevTools 调试
  - 可以与 Release 版本同时安装
  - 文件较大（未优化）

### Release 版本（生产版）
- **包名**: `com.autoclicker`
- **用途**: 正式发布
- **特点**:
  - 代码已优化
  - 文件较小
  - 性能更好
  - 不能查看详细日志

## 常见问题

### Q: 构建失败怎么办？
A:
1. 点击失败的构建查看日志
2. 查找错误信息
3. 修复问题后重新推送代码

### Q: 下载的文件是 zip 格式？
A:
是的，GitHub Actions 会将 APK 打包成 zip。解压后即可获得 APK 文件。

### Q: APK 无法安装？
A:
1. 确保启用了"未知来源"安装
2. 检查 Android 版本（最低 7.0）
3. 确保下载完整（检查文件大小）

### Q: 构建需要多长时间？
A:
- 首次构建: 10-15 分钟
- 后续构建: 5-8 分钟（使用缓存）

### Q: 可以同时安装两个版本吗？
A:
可以！Debug 版本和 Release 版本使用不同的包名，可以同时安装。

## 下一步

1. ✅ 推送代码到 GitHub
2. ✅ 等待自动构建完成
3. ✅ 下载并安装 APK
4. ✅ 测试应用功能
5. 📝 根据测试结果修复问题
6. 🔄 重复上述流程

## 需要帮助？

- 查看完整文档: `docs/04-github-actions-guide.md`
- 查看构建日志: GitHub Actions 页面
- 提交 Issue: GitHub 仓库的 Issues 页面

---

**提示**: 第一次构建可能需要较长时间，请耐心等待。后续构建会因为缓存而更快。
