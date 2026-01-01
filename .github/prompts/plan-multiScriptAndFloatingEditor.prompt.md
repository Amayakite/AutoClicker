# 多脚本支持与悬浮窗点位编辑器实现计划

## 一、需求分析

### 1.1 当前问题
- 当前项目只支持单一的点击点列表，缺少"脚本"概念
- 点位添加需要手动输入坐标，用户体验不佳
- 缺少可视化的点位选择器

### 1.2 需求目标
1. **多脚本支持**：用户可以创建、管理多个脚本，每个脚本包含独立的点击点序列
2. **悬浮窗点位编辑器**：通过可拖动的悬浮窗进行点位的可视化编辑

---

## 二、数据模型设计

### 2.1 新增 Script（脚本）模型

```typescript
interface Script {
  id: string;                    // 唯一标识
  name: string;                  // 脚本名称
  description?: string;          // 脚本描述
  points: ClickPoint[];          // 该脚本的点击点数组
  config: ScriptConfig;          // 脚本级别配置
  createdAt: number;             // 创建时间
  updatedAt: number;             // 更新时间
  enabled: boolean;              // 是否启用
}

interface ScriptConfig {
  startDelay: number;            // 启动延迟
  loopEnabled: boolean;          // 是否循环
  loopCount: number;             // 循环次数
}
```

### 2.2 更新 Store 结构

```typescript
interface ClickStore {
  // 脚本管理
  scripts: Script[];
  activeScriptId: string | null;
  
  // 脚本操作
  addScript: (name: string) => string;
  updateScript: (id: string, updates: Partial<Script>) => void;
  deleteScript: (id: string) => void;
  setActiveScript: (id: string) => void;
  duplicateScript: (id: string) => void;
  
  // 点击点操作（基于当前活跃脚本）
  addPointToScript: (scriptId: string, x: number, y: number) => void;
  updatePointInScript: (scriptId: string, pointId: string, updates: Partial<ClickPoint>) => void;
  deletePointFromScript: (scriptId: string, pointId: string) => void;
  reorderPointsInScript: (scriptId: string, newOrder: ClickPoint[]) => void;
  
  // 全局配置
  globalConfig: GlobalConfig;
  execution: ExecutionState;
}
```

---

## 三、悬浮窗点位编辑器设计

### 3.1 组件架构

```
FloatingEditor (悬浮窗编辑器根组件)
├── EditorPanel (左侧操作面板)
│   ├── Header (标题栏：脚本名称 + 关闭按钮)
│   ├── ToolBar (工具栏：添加点位、删除、保存等)
│   └── PointList (点位列表：可滚动的点位卡片)
│       └── PointCard (单个点位卡片：序号、坐标、操作按钮)
│
└── DraggableMarkers (可拖动的点位标记层)
    └── TargetMarker (单个瞄准镜标记)
        ├── CrosshairIcon (瞄准镜图标)
        └── NumberBadge (序号徽章)
```

### 3.2 UI 设计详情

#### 3.2.1 EditorPanel（编辑面板）
- **位置**：屏幕左侧，宽度约 280dp
- **背景**：半透明深色背景 (rgba(0,0,0,0.85))
- **可拖动**：支持拖动到屏幕任意位置
- **内容**：
  - 顶部：脚本名称 + 最小化/关闭按钮
  - 工具栏：[+ 添加点位] [🗑 删除选中] [💾 保存]
  - 点位列表：显示所有点位，点击可选中/编辑

#### 3.2.2 TargetMarker（瞄准镜标记）
- **外观**：
  - 外圈：圆形边框 (60dp 直径)
  - 十字准心：水平+垂直线条
  - 中心：序号数字 (16sp 字体)
  - 颜色：默认蓝色，选中时橙色
- **交互**：
  - 可拖动到屏幕任意位置
  - 拖动时显示坐标提示
  - 点击选中，高亮显示
  - 长按显示快捷菜单（编辑/删除）

### 3.3 交互流程

```
1. 用户点击"编辑脚本"按钮
   ↓
2. 显示悬浮窗编辑器 (EditorPanel + 现有点位的 Markers)
   ↓
3. 用户点击"添加点位"按钮
   ↓
4. 在屏幕中央创建新的 TargetMarker（显示下一个序号）
   ↓
5. 用户拖动 TargetMarker 到目标位置
   ↓
6. 松开后自动保存坐标到该点位
   ↓
7. 点位列表自动更新显示新点位
   ↓
8. 用户可继续添加或点击"完成"关闭编辑器
```

---

## 四、实现步骤

### 阶段 1：数据模型重构 (约 2-3 小时)

1. **更新类型定义** (`src/types/index.ts`)
   - 添加 `Script` 和 `ScriptConfig` 接口
   - 保留原有 `ClickPoint` 接口

2. **重构 Store** (`src/store/clickStore.ts`)
   - 添加脚本管理相关状态和方法
   - 迁移现有点击点到脚本结构
   - 更新持久化逻辑

