# 自动点击器 - 快速开始指南

## 1. 环境准备

### 1.1 必需工具
```bash
# Node.js (v18+)
node --version

# npm 或 yarn
npm --version

# React Native CLI
npm install -g react-native-cli

# Android Studio (包含 Android SDK)
# 下载地址: https://developer.android.com/studio

# JDK 17
java -version
```

### 1.2 环境变量配置 (Windows)
```bash
# 添加到系统环境变量
ANDROID_HOME=C:\Users\<YourUsername>\AppData\Local\Android\Sdk
JAVA_HOME=C:\Program Files\Java\jdk-17

# 添加到 Path
%ANDROID_HOME%\platform-tools
%ANDROID_HOME%\tools
%JAVA_HOME%\bin
```

---

## 2. 项目初始化

### 2.1 创建 React Native 项目
```bash
# 使用 TypeScript 模板
npx react-native@latest init AutoClicker --template react-native-template-typescript

cd AutoClicker
```

### 2.2 安装核心依赖
```bash
# 状态管理
npm install zustand
npm install @types/zustand --save-dev

# UI 组件库
npm install react-native-paper
npm install react-native-vector-icons
npm install react-native-safe-area-context

# 拖拽功能
npm install react-native-draggable-flatlist
npm install react-native-gesture-handler
npm install react-native-reanimated

# 本地存储
npm install @react-native-async-storage/async-storage

# 导航 (可选)
npm install @react-navigation/native
npm install @react-navigation/native-stack
npm install react-native-screens
```

### 2.3 配置 Android 权限
编辑 `android/app/src/main/AndroidManifest.xml`:
```xml
<manifest>
    <!-- 悬浮窗权限 -->
    <uses-permission android:name="android.permission.SYSTEM_ALERT_WINDOW" />

    <!-- 震动权限 -->
    <uses-permission android:name="android.permission.VIBRATE" />

    <application>
        <!-- 无障碍服务声明 -->
        <service
            android:name=".accessibility.AutoClickerService"
            android:permission="android.permission.BIND_ACCESSIBILITY_SERVICE"
            android:exported="true">
            <intent-filter>
                <action android:name="android.accessibilityservice.AccessibilityService" />
            </intent-filter>
            <meta-data
                android:name="android.accessibilityservice"
                android:resource="@xml/accessibility_service_config" />
        </service>
    </application>
</manifest>
```

---

## 3. 项目结构创建

### 3.1 创建目录结构
```bash
mkdir -p src/components
mkdir -p src/screens
mkdir -p src/store
mkdir -p src/services
mkdir -p src/native
mkdir -p src/types
mkdir -p src/utils
mkdir -p src/constants
mkdir -p android/app/src/main/java/com/autoclicker/accessibility
mkdir -p android/app/src/main/res/xml
```

### 3.2 创建基础文件
```bash
# 类型定义
touch src/types/index.ts

# 状态管理
touch src/store/clickStore.ts

# 常量
touch src/constants/config.ts

# 工具函数
touch src/utils/helpers.ts

# 原生模块桥接
touch src/native/AccessibilityModule.ts
touch src/native/OverlayModule.ts
```

---

## 4. 核心代码框架

### 4.1 类型定义 (src/types/index.ts)
```typescript
export interface ClickPoint {
  id: string;
  order: number;
  x: number;
  y: number;
  delay: number;
  jitter: boolean;
  jitterRange: number;
  drift: boolean;
  driftSpeed: number;
  enabled: boolean;
  name?: string;
}

export interface GlobalConfig {
  startDelay: number;
  loopEnabled: boolean;
  loopCount: number;
  vibrationEnabled: boolean;
}

export interface ExecutionState {
  isRunning: boolean;
  currentIndex: number;
  loopIteration: number;
  startTime: number;
}
```

