# 构建和测试指南

## 日期
2025-12-31

## 1. 开发环境测试

### 1.1 启动开发服务器
```bash
cd AutoClicker
pnpm start
```

### 1.2 运行 Android 应用
在新终端中:
```bash
cd AutoClicker
pnpm android
```

### 1.3 常见问题排查

#### 问题 1: Metro bundler 无法启动
```bash
# 清理缓存
pnpm start -- --reset-cache
```

#### 问题 2: Android 构建失败
```bash
# 清理 Android 构建
cd android
./gradlew clean
cd ..
pnpm android
```

#### 问题 3: 原生模块未找到
```bash
# 重新构建
cd android
./gradlew clean
cd ..
pnpm android
```

## 2. 真机测试步骤

### 2.1 准备工作
1. 启用 Android 设备的开发者选项
2. 启用 USB 调试
3. 连接设备到电脑

### 2.2 检查设备连接
```bash
adb devices
```

应该看到类似输出:
```
List of devices attached
XXXXXXXXXX      device
```

### 2.3 安装应用
```bash
cd AutoClicker
pnpm android
```

### 2.4 测试清单

#### ✅ 基础功能测试
- [ ] 应用正常启动
- [ ] 无障碍服务权限请求正常
- [ ] 可以添加点击点
- [ ] 可以编辑点击点
- [ ] 可以删除点击点
- [ ] 可以拖拽排序
- [ ] 可以启用/禁用点击点

#### ✅ 执行功能测试
- [ ] 点击"运行"按钮
- [ ] 执行启动延迟
- [ ] 按顺序点击各个点
- [ ] 点击延迟正常
- [ ] 震动反馈正常
- [ ] 可以停止执行

#### ✅ 抖动功能测试
- [ ] 启用抖动
- [ ] 设置抖动范围
- [ ] 执行时坐标有随机偏移

#### ✅ 循环功能测试
- [ ] 启用循环执行
- [ ] 设置循环次数
- [ ] 执行指定次数后停止
- [ ] 无限循环正常工作

#### ✅ 数据持久化测试
- [ ] 添加点击点后关闭应用
- [ ] 重新打开应用
- [ ] 点击点数据保留
- [ ] 全局配置保留

#### ✅ 权限测试
- [ ] 未启用无障碍服务时显示警告
- [ ] 点击"去设置"跳转到设置页面
- [ ] 启用服务后警告消失
- [ ] 禁用服务后警告重新出现

## 3. 性能测试

### 3.1 测试场景
1. **少量点击点** (5个)
   - 执行流畅度
   - 内存占用
   - CPU 使用率

2. **中等点击点** (20个)
   - 执行流畅度
   - 内存占用
   - CPU 使用率

3. **大量点击点** (50个)
   - 执行流畅度
   - 内存占用
   - CPU 使用率

4. **长时间运行** (30分钟)
   - 应用稳定性
   - 内存泄漏检查
   - 电池消耗

### 3.2 性能监控
使用 Android Studio Profiler:
```bash
# 打开 Android Studio
# Tools -> Android -> Android Device Monitor
# 或使用 adb 命令
adb shell dumpsys meminfo com.autoclicker
```

## 4. 构建发布版本

### 4.1 生成签名密钥
```bash
cd AutoClicker/android/app
keytool -genkeypair -v -storetype PKCS12 -keystore autoclicker-release.keystore -alias autoclicker -keyalg RSA -keysize 2048 -validity 10000
```

### 4.2 配置签名
编辑 `android/gradle.properties`:
```properties
AUTOCLICKER_RELEASE_STORE_FILE=autoclicker-release.keystore
AUTOCLICKER_RELEASE_KEY_ALIAS=autoclicker
AUTOCLICKER_RELEASE_STORE_PASSWORD=your_store_password
AUTOCLICKER_RELEASE_KEY_PASSWORD=your_key_password
```

