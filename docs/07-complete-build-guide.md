# 使用 GitHub Actions 构建 APK - 完整指南

## 前提条件

- ✅ 已完成项目开发
- ✅ 有 GitHub 账号
- ✅ 已安装 Git

## 方式一：使用自动化脚本（推荐）

### Windows 用户

1. 打开命令提示符（CMD）或 PowerShell
2. 进入项目目录
3. 运行脚本：

```cmd
cd AutoClicker
init-github.bat YOUR_GITHUB_USERNAME
```

例如：
```cmd
init-github.bat zhangsan
```

### Linux/Mac 用户

1. 打开终端
2. 进入项目目录
3. 添加执行权限并运行：

```bash
cd AutoClicker
chmod +x init-github.sh
./init-github.sh YOUR_GITHUB_USERNAME
```

例如：
```bash
./init-github.sh zhangsan
```

### 脚本会自动完成

- ✅ 初始化 Git 仓库
- ✅ 添加所有文件
- ✅ 创建初始提交
- ✅ 设置主分支为 main
- ✅ 配置远程仓库地址

## 方式二：手动操作

### 1. 初始化 Git 仓库

```bash
cd AutoClicker
git init
```

### 2. 添加文件

```bash
git add .
```

### 3. 创建提交

```bash
git commit -m "Initial commit: AutoClicker with GitHub Actions"
```

### 4. 设置主分支

```bash
git branch -M main
```

### 5. 添加远程仓库

```bash
git remote add origin https://github.com/YOUR_USERNAME/AutoClicker.git
```

## 创建 GitHub 仓库

### 1. 访问 GitHub

打开浏览器，访问: https://github.com/new

### 2. 填写仓库信息

- **Repository name**: `AutoClicker`
- **Description**: `Android 自动点击器 - React Native`
- **Public** 或 **Private**: 根据需要选择
- **⚠️ 重要**: 不要勾选 "Add a README file"
- **⚠️ 重要**: 不要选择 .gitignore 模板
- **⚠️ 重要**: 不要选择 license

### 3. 创建仓库

点击 "Create repository" 按钮

## 推送代码

### 1. 推送到 GitHub

```bash
git push -u origin main
```

如果遇到认证问题，可能需要：
- 使用 Personal Access Token (PAT)
- 配置 SSH 密钥

### 2. 等待推送完成

推送完成后，你会看到类似输出：
```
Enumerating objects: 100, done.
Counting objects: 100% (100/100), done.
...
To https://github.com/YOUR_USERNAME/AutoClicker.git
 * [new branch]      main -> main
```

## 查看自动构建

### 1. 进入 Actions 页面

推送完成后，立即访问：
```
https://github.com/YOUR_USERNAME/AutoClicker/actions
```

### 2. 查看构建状态

你会看到 "Android Build" 工作流正在运行：

- 🟡 **黄色圆圈**: 构建进行中
- ✅ **绿色勾号**: 构建成功
- ❌ **红色叉号**: 构建失败

### 3. 查看构建日志

点击构建任务可以查看详细日志：
- 每个步骤的执行情况
- 错误信息（如果有）
- 构建时间

### 4. 等待构建完成

- **首次构建**: 约 10-15 分钟
- **后续构建**: 约 5-8 分钟（使用缓存）

## 下载 APK

### 1. 构建成功后

当看到绿色勾号时，表示构建成功。

### 2. 进入构建详情

点击成功的构建任务。

### 3. 滚动到底部

在页面底部找到 "Artifacts" 部分。

### 4. 下载 APK

你会看到两个下载选项：

#### AutoClicker-Debug-APK（开发版）
- 文件名: `AutoClicker-v1.0-debug.apk`
- 包名: `com.autoclicker.debug`
- 特点:
  - ✅ 可查看详细日志
  - ✅ 可使用 Chrome DevTools 调试
  - ✅ 可与 Release 版本共存
  - ❌ 文件较大（未优化）

