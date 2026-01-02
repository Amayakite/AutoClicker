# 跨应用浮动编辑器改进需求文档

## 问题分析

### 1. 点位标记不持久化
**当前行为**：点击屏幕后显示临时动画（绿色圆圈，0.5秒后消失）
**期望行为**：点击后应该持久显示一个瞄准镜标记，中间显示点位序号（1, 2, 3...）
**影响**：用户无法看到已添加的点位在哪里，难以规划点击序列

### 2. 缺少点位配置功能
**当前行为**：只能添加点位，无法配置每个点的参数
**期望行为**：应该能够配置每个点位的：
- 延迟时间 (delay)
- 抖动 (jitter) 开关和范围
- 漂移 (drift) 开关和速度
- 点位名称
- 启用/禁用状态

**影响**：无法实现原始需求中的精细控制功能

### 3. UI 布局冗余
**当前问题**：
- 顶部栏有"完成"按钮
- 底部栏有"保存"按钮
- 两个按钮功能重复

**期望改进**：
- 顶部栏应该显示点位列表或配置入口
- 只保留一个保存/完成按钮

### 4. 缺少测试运行功能
**当前行为**：配置完点位后必须退出编辑器才能测试
**期望行为**：应该有一个"测试运行"按钮，可以在编辑器中快速测试点击序列
**影响**：调试效率低，需要反复进出编辑器

## 改进方案设计

### 整体 UI 布局

```
┌─────────────────────────────────────────────────────────┐
│  编辑点位 | 已添加: 3 个点        [配置列表] [测试]    │ ← 顶部栏
└─────────────────────────────────────────────────────────┘
│                                                         │
│                  透明可点击区域                          │
│                                                         │
│         ┌───┐                                          │
│         │ 1 │  ← 持久化的瞄准镜标记                     │
│         └───┘                                          │
│                                                         │
│                     ┌───┐                              │
│                     │ 2 │                              │
│                     └───┘                              │
│                                                         │
┌─────────────────────────────────────────────────────────┐
│  [↶ 撤销]  [🗑️ 清空]  [✕ 取消]  [✓ 保存]              │ ← 底部栏
└─────────────────────────────────────────────────────────┘

配置面板（从右侧滑入）：
┌─────────────────────┐
│  点位配置            │
│  ─────────────────  │
│  ● 点 1 (100, 200)  │
│    延迟: 1000ms     │
│    抖动: 开 (10px)  │
│    [编辑]           │
│  ─────────────────  │
│  ● 点 2 (300, 400)  │
│    延迟: 500ms      │
│    抖动: 关         │
│    [编辑]           │
│  ─────────────────  │
│  [关闭]             │
└─────────────────────┘
```

### 功能模块设计

#### 1. 持久化点位标记

**视觉设计**：
```
    ┌─────┐
    │  ╋  │  ← 十字瞄准镜
    │  1  │  ← 点位序号
    └─────┘
```