### 4.2 常量配置 (src/constants/config.ts)
```typescript
export const APP_CONFIG = {
  MAX_POINTS: 50,
  MIN_DELAY: 0,
  MAX_DELAY: 60000,
  DEFAULT_DELAY: 1000,
  MAX_JITTER_RANGE: 100,
  DEFAULT_JITTER_RANGE: 10,
  MAX_DRIFT_SPEED: 10,
  DEFAULT_DRIFT_SPEED: 1,
};

export const COLORS = {
  primary: '#6200ee',
  accent: '#03dac4',
  background: '#ffffff',
  surface: '#f5f5f5',
  error: '#b00020',
  text: '#000000',
  disabled: '#9e9e9e',
};
```

### 4.3 原生模块桥接 (src/native/AccessibilityModule.ts)
```typescript
import { NativeModules } from 'react-native';

interface AccessibilityModuleInterface {
  checkPermission(): Promise<boolean>;
  requestPermission(): Promise<void>;
  simulateClick(x: number, y: number): Promise<void>;
  isServiceEnabled(): Promise<boolean>;
}

const { AccessibilityModule } = NativeModules;

export default AccessibilityModule as AccessibilityModuleInterface;
```

---

## 5. Android 原生模块实现

### 5.1 无障碍服务配置
创建 `android/app/src/main/res/xml/accessibility_service_config.xml`:
```xml
<?xml version="1.0" encoding="utf-8"?>
<accessibility-service
    xmlns:android="http://schemas.android.com/apk/res/android"
    android:accessibilityEventTypes="typeAllMask"
    android:accessibilityFeedbackType="feedbackGeneric"
    android:accessibilityFlags="flagDefault"
    android:canPerformGestures="true"
    android:description="@string/accessibility_service_description"
    android:notificationTimeout="100" />
```

### 5.2 无障碍服务实现
创建 `android/app/src/main/java/com/autoclicker/accessibility/AutoClickerService.java`:
```java
package com.autoclicker.accessibility;

import android.accessibilityservice.AccessibilityService;
import android.accessibilityservice.GestureDescription;
import android.graphics.Path;
import android.view.accessibility.AccessibilityEvent;

public class AutoClickerService extends AccessibilityService {
    private static AutoClickerService instance;

    @Override
    public void onAccessibilityEvent(AccessibilityEvent event) {
        // 处理无障碍事件
    }

    @Override
    public void onInterrupt() {
        // 服务中断处理
    }

    @Override
    protected void onServiceConnected() {
        super.onServiceConnected();
        instance = this;
    }

    public static AutoClickerService getInstance() {
        return instance;
    }

    public void performClick(int x, int y) {
        Path path = new Path();
        path.moveTo(x, y);

        GestureDescription.Builder builder = new GestureDescription.Builder();
        GestureDescription.StrokeDescription stroke =
            new GestureDescription.StrokeDescription(path, 0, 100);
        builder.addStroke(stroke);

        dispatchGesture(builder.build(), null, null);
    }
}
```

### 5.3 React Native 桥接模块
创建 `android/app/src/main/java/com/autoclicker/AccessibilityModule.java`:
```java
package com.autoclicker;

import android.content.Intent;
import android.provider.Settings;
import com.facebook.react.bridge.*;
import com.autoclicker.accessibility.AutoClickerService;

public class AccessibilityModule extends ReactContextBaseJavaModule {
    private final ReactApplicationContext reactContext;

    public AccessibilityModule(ReactApplicationContext context) {
        super(context);
        this.reactContext = context;
    }

    @Override
    public String getName() {
        return "AccessibilityModule";
    }

    @ReactMethod
    public void checkPermission(Promise promise) {
        try {
            boolean enabled = AutoClickerService.getInstance() != null;
            promise.resolve(enabled);
        } catch (Exception e) {
            promise.reject("ERROR", e.getMessage());
        }
    }

    @ReactMethod
    public void requestPermission(Promise promise) {
        try {
            Intent intent = new Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS);
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            reactContext.startActivity(intent);
            promise.resolve(null);
        } catch (Exception e) {
            promise.reject("ERROR", e.getMessage());
        }
    }

    @ReactMethod
    public void simulateClick(int x, int y, Promise promise) {
        try {
            AutoClickerService service = AutoClickerService.getInstance();
            if (service != null) {
                service.performClick(x, y);
                promise.resolve(null);
            } else {
                promise.reject("ERROR", "Accessibility service not enabled");
            }
        } catch (Exception e) {
            promise.reject("ERROR", e.getMessage());
        }
    }

    @ReactMethod
    public void isServiceEnabled(Promise promise) {
        try {
            boolean enabled = AutoClickerService.getInstance() != null;
            promise.resolve(enabled);
        } catch (Exception e) {
            promise.reject("ERROR", e.getMessage());
        }
    }
}
```

