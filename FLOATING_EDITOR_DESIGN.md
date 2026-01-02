# 跨应用浮动编辑器 UI 设计文档

## 设计目标

创建一个简洁、直观的跨应用点位编辑界面，用户可以在使用其他应用时轻松添加点击点。

## 界面布局

### 1. 整体结构

```
┌─────────────────────────────────────────────────────────┐
│                    手机屏幕全屏                          │
│                                                         │
│  ┌───────────────────────────────────────────────┐     │
│  │  📍 点击屏幕添加点位 | 已添加: 3 个点  [完成]  │     │ ← 顶部控制栏
│  └───────────────────────────────────────────────┘     │
│                                                         │
│                                                         │
│                  透明可点击区域                          │
│                                                         │
│                    ┌─────┐                             │
│                    │  +  │  ← 点击位置指示器            │
│                    └─────┘     (点击后短暂显示)         │
│                                                         │
│                                                         │
│                                                         │
│  ┌───────────────────────────────────────────────┐     │
│  │  [撤销上一个]  [清空所有]  [取消]  [保存]     │     │ ← 底部操作栏
│  └───────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────┘
```

### 2. 顶部控制栏详细设计

```
┌─────────────────────────────────────────────────────────┐
│  📍 点击屏幕添加点位 | 已添加: 3 个点        [✓ 完成]  │
│  ↑                    ↑                      ↑          │
│  图标                 计数器                 完成按钮    │
└─────────────────────────────────────────────────────────┘

样式：
- 背景：半透明黑色 (#CC000000)
- 高度：56dp
- 内边距：12dp
- 文字颜色：白色
- 字体大小：14sp
```

### 3. 点击指示器动画

```
点击前：
    (无显示)

点击时：
    ┌─────┐
    │  +  │  ← 绿色圆形，带脉冲动画
    └─────┘

点击后 (0.5秒)：
    ┌─────┐
    │  ✓  │  ← 变为对勾，淡出
    └─────┘

样式：
- 大小：48dp 圆形
- 背景：半透明绿色 (#8800FF00)
- 图标：白色 "+" 或 "✓"
- 动画：缩放 + 淡出 (500ms)
```

### 4. 底部操作栏详细设计

```
┌─────────────────────────────────────────────────────────┐
│  [↶ 撤销]  [🗑️ 清空]  [✕ 取消]  [✓ 保存并退出]        │
│   ↑         ↑          ↑         ↑                      │
│   撤销      清空       取消       保存                    │
│   上一个    所有点     编辑       并退出                  │
└─────────────────────────────────────────────────────────┘

样式：
- 背景：半透明黑色 (#CC000000)
- 高度：64dp
- 按钮间距：8dp
- 按钮样式：
  - 撤销：灰色边框按钮
  - 清空：红色边框按钮
  - 取消：灰色填充按钮
  - 保存：绿色填充按钮
```

## 交互流程

### 添加点位流程

```
1. 用户点击屏幕任意位置
   ↓
2. 在点击位置显示 "+" 指示器（绿色圆形）
   ↓
3. 播放缩放动画（从 0.8 到 1.2 倍）
   ↓
4. 将坐标发送到 React Native
   ↓
5. 更新顶部计数器 "已添加: N 个点"
   ↓
6. 指示器变为 "✓" 并淡出（500ms）
```

### 撤销操作流程

```
1. 用户点击 "撤销" 按钮
   ↓
2. 发送撤销事件到 React Native
   ↓
3. React Native 删除最后一个点
   ↓
4. 更新顶部计数器
   ↓
5. 显示 Toast 提示 "已撤销"
```

### 完成编辑流程

```
1. 用户点击 "完成" 或 "保存并退出"
   ↓
2. 发送完成事件到 React Native
   ↓
3. 关闭浮动编辑器
   ↓
4. 返回应用主界面
```

## 技术实现要点

### 1. 触摸事件处理