#### AutoClicker-Release-APK（生产版）
- 文件名: `AutoClicker-v1.0-release.apk`
- 包名: `com.autoclicker`
- 特点:
  - ✅ 代码已优化
  - ✅ 文件较小
  - ✅ 性能更好
  - ❌ 不能查看详细日志

### 5. 解压文件

下载的是 zip 文件，需要解压：
- Windows: 右键 -> 解压到当前文件夹
- Mac: 双击 zip 文件
- Linux: `unzip AutoClicker-Debug-APK.zip`

## 安装 APK

### 1. 传输到 Android 设备

方式一：USB 连接
- 连接手机到电脑
- 将 APK 文件复制到手机

方式二：云存储
- 上传到云盘（如百度网盘、Google Drive）
- 在手机上下载

方式三：直接下载
- 在手机浏览器中访问 GitHub Actions 页面
- 直接下载 APK

### 2. 启用未知来源安装

在 Android 设备上：
- 设置 -> 安全 -> 未知来源（勾选）
- 或：设置 -> 应用 -> 特殊访问权限 -> 安装未知应用

### 3. 安装 APK

- 使用文件管理器找到 APK 文件
- 点击 APK 文件
- 点击"安装"
- 等待安装完成

### 4. 启用无障碍服务

安装完成后：
1. 打开应用
2. 点击"去设置"按钮
3. 在系统设置中找到"AutoClicker"
4. 启用无障碍服务
5. 返回应用

## 更新版本

### 1. 修改版本号

编辑 `android/app/build.gradle`:

```gradle
defaultConfig {
    versionCode 2        // 每次发布递增
    versionName "1.1"    // 版本名称
}
```

### 2. 提交并推送

```bash
git add android/app/build.gradle
git commit -m "Bump version to 1.1"
git push
```

### 3. 等待新版本构建

GitHub Actions 会自动使用新版本号构建。

## 常见问题

### Q1: 推送时要求输入用户名和密码？

**A**: GitHub 已不再支持密码认证，需要使用 Personal Access Token (PAT)：

1. 访问: https://github.com/settings/tokens
2. 点击 "Generate new token (classic)"
3. 勾选 "repo" 权限
4. 生成并复制 token
5. 推送时使用 token 作为密码

### Q2: 构建失败怎么办？

**A**:
1. 点击失败的构建查看日志
2. 查找红色错误信息
3. 常见问题：
   - 依赖安装失败：重新运行工作流
   - Gradle 构建失败：检查 build.gradle 配置
   - 权限问题：确保 gradlew 有执行权限

### Q3: 下载的 APK 无法安装？

**A**:
1. 确保已启用"未知来源"安装
2. 检查 Android 版本（最低 7.0）
3. 确保下载完整（检查文件大小）
4. 尝试重新下载

### Q4: 可以同时安装两个版本吗？

**A**: 可以！Debug 版本（com.autoclicker.debug）和 Release 版本（com.autoclicker）使用不同的包名，可以同时安装。

### Q5: APK 文件过期了？

**A**:
- Debug APK 保留 30 天
- Release APK 保留 90 天
- 过期后需要重新构建或手动触发工作流

### Q6: 如何手动触发构建？

**A**:
1. 进入 GitHub 仓库的 Actions 页面
2. 点击左侧的 "Android Build"
3. 点击右侧的 "Run workflow" 按钮
4. 选择分支（通常是 main）
5. 点击绿色的 "Run workflow" 按钮

## 下一步

### 开发流程

1. 修改代码
2. 提交更改: `git commit -am "描述"`
3. 推送代码: `git push`
4. 等待自动构建
5. 下载并测试新版本
6. 重复上述流程

### 发布流程

1. 更新版本号
2. 测试所有功能
3. 推送代码
4. 下载 Release APK
5. 分发给用户

## 需要帮助？

- 📖 查看完整文档: `docs/` 目录
- 🐛 提交问题: GitHub Issues
- 💬 查看构建日志: GitHub Actions 页面

---

**提示**: 第一次使用可能会遇到一些问题，这是正常的。仔细阅读错误信息，大多数问题都可以通过查看日志解决。