编辑 `android/app/build.gradle`:
```gradle
android {
    ...
    signingConfigs {
        release {
            if (project.hasProperty('AUTOCLICKER_RELEASE_STORE_FILE')) {
                storeFile file(AUTOCLICKER_RELEASE_STORE_FILE)
                storePassword AUTOCLICKER_RELEASE_STORE_PASSWORD
                keyAlias AUTOCLICKER_RELEASE_KEY_ALIAS
                keyPassword AUTOCLICKER_RELEASE_KEY_PASSWORD
            }
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled true
            proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
        }
    }
}
```

### 4.3 构建 APK
```bash
cd AutoClicker/android
./gradlew assembleRelease
```

生成的 APK 位于:
```
android/app/build/outputs/apk/release/app-release.apk
```

### 4.4 构建 AAB (Google Play)
```bash
cd AutoClicker/android
./gradlew bundleRelease
```

生成的 AAB 位于:
```
android/app/build/outputs/bundle/release/app-release.aab
```

## 5. 测试结果记录

### 5.1 测试环境
- 设备型号: _____________
- Android 版本: _____________
- 测试日期: _____________

### 5.2 功能测试结果
| 功能 | 状态 | 备注 |
|------|------|------|
| 添加点击点 | ⬜ | |
| 编辑点击点 | ⬜ | |
| 删除点击点 | ⬜ | |
| 拖拽排序 | ⬜ | |
| 执行点击 | ⬜ | |
| 抖动功能 | ⬜ | |
| 循环执行 | ⬜ | |
| 数据持久化 | ⬜ | |
| 权限管理 | ⬜ | |

### 5.3 性能测试结果
| 指标 | 5个点 | 20个点 | 50个点 |
|------|-------|--------|--------|
| 内存占用 (MB) | | | |
| CPU 使用率 (%) | | | |
| 执行流畅度 | | | |

### 5.4 已知问题
1. _____________
2. _____________
3. _____________

## 6. 调试技巧

### 6.1 查看日志
```bash
# 查看所有日志
adb logcat

# 过滤应用日志
adb logcat | grep "AutoClicker"

# 查看 React Native 日志
npx react-native log-android
```

### 6.2 远程调试
1. 在设备上摇晃手机或运行 `adb shell input keyevent 82`
2. 选择 "Debug"
3. 在 Chrome 中打开 `chrome://inspect`
4. 点击 "inspect" 开始调试

### 6.3 性能分析
```bash
# 启动性能分析
adb shell am start -n com.autoclicker/.MainActivity --es "profile" "true"

# 生成性能报告
adb shell am profile start com.autoclicker /sdcard/profile.trace
# ... 运行应用 ...
adb shell am profile stop com.autoclicker
adb pull /sdcard/profile.trace
```

## 7. 自动化测试 (待实现)

### 7.1 单元测试
```bash
pnpm test
```

### 7.2 集成测试
```bash
# 使用 Detox
pnpm test:e2e
```

## 8. 发布前检查清单

- [ ] 所有功能测试通过
- [ ] 性能测试通过
- [ ] 无内存泄漏
- [ ] 无崩溃问题
- [ ] 权限说明清晰
- [ ] 用户指南完整
- [ ] 版本号已更新
- [ ] 签名配置正确
- [ ] 混淆配置正确
- [ ] 图标和启动画面正确
- [ ] 应用描述准确
- [ ] 隐私政策完整

## 9. 下一步

1. 完成真机测试
2. 修复发现的问题
3. 优化性能
4. 准备发布材料
5. 提交到应用商店

## 附录: 常用命令

```bash
# 清理项目
pnpm run clean

# 重新安装依赖
rm -rf node_modules && pnpm install

# 清理 Android 构建
cd android && ./gradlew clean && cd ..

# 卸载应用
adb uninstall com.autoclicker

# 安装 APK
adb install -r android/app/build/outputs/apk/release/app-release.apk

# 查看应用信息
adb shell dumpsys package com.autoclicker

# 强制停止应用
adb shell am force-stop com.autoclicker

# 启动应用
adb shell am start -n com.autoclicker/.MainActivity
```