### 5.4 注册原生模块
编辑 `android/app/src/main/java/com/autoclicker/MainApplication.java`:
```java
@Override
protected List<ReactPackage> getPackages() {
    List<ReactPackage> packages = new PackageList(this).getPackages();
    packages.add(new ReactPackage() {
        @Override
        public List<NativeModule> createNativeModules(ReactApplicationContext reactContext) {
            List<NativeModule> modules = new ArrayList<>();
            modules.add(new AccessibilityModule(reactContext));
            return modules;
        }

        @Override
        public List<ViewManager> createViewManagers(ReactApplicationContext reactContext) {
            return Collections.emptyList();
        }
    });
    return packages;
}
```

---

## 6. 开发工作流

### 6.1 启动开发服务器
```bash
# 终端 1: Metro bundler
npm start

# 终端 2: 运行 Android
npm run android
```

### 6.2 调试
```bash
# 查看日志
npx react-native log-android

# 打开开发菜单 (模拟器)
# 按 Ctrl+M (Windows) 或 Cmd+M (Mac)

# 启用远程调试
# 开发菜单 -> Debug
```

### 6.3 常用命令
```bash
# 清理缓存
npm start -- --reset-cache

# 清理 Android 构建
cd android && ./gradlew clean

# 重新安装依赖
rm -rf node_modules && npm install

# 运行测试
npm test

# 代码检查
npm run lint

# 格式化代码
npm run format
```

---

## 7. 开发顺序建议

### 阶段 1: 基础框架 (1-2 天)
1. ✅ 项目初始化
2. ✅ 依赖安装
3. ✅ 目录结构创建
4. ✅ 类型定义
5. ✅ 状态管理基础

### 阶段 2: UI 开发 (2-3 天)
1. 主界面布局
2. 点击点列表组件
3. 点击点编辑器
4. 全局设置界面
5. 样式和主题

### 阶段 3: 原生功能 (3-4 天)
1. 无障碍服务实现
2. React Native 桥接
3. 权限管理
4. 点击模拟功能
5. 悬浮窗实现

### 阶段 4: 核心逻辑 (2-3 天)
1. 点击点管理
2. 执行引擎
3. 抖动和漂移算法
4. 循环执行逻辑
5. 状态持久化

### 阶段 5: 测试和优化 (2-3 天)
1. 单元测试
2. 集成测试
3. 性能优化
4. Bug 修复
5. 用户体验优化

### 阶段 6: 发布准备 (1-2 天)
1. 文档完善
2. 构建配置
3. 签名设置
4. 发布测试
5. 应用商店准备

**总计: 11-17 天**

---

## 8. 常见问题解决

### 问题 1: Metro bundler 启动失败
```bash
# 解决方案
npx react-native start --reset-cache
```

### 问题 2: Android 构建失败
```bash
# 清理并重新构建
cd android
./gradlew clean
cd ..
npm run android
```

### 问题 3: 无法连接到设备
```bash
# 检查设备连接
adb devices

# 重启 adb
adb kill-server
adb start-server
```

### 问题 4: 原生模块未找到
```bash
# 重新链接原生模块
npx react-native link

# 或手动重新构建
cd android && ./gradlew clean && cd ..
npm run android
```

---

## 9. 下一步

1. **阅读完整技术规范**: `AUTO_CLICKER_PROJECT_SPEC.md`
2. **开始编码**: 按照阶段 1 开始实现
3. **持续集成**: 配置 CI/CD 流程
4. **用户测试**: 邀请用户测试并收集反馈

---

**祝开发顺利！** 🚀
