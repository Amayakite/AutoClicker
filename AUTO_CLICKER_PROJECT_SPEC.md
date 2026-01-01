# 自动点击器 (Auto Clicker) - 项目技术规范文档

## 1. 项目概述

### 1.1 项目名称
自动点击器 (Auto Clicker)

### 1.2 项目描述
一个基于 React Native 的移动应用，允许用户配置多个屏幕点击点，并通过悬浮窗触发自动化点击序列。应用利用系统无障碍权限实现模拟点击功能。

### 1.3 核心功能
- 配置多个点击点（支持拖拽排序）
- 全局配置（延迟启动时间）
- 单点配置（点击延迟、抖动、漂移）
- 悬浮窗触发执行
- 点击序列自动执行

---

## 2. 技术栈

### 2.1 前端框架
- **React Native** (v0.73+)
  - 跨平台开发框架
  - 丰富的社区生态
  - 热更新支持

### 2.2 状态管理
- **Zustand** 或 **Redux Toolkit**
  - 轻量级状态管理
  - TypeScript 友好
  - 持久化支持

### 2.3 UI 组件库
- **React Native Paper** 或 **NativeBase**
  - Material Design 风格
  - 开箱即用的组件
  - 主题定制

### 2.4 拖拽功能
- **react-native-draggable-flatlist**
  - 列表项拖拽排序
  - 流畅的动画效果
  - 易于集成

### 2.5 本地存储
- **AsyncStorage** 或 **MMKV**
  - 配置数据持久化
  - 快速读写性能

### 2.6 原生模块
- **Android Accessibility Service** (自定义原生模块)
  - 实现模拟点击
  - 悬浮窗权限管理
  - 系统级交互

### 2.7 开发工具
- **TypeScript** (v5.0+)
  - 类型安全
  - 更好的 IDE 支持
- **ESLint + Prettier**
  - 代码规范统一
  - 自动格式化
- **Husky + lint-staged**
  - Git hooks
  - 提交前检查

---

## 3. 系统架构

### 3.1 架构模式
采用 **MVVM (Model-View-ViewModel)** 架构模式

```
┌─────────────────────────────────────────┐
│            View Layer (UI)              │
│  - 配置界面                              │
│  - 点击点列表                            │
│  - 悬浮窗                                │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│         ViewModel Layer                 │
│  - 状态管理 (Zustand/Redux)             │
│  - 业务逻辑                              │
│  - 数据验证                              │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│          Model Layer                    │
│  - 数据模型定义                          │
│  - 本地存储接口                          │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│       Native Bridge Layer               │
│  - Accessibility Service                │
│  - 悬浮窗管理                            │
│  - 点击执行引擎                          │
└─────────────────────────────────────────┘
```

### 3.2 模块划分

#### 3.2.1 UI 模块
- **ConfigScreen**: 配置界面
- **ClickPointList**: 点击点列表（支持拖拽）
- **ClickPointEditor**: 单点编辑器
- **GlobalSettings**: 全局设置
- **FloatingButton**: 悬浮窗按钮

#### 3.2.2 业务逻辑模块
- **ClickPointManager**: 点击点管理
- **ExecutionEngine**: 执行引擎
- **ConfigValidator**: 配置验证

#### 3.2.3 原生模块
- **AccessibilityModule**: 无障碍服务桥接
- **OverlayModule**: 悬浮窗管理
- **ClickSimulator**: 点击模拟器

---

## 4. 数据模型

### 4.1 点击点模型 (ClickPoint)

```typescript
interface ClickPoint {
  id: string;                    // 唯一标识
  order: number;                 // 排序序号
  x: number;                     // X 坐标
  y: number;                     // Y 坐标
  delay: number;                 // 点击后延迟 (毫秒)
  jitter: boolean;               // 是否启用抖动
  jitterRange: number;           // 抖动范围 (像素)
  drift: boolean;                // 是否启用漂移
  driftSpeed: number;            // 漂移速度
  enabled: boolean;              // 是否启用
  name?: string;                 // 点名称（可选）
}
```

