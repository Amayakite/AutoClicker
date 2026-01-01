# 核心功能实现文档

## 日期
2025-12-31

## 更新记录
- 2025-12-31: 初始版本
- 2025-01-01: 新增多脚本支持和悬浮可视化编辑器

## 已完成功能

### 1. 项目架构

#### 1.1 目录结构
```
AutoClicker/
├── android/                          # Android 原生代码
│   └── app/src/main/
│       ├── java/com/autoclicker/
│       │   ├── accessibility/
│       │   │   └── AutoClickerService.kt    # 无障碍服务
│       │   ├── AccessibilityModule.kt       # React Native 桥接模块
│       │   ├── AccessibilityPackage.kt      # 模块注册包
│       │   ├── MainActivity.kt
│       │   └── MainApplication.kt
│       └── res/
│           ├── values/strings.xml
│           └── xml/accessibility_service_config.xml
├── src/
│   ├── components/
│   │   ├── ClickPointList.tsx       # 点击点列表组件（保留）
│   │   ├── ScriptList.tsx           # ⭐ 多脚本列表组件
│   │   └── FloatingEditor/          # ⭐ 悬浮可视化编辑器
│   │       ├── FloatingEditor.tsx   # Modal 容器
│   │       ├── EditorPanel.tsx      # 可拖动控制面板
│   │       ├── MarkerLayer.tsx      # 标记管理层
│   │       ├── TargetMarker.tsx     # 十字准星标记
│   │       └── index.tsx            # 导出文件
│   ├── screens/
│   │   └── ConfigScreen.tsx         # 配置主界面（已重构）
│   ├── store/
│   │   └── clickStore.ts            # Zustand 状态管理（已重构支持多脚本）
│   ├── services/
│   │   └── executionEngine.ts       # 执行引擎
│   ├── native/
│   │   └── AccessibilityModule.ts   # 原生模块 TypeScript 接口
│   ├── types/
│   │   └── index.ts                 # TypeScript 类型定义（新增 Script, ScriptConfig）
│   ├── utils/
│   │   └── helpers.ts               # 工具函数
│   └── constants/
│       └── config.ts                # 常量配置（新增 EDITOR_CONFIG）
├── docs/                            # 文档目录
└── App.tsx                          # 应用入口
```

### 2. 核心模块实现

#### 2.1 Android 无障碍服务 (AutoClickerService.kt)

**功能**:
- 实现 Android AccessibilityService
- 提供模拟点击功能
- 使用 GestureDescription API 执行点击手势

**关键代码**:
```kotlin
fun performClick(x: Int, y: Int, callback: ((Boolean) -> Unit)? = null) {
    val path = Path()
    path.moveTo(x.toFloat(), y.toFloat())

    val gestureBuilder = GestureDescription.Builder()
    val strokeDescription = GestureDescription.StrokeDescription(path, 0, 100)
    gestureBuilder.addStroke(strokeDescription)

    dispatchGesture(gestureBuilder.build(), ...)
}
```

**配置**:
- AndroidManifest.xml 中注册服务
- accessibility_service_config.xml 配置权限
- 需要用户手动在系统设置中启用

#### 2.2 React Native 桥接 (AccessibilityModule.kt)

**功能**:
- 连接 JavaScript 和 Android 原生代码
- 提供权限检查和请求接口
- 暴露点击模拟方法给 JS 层

**API**:
```typescript
interface AccessibilityModuleInterface {
  checkPermission(): Promise<boolean>;
  requestPermission(): Promise<void>;
  simulateClick(x: number, y: number): Promise<void>;
  isServiceEnabled(): Promise<boolean>;
}
```

#### 2.3 状态管理 (clickStore.ts) ⭐ 已重构

**使用**: Zustand + AsyncStorage 持久化

**新版状态结构（v2）**:
```typescript
{
  scripts: Script[];           // 脚本数组（每个脚本包含独立的 points[]）
  activeScriptId: string | null; // 当前活跃脚本
  globalConfig: GlobalConfig;  // 全局配置
  execution: ExecutionState;   // 执行状态
}
```