3. **更新执行引擎** (`src/services/executionEngine.ts`)
   - 支持执行指定脚本
   - 保持向后兼容

### 阶段 2：脚本管理 UI (约 2-3 小时)

1. **创建脚本列表组件** (`src/components/ScriptList.tsx`)
   - 显示所有脚本卡片
   - 支持添加、删除、重命名脚本
   - 点击进入脚本编辑

2. **更新主界面** (`src/screens/ConfigScreen.tsx`)
   - 首页显示脚本列表
   - 添加"新建脚本"按钮
   - 调整布局适应新结构

### 阶段 3：悬浮窗编辑器核心 (约 4-5 小时)

1. **创建悬浮窗基础组件** (`src/components/FloatingEditor/`)
   - `FloatingEditor.tsx` - 主容器
   - `EditorPanel.tsx` - 操作面板
   - `PointListPanel.tsx` - 点位列表

2. **实现可拖动面板**
   - 使用 `react-native-gesture-handler` 的 PanGestureHandler
   - 实现拖动、边界约束
   - 支持最小化/展开

### 阶段 4：瞄准镜标记组件 (约 3-4 小时)

1. **创建 TargetMarker 组件** (`src/components/FloatingEditor/TargetMarker.tsx`)
   - 绘制瞄准镜 UI
   - 实现拖动手势
   - 显示序号和坐标

2. **创建 MarkerLayer 组件** (`src/components/FloatingEditor/MarkerLayer.tsx`)
   - 管理多个 TargetMarker
   - 处理层级和触摸事件
   - 同步点位数据

### 阶段 5：集成与测试 (约 2-3 小时)

1. **集成所有组件**
   - 连接 Store 与编辑器组件
   - 实现数据双向绑定
   - 处理边界情况

2. **测试与优化**
   - 多点位拖动性能
   - 手势冲突处理
   - 数据持久化验证

---

## 五、文件清单

### 新建文件
```
src/
├── components/
│   ├── ScriptList.tsx              # 脚本列表组件
│   └── FloatingEditor/
│       ├── index.tsx               # 导出入口
│       ├── FloatingEditor.tsx      # 编辑器主容器
│       ├── EditorPanel.tsx         # 操作面板
│       ├── PointListPanel.tsx      # 点位列表面板
│       ├── TargetMarker.tsx        # 瞄准镜标记
│       ├── MarkerLayer.tsx         # 标记层容器
│       └── styles.ts               # 编辑器样式
```

### 修改文件
```
src/types/index.ts                  # 添加 Script 类型
src/store/clickStore.ts             # 重构为多脚本支持
src/screens/ConfigScreen.tsx        # 更新主界面
src/services/executionEngine.ts     # 支持脚本执行
src/constants/config.ts             # 添加编辑器相关常量
docs/02-core-implementation.md      # 更新文档
```

---

## 六、技术要点

### 6.1 悬浮窗层级管理
- 使用 `react-native` 的 `Modal` 或自定义 Portal
- 确保编辑器在最顶层显示
- 处理 Android 返回键

### 6.2 手势处理
- 使用 `react-native-gesture-handler` 的 `PanGestureHandler`
- 支持同时拖动多个元素
- 处理手势冲突（面板拖动 vs 标记拖动）

### 6.3 性能优化
- 使用 `React.memo` 优化标记组件
- 拖动时使用 `useAnimatedStyle` (reanimated)
- 批量更新减少重渲染

### 6.4 坐标系统
- 标记位置：屏幕绝对坐标
- 存储坐标：同样使用屏幕绝对坐标
- 注意状态栏高度偏移

---

## 七、预估工时

| 阶段 | 任务 | 预估时间 |
|------|------|----------|
| 1 | 数据模型重构 | 2-3 小时 |
| 2 | 脚本管理 UI | 2-3 小时 |
| 3 | 悬浮窗编辑器核心 | 4-5 小时 |
| 4 | 瞄准镜标记组件 | 3-4 小时 |
| 5 | 集成与测试 | 2-3 小时 |
| **总计** | | **13-18 小时** |

---

## 八、后续优化（可选）

1. **点位预览**：执行前预览点击顺序动画
2. **模板系统**：保存脚本为模板供复用
3. **点位组**：支持将多个点位分组管理
4. **录制模式**：录制用户手动点击生成脚本
5. **云同步**：脚本配置云端备份与同步

---

## 九、风险与注意事项

1. **权限问题**：悬浮窗需要 `SYSTEM_ALERT_WINDOW` 权限（当前已有）
2. **手势冲突**：多个可拖动元素可能产生手势冲突
3. **内存管理**：大量标记可能影响性能，需要优化
4. **数据迁移**：需要处理从旧数据结构到新结构的迁移

---

## 确认清单

- [ ] 确认数据模型设计
- [ ] 确认 UI 交互流程
- [ ] 确认技术方案
- [ ] 开始实现