### 4.2 全局配置模型 (GlobalConfig)

```typescript
interface GlobalConfig {
  startDelay: number;            // 启动延迟 (毫秒)
  loopEnabled: boolean;          // 是否循环执行
  loopCount: number;             // 循环次数 (0 = 无限)
  vibrationEnabled: boolean;     // 执行时震动反馈
}
```

### 4.3 执行状态模型 (ExecutionState)

```typescript
interface ExecutionState {
  isRunning: boolean;            // 是否正在执行
  currentIndex: number;          // 当前执行索引
  loopIteration: number;         // 当前循环次数
  startTime: number;             // 开始时间
}
```

---

## 5. 核心功能实现

### 5.1 点击点配置

#### 5.1.1 添加点击点
- 用户点击"添加点击点"按钮
- 进入屏幕选择模式（半透明覆盖层）
- 用户点击屏幕任意位置
- 记录坐标并创建 ClickPoint 对象
- 保存到状态管理

#### 5.1.2 拖拽排序
- 使用 `react-native-draggable-flatlist`
- 长按列表项触发拖拽
- 实时更新 order 字段
- 自动保存新顺序

#### 5.1.3 单点编辑
- 点击列表项进入编辑模式
- 可修改：
  - 坐标（手动输入或重新选择）
  - 延迟时间（滑块或输入框）
  - 抖动开关及范围
  - 漂移开关及速度
  - 点名称

### 5.2 全局配置

#### 5.2.1 延迟启动
- 输入框设置延迟时间（毫秒）
- 点击运行后倒计时显示
- 倒计时结束后开始执行

#### 5.2.2 循环执行
- 开关控制是否循环
- 输入框设置循环次数
- 0 表示无限循环

### 5.3 悬浮窗功能

#### 5.3.1 悬浮窗权限
- 检查 `SYSTEM_ALERT_WINDOW` 权限
- 引导用户授权
- 权限状态持久化

#### 5.3.2 悬浮窗显示
- 使用 Android Overlay API
- 可拖动位置
- 显示运行/停止按钮
- 显示当前状态（运行中/已停止）

#### 5.3.3 悬浮窗交互
- 点击按钮触发执行
- 执行中显示进度
- 可随时停止

### 5.4 无障碍服务

#### 5.4.1 服务启动
- 检查无障碍权限
- 引导用户开启服务
- 服务状态监听

#### 5.4.2 点击模拟
- 使用 `AccessibilityService.dispatchGesture()`
- 支持单点点击
- 支持抖动（随机偏移）
- 支持漂移（渐进式移动）

#### 5.4.3 执行引擎
```typescript
// 伪代码
async function executeClickSequence(
  points: ClickPoint[],
  config: GlobalConfig
) {
  // 启动延迟
  await delay(config.startDelay);

  let iteration = 0;
  do {
    for (const point of points) {
      if (!point.enabled) continue;

      // 计算实际点击坐标
      const actualX = point.jitter
        ? point.x + random(-point.jitterRange, point.jitterRange)
        : point.x;
      const actualY = point.jitter
        ? point.y + random(-point.jitterRange, point.jitterRange)
        : point.y;

      // 执行点击
      await simulateClick(actualX, actualY);

      // 点击后延迟
      await delay(point.delay);
    }

    iteration++;
  } while (
    config.loopEnabled &&
    (config.loopCount === 0 || iteration < config.loopCount)
  );
}
```

---

## 6. 技术实现细节

### 6.1 Android 原生模块开发