**主要方法**:
- 脚本操作: `addScript`, `updateScript`, `deleteScript`, `duplicateScript`, `toggleScript`, `setActiveScript`
- 点击点操作: `addPointToScript`, `updatePointInScript`, `deletePointFromScript`, `reorderPointsInScript`, `togglePointInScript`, `clearPointsInScript`
- 便捷方法: `getActiveScript()`, `getScriptById(id)`
- 配置操作: `updateGlobalConfig`
- 执行操作: `startExecution(scriptId)`, `stopExecution`, `updateExecutionState`

#### 2.4 执行引擎 (executionEngine.ts)

**功能**:
- 按顺序执行点击序列
- 支持启动延迟
- 支持循环执行
- 支持抖动和漂移
- 支持震动反馈

**执行流程**:
```
1. 检查无障碍服务是否启用
2. 过滤出已启用的点击点
3. 等待启动延迟
4. 循环执行:
   a. 遍历每个点击点
   b. 计算抖动后的坐标（如果启用）
   c. 调用原生模块执行点击
   d. 震动反馈（如果启用）
   e. 等待点击延迟
5. 检查是否需要继续循环
```

**抖动算法**:
```typescript
const jitterX = (Math.random() * 2 - 1) * jitterRange;
const jitterY = (Math.random() * 2 - 1) * jitterRange;
// 在 [-jitterRange, +jitterRange] 范围内随机偏移
```

### 3. UI 组件

#### 3.1 ConfigScreen (主界面)

**功能**:
- 显示应用标题栏
- 无障碍服务状态提示
- 全局设置对话框
- 运行/停止 FAB 按钮

**全局设置项**:
- 启动延迟 (毫秒)
- 循环执行开关
- 循环次数 (0=无限)
- 震动反馈开关

#### 3.2 ClickPointList (点击点列表)

**功能**:
- 显示所有点击点
- 拖拽排序 (使用 react-native-draggable-flatlist)
- 启用/禁用开关
- 编辑点击点
- 删除点击点
- 添加新点击点

**点击点编辑项**:
- 名称
- X/Y 坐标
- 延迟时间
- 抖动开关及范围
- 漂移开关及速度

### 4. 数据模型

#### 4.1 ClickPoint (点击点)
```typescript
{
  id: string;              // 唯一标识
  order: number;           // 排序序号
  x: number;               // X 坐标
  y: number;               // Y 坐标
  delay: number;           // 点击后延迟 (毫秒)
  jitter: boolean;         // 是否启用抖动
  jitterRange: number;     // 抖动范围 (像素)
  drift: boolean;          // 是否启用漂移
  driftSpeed: number;      // 漂移速度
  enabled: boolean;        // 是否启用
  name?: string;           // 点名称
}
```

#### 4.2 GlobalConfig (全局配置)
```typescript
{
  startDelay: number;          // 启动延迟 (毫秒)
  loopEnabled: boolean;        // 是否循环执行
  loopCount: number;           // 循环次数 (0=无限)
  vibrationEnabled: boolean;   // 震动反馈
}
```

#### 4.3 ExecutionState (执行状态)
```typescript
{
  isRunning: boolean;      // 是否正在执行
  currentIndex: number;    // 当前执行索引
  loopIteration: number;   // 当前循环次数
  startTime: number;       // 开始时间
}
```

### 5. 权限配置

#### 5.1 AndroidManifest.xml 权限
```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.SYSTEM_ALERT_WINDOW" />
<uses-permission android:name="android.permission.VIBRATE" />
```

#### 5.2 无障碍服务权限
- 需要用户在系统设置中手动启用
- 应用会引导用户跳转到设置页面
- 启用后才能执行点击操作

### 6. 依赖包

#### 6.1 核心依赖
```json
{
  "zustand": "^5.0.9",                              // 状态管理
  "react-native-paper": "^5.14.5",                  // UI 组件库
  "react-native-gesture-handler": "^2.30.0",        // 手势处理
  "react-native-reanimated": "^4.2.1",              // 动画库
  "react-native-draggable-flatlist": "^4.0.3",      // 拖拽列表
  "@react-native-async-storage/async-storage": "^2.2.0"  // 本地存储
}
```