**实现要点**：
- 使用 FrameLayout 在 overlay 上添加标记 View
- 每个标记包含：十字瞄准镜图标 + 序号文字
- 标记大小：48dp x 48dp
- 颜色：半透明绿色背景 (#8800FF00)，白色文字
- 点击标记可以打开该点的配置面板

#### 2. 点位配置面板

**滑入式侧边栏设计**：
- 宽度：280dp
- 从右侧滑入
- 半透明黑色背景 (#DD000000)
- 显示所有点位的列表
- 每个点位显示：序号、坐标、主要配置
- 点击"编辑"按钮打开详细配置对话框

**详细配置对话框**：
- 点位名称输入框
- 延迟时间滑块 (0-5000ms)
- 抖动开关 + 范围滑块 (0-50px)
- 漂移开关 + 速度滑块 (0-10px/s)
- 启用/禁用开关
- 保存/取消按钮

#### 3. 顶部栏重新设计

**新布局**：
```
┌─────────────────────────────────────────────────────────┐
│  编辑点位 | 已添加: 3 个点        [配置列表] [测试]    │
│  ↑                                ↑         ↑          │
│  标题                             打开配置   测试运行    │
└─────────────────────────────────────────────────────────┘
```

**移除**：完成按钮（功能合并到底部的"保存"按钮）

#### 4. 测试运行功能

**实现方式**：
- 顶部栏添加"测试"按钮
- 点击后：
  1. 隐藏编辑器 UI（保留标记）
  2. 执行点击序列（使用 AccessibilityService）
  3. 显示执行进度（当前点位高亮）
  4. 执行完成后恢复编辑器 UI
- 测试期间可以点击"停止"按钮中断

**测试模式 UI**：
```
┌─────────────────────────────────────────────────────────┐
│  测试运行中... 点 2/3                      [停止测试]   │
└─────────────────────────────────────────────────────────┘
```

### 交互流程

#### 添加点位流程
1. 用户点击屏幕
2. 显示临时动画（绿色圆圈）
3. 动画结束后显示持久化标记（瞄准镜 + 序号）
4. 更新顶部计数器

#### 配置点位流程
1. 用户点击"配置列表"按钮
2. 配置面板从右侧滑入
3. 显示所有点位列表
4. 用户点击某个点位的"编辑"按钮
5. 打开详细配置对话框
6. 用户修改配置并保存
7. 返回配置面板

#### 测试运行流程
1. 用户点击"测试"按钮
2. 隐藏编辑器控制栏
3. 显示测试进度栏
4. 依次执行点击（当前点位标记高亮）
5. 执行完成后恢复编辑器 UI
6. 显示测试结果提示

## 技术实现要点

### 1. 持久化标记管理

```kotlin
// 标记数据结构
data class PointMarker(
    val id: String,
    val order: Int,
    val x: Int,
    val y: Int,
    val view: View
)

// 标记管理
private val markers = mutableListOf<PointMarker>()

fun addMarker(x: Int, y: Int) {
    val marker = createMarkerView(markers.size + 1, x, y)
    markers.add(PointMarker(generateId(), markers.size, x, y, marker))
    (overlayView as FrameLayout).addView(marker)
}

fun removeLastMarker() {
    if (markers.isNotEmpty()) {
        val marker = markers.removeLast()
        (overlayView as FrameLayout).removeView(marker.view)
    }
}

fun clearMarkers() {
    markers.forEach { (overlayView as FrameLayout).removeView(it.view) }
    markers.clear()
}
```

### 2. 配置面板实现

```kotlin
// 配置面板 View
private var configPanelView: View? = null

fun showConfigPanel() {
    if (configPanelView != null) return

    configPanelView = createConfigPanel()
    windowManager.addView(configPanelView, createConfigPanelParams())

    // 滑入动画
    configPanelView?.translationX = 280f * density
    configPanelView?.animate()
        ?.translationX(0f)
        ?.setDuration(300)
        ?.start()
}

fun hideConfigPanel() {
    configPanelView?.animate()
        ?.translationX(280f * density)
        ?.setDuration(300)
        ?.withEndAction {
            windowManager.removeView(configPanelView)
            configPanelView = null
        }
        ?.start()
}
```

### 3. 测试运行实现

```kotlin
fun startTestRun() {
    // 隐藏控制栏
    topBarView?.visibility = View.GONE
    bottomBarView?.visibility = View.GONE

    // 显示测试进度栏
    showTestProgressBar()

    // 发送测试运行事件到 RN
    sendEvent("onFloatingEditorTestRun", mapOf("scriptId" to (scriptId ?: "")))
}

fun stopTestRun() {
    // 恢复控制栏
    topBarView?.visibility = View.VISIBLE
    bottomBarView?.visibility = View.VISIBLE

    // 隐藏测试进度栏
    hideTestProgressBar()

    // 发送停止事件
    sendEvent("onFloatingEditorTestStop", mapOf("scriptId" to (scriptId ?: "")))
}
```

### 4. React Native 集成

```typescript
// 新增事件类型
export interface FloatingEditorTestRunEvent {
  scriptId: string;
}

export interface FloatingEditorTestStopEvent {
  scriptId: string;
}

export interface FloatingEditorPointConfigEvent {
  scriptId: string;
  pointId: string;
  config: PointConfig;
}

// 新增事件监听器
export const addFloatingEditorTestRunListener = (callback) => {
  return DeviceEventEmitter.addListener('onFloatingEditorTestRun', callback);
};

export const addFloatingEditorTestStopListener = (callback) => {
  return DeviceEventEmitter.addListener('onFloatingEditorTestStop', callback);
};

export const addFloatingEditorPointConfigListener = (callback) => {
  return DeviceEventEmitter.addListener('onFloatingEditorPointConfig', callback);
};
```

## 实现优先级

### P0 (必须实现)
- ✅ 持久化点位标记（瞄准镜 + 序号）
- ✅ 移除顶部"完成"按钮
- ✅ 添加"配置列表"按钮
- ✅ 实现配置面板（滑入式侧边栏）
- ✅ 点位详细配置对话框

### P1 (重要)
- ✅ 测试运行功能
- ✅ 测试进度显示
- ✅ 点击标记打开配置

### P2 (优化)
- 标记拖动功能（调整点位位置）
- 配置面板搜索/过滤
- 批量配置功能

## 文件修改清单

### Android Native
1. `FloatingEditorManager.kt` - 主要修改
   - 添加持久化标记管理
   - 实现配置面板
   - 实现测试运行功能

2. `floating_editor_top_bar.xml` - 重新设计
   - 移除"完成"按钮
   - 添加"配置列表"和"测试"按钮

3. `floating_editor_config_panel.xml` - 新建
   - 配置面板布局

4. `floating_editor_point_marker.xml` - 新建
   - 点位标记布局

### React Native
1. `FloatingEditorModule.ts` - 添加新事件类型
2. `ConfigScreen.tsx` - 添加新事件监听器
3. `clickStore.ts` - 可能需要添加测试运行相关状态

## 预期效果

完成后，用户将能够：
1. 清晰看到所有已添加的点位（持久化标记）
2. 方便地配置每个点位的参数（延迟、抖动、漂移等）
3. 在编辑器中快速测试点击序列
4. 更高效地调试和优化自动点击脚本