#### 6.1.1 AccessibilityService 实现
```java
// android/app/src/main/java/com/autoclicker/AutoClickerService.java
public class AutoClickerService extends AccessibilityService {
    @Override
    public void onAccessibilityEvent(AccessibilityEvent event) {
        // 处理无障碍事件
    }

    public void performClick(int x, int y) {
        Path path = new Path();
        path.moveTo(x, y);

        GestureDescription.Builder builder = new GestureDescription.Builder();
        builder.addStroke(new GestureDescription.StrokeDescription(path, 0, 100));

        dispatchGesture(builder.build(), null, null);
    }
}
```

#### 6.1.2 React Native Bridge
```java
// android/app/src/main/java/com/autoclicker/AccessibilityModule.java
@ReactModule(name = "AccessibilityModule")
public class AccessibilityModule extends ReactContextBaseJavaModule {
    @ReactMethod
    public void simulateClick(int x, int y, Promise promise) {
        // 调用 AccessibilityService
    }

    @ReactMethod
    public void checkPermission(Promise promise) {
        // 检查权限状态
    }
}
```

### 6.2 TypeScript 类型定义

```typescript
// src/types/index.ts
export type ClickPoint = {
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
};

export type GlobalConfig = {
  startDelay: number;
  loopEnabled: boolean;
  loopCount: number;
  vibrationEnabled: boolean;
};

export type ExecutionState = {
  isRunning: boolean;
  currentIndex: number;
  loopIteration: number;
  startTime: number;
};
```

### 6.3 状态管理 (Zustand 示例)

```typescript
// src/store/clickStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ClickStore {
  points: ClickPoint[];
  config: GlobalConfig;
  execution: ExecutionState;

  addPoint: (point: ClickPoint) => void;
  updatePoint: (id: string, updates: Partial<ClickPoint>) => void;
  deletePoint: (id: string) => void;
  reorderPoints: (newOrder: ClickPoint[]) => void;
  updateConfig: (updates: Partial<GlobalConfig>) => void;
  startExecution: () => void;
  stopExecution: () => void;
}

export const useClickStore = create<ClickStore>()(
  persist(
    (set) => ({
      points: [],
      config: {
        startDelay: 0,
        loopEnabled: false,
        loopCount: 1,
        vibrationEnabled: true,
      },
      execution: {
        isRunning: false,
        currentIndex: 0,
        loopIteration: 0,
        startTime: 0,
      },

      addPoint: (point) => set((state) => ({
        points: [...state.points, point],
      })),

      updatePoint: (id, updates) => set((state) => ({
        points: state.points.map((p) =>
          p.id === id ? { ...p, ...updates } : p
        ),
      })),

      deletePoint: (id) => set((state) => ({
        points: state.points.filter((p) => p.id !== id),
      })),

      reorderPoints: (newOrder) => set({ points: newOrder }),

      updateConfig: (updates) => set((state) => ({
        config: { ...state.config, ...updates },
      })),

      startExecution: () => set((state) => ({
        execution: {
          ...state.execution,
          isRunning: true,
          startTime: Date.now(),
        },
      })),

      stopExecution: () => set((state) => ({
        execution: {
          ...state.execution,
          isRunning: false,
        },
      })),
    }),
    {
      name: 'click-store',
    }
  )
);
```

---

## 7. 测试策略

### 7.1 单元测试
- **框架**: Jest + React Native Testing Library
- **覆盖范围**:
  - 状态管理逻辑
  - 数据验证函数
  - 工具函数
- **目标覆盖率**: 80%+

```typescript
// __tests__/store/clickStore.test.ts
describe('ClickStore', () => {
  it('should add a click point', () => {
    const { result } = renderHook(() => useClickStore());
    const point: ClickPoint = {
      id: '1',
      order: 0,
      x: 100,
      y: 200,
      delay: 1000,
      jitter: false,
      jitterRange: 0,
      drift: false,
      driftSpeed: 0,
      enabled: true,
    };

    act(() => {
      result.current.addPoint(point);
    });

    expect(result.current.points).toHaveLength(1);
    expect(result.current.points[0]).toEqual(point);
  });
});
```