### 7. 已实现功能清单

✅ 项目初始化和依赖安装
✅ TypeScript 类型定义
✅ Zustand 状态管理 + 持久化
✅ Android 无障碍服务
✅ React Native 桥接模块
✅ 执行引擎 (支持抖动、延迟、循环)
✅ 主配置界面
✅ 点击点列表组件
✅ 拖拽排序功能
✅ 点击点编辑功能
✅ 全局设置对话框
✅ 权限检查和请求
✅ 多脚本管理 ⭐ NEW
✅ 悬浮可视化编辑器 ⭐ NEW

### 8. 待实现功能

⏳ 漂移功能完整实现
⏳ 悬浮窗快捷控制
⏳ 执行日志
⏳ 真机测试

### 9. 使用说明

#### 9.1 开发环境运行
```bash
# 启动 Metro bundler
cd AutoClicker
pnpm start

# 运行 Android (新终端)
pnpm android
```

#### 9.2 首次使用流程
1. 安装应用到 Android 设备
2. 打开应用
3. 点击"去设置"按钮
4. 在系统设置中启用"AutoClicker"无障碍服务
5. 返回应用
6. **点击 "+" 按钮创建新脚本**
7. **点击"编辑点击点"进入悬浮编辑器**
8. **点击屏幕添加点击点，或拖动十字准星调整坐标**
9. 在控制面板中配置延迟、抖动等参数
10. 点击"完成"保存
11. 点击脚本卡片上的"播放"按钮执行

#### 9.3 使用悬浮编辑器
1. 点击脚本卡片上的"编辑点击点"按钮
2. 在全屏编辑器中点击屏幕添加新点击点
3. 拖动十字准星标记调整坐标位置
4. 在底部控制面板中查看和编辑点击点列表
5. 控制面板可以拖动到屏幕任意位置
6. 点击"完成"返回主界面

#### 9.4 脚本管理
1. 点击 "+" 创建新脚本
2. 点击脚本卡片进行编辑
3. 点击复制图标创建脚本副本
4. 点击删除图标删除脚本
5. 使用开关启用/禁用脚本

#### 9.5 全局设置
1. 点击右上角齿轮图标
2. 设置震动反馈等全局配置
3. 点击"关闭"保存

### 10. 技术亮点

1. **多脚本架构**: 支持创建多个独立脚本，每个脚本有自己的配置
2. **可视化编辑**: 悬浮编辑器支持拖拽标记，直观设置坐标
3. **类型安全**: 全面使用 TypeScript，提供完整的类型定义
4. **状态持久化**: 使用 Zustand + AsyncStorage 自动保存配置
5. **原生集成**: Kotlin 实现的无障碍服务，性能优秀
6. **用户体验**: Material Design 风格，直观易用
7. **PanResponder 拖拽**: 流畅的标记拖动体验
8. **错误处理**: 完善的错误提示和权限引导

### 11. 注意事项

1. **权限要求**: 必须启用无障碍服务才能使用
2. **Android 版本**: 最低支持 Android 7.0 (API 24)
3. **性能考虑**: 每个脚本建议点击点数量不超过 50 个
4. **电池优化**: 长时间运行可能被系统限制，需要关闭电池优化

### 12. 下一步计划

1. 真机测试和 bug 修复
2. 优化悬浮编辑器体验
3. 实现悬浮窗快捷控制
4. 完善漂移功能
5. 添加执行日志
6. 准备发布版本

## 总结

当前已完成自动点击器的核心功能实现，包括：
- 完整的 Android 无障碍服务集成
- **多脚本管理系统**（创建、编辑、复制、删除脚本）
- **悬浮可视化编辑器**（十字准星标记 + 拖拽定位）
- 支持抖动、延迟、循环的执行引擎
- 直观易用的 Material Design UI

应用已具备完整可用性，可以进行真机测试和功能验证。