```kotlin
// 透明覆盖层配置
WindowManager.LayoutParams(
    MATCH_PARENT,
    MATCH_PARENT,
    TYPE_APPLICATION_OVERLAY,
    FLAG_NOT_FOCUSABLE or FLAG_LAYOUT_IN_SCREEN,  // 移除 FLAG_NOT_TOUCH_MODAL
    PixelFormat.TRANSLUCENT
)

// 触摸监听器
overlayView.setOnTouchListener { _, event ->
    when (event.action) {
        MotionEvent.ACTION_DOWN -> {
            val x = event.rawX.toInt()
            val y = event.rawY.toInt()
            showClickIndicator(x, y)
            sendPointAddedEvent(x, y)
            true
        }
        else -> false
    }
}
```

### 2. 点击指示器实现

```kotlin
// 创建指示器 View
private fun createIndicatorView(x: Int, y: Int): View {
    return View(context).apply {
        // 圆形背景
        background = GradientDrawable().apply {
            shape = GradientDrawable.OVAL
            setColor(0x8800FF00.toInt())
        }

        // 动画
        scaleX = 0.8f
        scaleY = 0.8f
        alpha = 1f

        animate()
            .scaleX(1.2f)
            .scaleY(1.2f)
            .alpha(0f)
            .setDuration(500)
            .withEndAction { removeIndicator(this) }
            .start()
    }
}
```

### 3. 控制栏布局

```xml
<!-- 顶部控制栏 -->
<LinearLayout
    android:layout_width="match_parent"
    android:layout_height="56dp"
    android:background="#CC000000"
    android:padding="12dp"
    android:orientation="horizontal"
    android:gravity="center_vertical">

    <TextView
        android:text="📍 点击屏幕添加点位"
        android:textColor="#FFFFFF"
        android:textSize="14sp" />

    <TextView
        android:id="@+id/tvCounter"
        android:text="| 已添加: 0 个点"
        android:textColor="#CCCCCC"
        android:textSize="14sp"
        android:layout_marginStart="8dp" />

    <View
        android:layout_width="0dp"
        android:layout_height="1dp"
        android:layout_weight="1" />

    <Button
        android:id="@+id/btnDone"
        android:text="✓ 完成"
        android:textColor="#FFFFFF"
        android:background="@drawable/button_green" />
</LinearLayout>
```

## 颜色规范

```
主色调：
- 背景遮罩：#CC000000 (80% 黑色)
- 成功绿色：#00FF00
- 警告红色：#FF0000
- 中性灰色：#808080

文字颜色：
- 主文字：#FFFFFF (白色)
- 次要文字：#CCCCCC (浅灰)
- 禁用文字：#666666 (深灰)

按钮颜色：
- 主要操作：#4CAF50 (绿色)
- 危险操作：#F44336 (红色)
- 次要操作：#757575 (灰色)
```

## 尺寸规范

```
控制栏：
- 顶部栏高度：56dp
- 底部栏高度：64dp
- 内边距：12dp
- 按钮间距：8dp

指示器：
- 圆形直径：48dp
- 图标大小：24dp
- 动画时长：500ms

文字：
- 标题：16sp
- 正文：14sp
- 辅助：12sp
```

## 用户体验优化

1. **即时反馈**：点击后立即显示指示器，无延迟
2. **视觉确认**：使用动画和颜色变化确认操作
3. **防误触**：控制栏区域不响应点击添加
4. **撤销功能**：允许用户纠正错误
5. **计数显示**：实时显示已添加点位数量
6. **清晰提示**：使用图标和文字双重提示

## 实现优先级

### P0 (必须实现)
- ✅ 透明全屏覆盖层
- ✅ 触摸事件捕获
- ✅ 点击坐标发送到 RN
- ✅ 顶部控制栏
- ✅ 底部操作栏

### P1 (重要)
- 🔲 点击指示器动画
- 🔲 实时计数器更新
- 🔲 撤销功能
- 🔲 清空功能

### P2 (优化)
- 🔲 Toast 提示
- 🔲 按钮禁用状态
- 🔲 长按预览功能