### 7.2 集成测试
- **框架**: Detox
- **测试场景**:
  - 添加点击点流程
  - 拖拽排序功能
  - 配置保存与加载
  - 执行流程

```typescript
// e2e/addClickPoint.test.ts
describe('Add Click Point', () => {
  beforeAll(async () => {
    await device.launchApp();
  });

  it('should add a new click point', async () => {
    await element(by.id('add-point-button')).tap();
    await element(by.id('screen-overlay')).tap({ x: 100, y: 200 });
    await expect(element(by.id('point-list'))).toHaveChild(
      element(by.text('点 1'))
    );
  });
});
```

### 7.3 手动测试
- **测试设备**:
  - Android 8.0+
  - 不同屏幕尺寸
- **测试场景**:
  - 权限申请流程
  - 悬浮窗显示与交互
  - 实际点击准确性
  - 抖动与漂移效果
  - 长时间运行稳定性

---

## 8. 开发规范

### 8.1 代码规范

#### 8.1.1 命名规范
- **组件**: PascalCase (e.g., `ClickPointList`)
- **函数/变量**: camelCase (e.g., `addClickPoint`)
- **常量**: UPPER_SNAKE_CASE (e.g., `MAX_POINTS`)
- **类型/接口**: PascalCase (e.g., `ClickPoint`)

#### 8.1.2 文件组织
```
src/
├── components/          # UI 组件
│   ├── ClickPointList.tsx
│   ├── ClickPointEditor.tsx
│   └── FloatingButton.tsx
├── screens/            # 页面
│   ├── ConfigScreen.tsx
│   └── SettingsScreen.tsx
├── store/              # 状态管理
│   └── clickStore.ts
├── services/           # 业务逻辑
│   ├── executionEngine.ts
│   └── permissionManager.ts
├── native/             # 原生模块桥接
│   └── AccessibilityModule.ts
├── types/              # 类型定义
│   └── index.ts
├── utils/              # 工具函数
│   └── helpers.ts
└── constants/          # 常量
    └── config.ts
```

#### 8.1.3 ESLint 配置
```json
{
  "extends": [
    "@react-native-community",
    "plugin:@typescript-eslint/recommended"
  ],
  "rules": {
    "no-console": "warn",
    "@typescript-eslint/no-unused-vars": "error",
    "react-hooks/exhaustive-deps": "warn"
  }
}
```

### 8.2 Git 工作流

#### 8.2.1 分支策略
- `main`: 生产分支
- `develop`: 开发分支
- `feature/*`: 功能分支
- `bugfix/*`: 修复分支
- `release/*`: 发布分支

#### 8.2.2 提交规范 (Conventional Commits)
```
<type>(<scope>): <subject>

<body>

<footer>
```

类型:
- `feat`: 新功能
- `fix`: 修复
- `docs`: 文档
- `style`: 格式
- `refactor`: 重构
- `test`: 测试
- `chore`: 构建/工具

示例:
```
feat(click-point): add jitter configuration

- Add jitter toggle switch
- Add jitter range slider
- Update ClickPoint type definition

Closes #123
```

### 8.3 代码审查清单
- [ ] 代码符合命名规范
- [ ] 添加必要的类型注解
- [ ] 添加单元测试
- [ ] 无 ESLint 错误
- [ ] 无 TypeScript 错误
- [ ] 性能考虑（避免不必要的重渲染）
- [ ] 错误处理完善
- [ ] 添加必要的���释

---

## 9. 文档规范

### 9.1 代码注释

#### 9.1.1 函数注释 (JSDoc)
```typescript
/**
 * 执行点击序列
 * @param points - 点击点数组
 * @param config - 全局配置
 * @returns Promise<void>
 * @throws {PermissionError} 当无障碍权限未授予时
 */
async function executeClickSequence(
  points: ClickPoint[],
  config: GlobalConfig
): Promise<void> {
  // 实现
}
```

#### 9.1.2 复杂逻辑注释
```typescript
// 计算抖动后的坐标
// 抖动范围为 [-jitterRange, +jitterRange]
const jitteredX = point.x + (Math.random() * 2 - 1) * point.jitterRange;
```

### 9.2 README 文档

#### 9.2.1 项目 README 结构
```markdown
# 自动点击器

## 简介
[项目描述]

## 功能特性
- [功能列表]

## 安装
[安装步骤]

## 使用
[使用说明]

## 开发
[开发指南]

## 测试
[测试说明]

## 许可证
[许可证信息]
```

### 9.3 API 文档
- 使用 TypeDoc 生成 API 文档
- 所有公共接口必须有文档注释
- 包含使用示例

---

## 10. 性能优化

### 10.1 React Native 优化
- 使用 `React.memo` 避免不必要的重渲染
- 使用 `useMemo` 和 `useCallback` 缓存计算结果
- 使用 `FlatList` 的 `getItemLayout` 优化长列表
- 避免在 render 中创建新对象/函数

### 10.2 原生模块优化
- 点击执行在原生线程进行
- 避免频繁的 JS-Native 通信
- 使用批量操作减少桥接开销

### 10.3 存储优化
- 使用 MMKV 替代 AsyncStorage（更快）
- 仅在必要时持久化数据
- 使用防抖避免频繁写入

---

## 11. 安全考虑

### 11.1 权限管理
- 最小权限原则
- 明确告知用户权限用途
- 提供权限撤销说明

### 11.2 数据安全
- 配置数据仅存储在本地
- 不收集用户隐私信息
- 不联网传输数据

### 11.3 防滥用
- 添加执行频率限制
- 提供紧急停止机制
- 记录执行日志（可选）

---

## 12. 发布流程

### 12.1 版本管理
- 遵循语义化版本 (Semantic Versioning)
- 格式: `MAJOR.MINOR.PATCH`
- 示例: `1.0.0`, `1.1.0`, `1.1.1`

### 12.2 构建流程
```bash
# 清理
npm run clean

# 安装依赖
npm install

# 运行测试
npm test

# 构建 Android APK
cd android && ./gradlew assembleRelease

# 构建 Android AAB (Google Play)
cd android && ./gradlew bundleRelease
```

### 12.3 发布检查清单
- [ ] 所有测试通过
- [ ] 版本号已更新
- [ ] CHANGELOG 已更新
- [ ] 文档已更新
- [ ] 签名配置正确
- [ ] 混淆配置正确
- [ ] 权限声明完整

---

## 13. 维护计划

### 13.1 Bug 修复
- 高优先级: 24 小时内响应
- 中优先级: 3 天内响应
- 低优先级: 1 周内响应

### 13.2 功能迭代
- 收集用户反馈
- 定期发布新版本
- 保持向后兼容

### 13.3 依赖更新
- 每月检查依赖更新
- 及时修复安全漏洞
- 跟进 React Native 版本

---

## 14. 附录

### 14.1 参考资料
- [React Native 官方文档](https://reactnative.dev/)
- [Android Accessibility Service](https://developer.android.com/guide/topics/ui/accessibility/service)
- [Zustand 文档](https://github.com/pmndrs/zustand)

### 14.2 常见问题
**Q: 为什么需要无障碍权限？**
A: 无障碍权限允许应用模拟用户点击操作，这是实现自动点击的核心功能。

**Q: 应用是否会收集用户数据？**
A: 不会。所有配置数据仅存储在本地设备，不会上传到任何服务器。

**Q: 支持哪些 Android 版本？**
A: 最低支持 Android 8.0 (API 26)，推荐 Android 10+ 以获得最佳体验。

### 14.3 联系方式
- GitHub Issues: [项目地址]
- Email: [联系邮箱]

---

**文档版本**: 1.0.0
**最后更新**: 2025-12-31
**作者**: [项目团队]
