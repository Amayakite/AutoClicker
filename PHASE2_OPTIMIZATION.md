# 阶段2实施计划 - 优化建议

## 关键优化点

### 1. 架构优化：统一的OverlayService

**当前问题**：
- 为每个功能创建独立Service（DebugOverlayService, ExecutionControlService, FloatingEditorService）
- 资源浪费，管理复杂

**优化方案**：
创建统一的`UnifiedOverlayService`管理所有悬浮窗：

```kotlin
class UnifiedOverlayService : Service() {
    companion object {
        const val ACTION_SHOW_DEBUG_POINT = "show_debug_point"
        const val ACTION_SHOW_EXECUTION_CONTROL = "show_execution_control"
        const val ACTION_SHOW_EDITOR = "show_editor"
        const val ACTION_HIDE_ALL = "hide_all"
    }

    private val debugOverlayManager = DebugOverlayManager(this)
    private val executionControlManager = ExecutionControlManager(this)
    private val editorManager = FloatingEditorManager(this)

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        when (intent?.action) {
            ACTION_SHOW_DEBUG_POINT -> debugOverlayManager.showPoint(intent)
            ACTION_SHOW_EXECUTION_CONTROL -> executionControlManager.show(intent)
            ACTION_SHOW_EDITOR -> editorManager.show(intent)
            ACTION_HIDE_ALL -> hideAll()
        }
        return START_STICKY
    }

    override fun onCreate() {
        super.onCreate()
        startForeground(NOTIFICATION_ID, createNotification())
    }
}
```

**优势**：
- 单一Service，资源占用更少
- 统一的生命周期管理
- 更容易实现前台服务通知
- 简化权限管理

---

### 2. Debug圆点性能优化

**当前问题**：
- 每次点击创建新View，频繁创建/销毁影响性能
- 快速点击时可能产生大量View

**优化方案A：View池复用**

```kotlin
class DebugOverlayManager(private val context: Context) {
    private val windowManager = context.getSystemService(WINDOW_SERVICE) as WindowManager
    private val viewPool = mutableListOf<View>()
    private val activeViews = mutableSetOf<View>()
    private val MAX_POOL_SIZE = 10

    fun showClickPoint(x: Int, y: Int, duration: Long = 1000) {
        val view = getOrCreateView()
        val params = createWindowParams(x, y)

        windowManager.updateViewLayout(view, params)
        view.visibility = View.VISIBLE
        activeViews.add(view)

        Handler(Looper.getMainLooper()).postDelayed({
            recycleView(view)
        }, duration)
    }

    private fun getOrCreateView(): View {
        return viewPool.firstOrNull()?.also { viewPool.remove(it) }
            ?: createCircleView()
    }

    private fun recycleView(view: View) {
        view.visibility = View.GONE
        activeViews.remove(view)
        if (viewPool.size < MAX_POOL_SIZE) {
            viewPool.add(view)
        } else {
            windowManager.removeView(view)
        }
    }
}
```

**优化方案B：Canvas绘制（推荐）**

```kotlin
class DebugOverlayManager(private val context: Context) {
    private var canvasView: DebugCanvasView? = null

    fun showClickPoint(x: Int, y: Int, duration: Long = 1000) {
        if (canvasView == null) {
            canvasView = DebugCanvasView(context)
            windowManager.addView(canvasView, createFullScreenParams())
        }
        canvasView?.addPoint(x, y, duration)
    }
}

class DebugCanvasView(context: Context) : View(context) {
    private val points = mutableListOf<DebugPoint>()
    private val paint = Paint().apply {
        color = Color.RED
        alpha = 128
        style = Paint.Style.FILL
    }

    fun addPoint(x: Float, y: Float, duration: Long) {
        points.add(DebugPoint(x, y, System.currentTimeMillis() + duration))
        invalidate()

        Handler(Looper.getMainLooper()).postDelayed({
            points.removeIf { it.expireTime < System.currentTimeMillis() }
            invalidate()
        }, duration)
    }

    override fun onDraw(canvas: Canvas) {
        super.onDraw(canvas)
        points.forEach { point ->
            canvas.drawCircle(point.x, point.y, 20f, paint)
        }
    }
}
```

**推荐Canvas方案**，因为：
- 性能最优，单个View绘制所有圆点
- 内存占用小
- 支持动画效果（淡出等）

---

### 3. 状态同步机制优化

**当前问题**：
- 计划中没有明确的状态同步机制
- RN和原生之间的数据流不清晰

**优化方案：使用SharedPreferences + EventEmitter**

```kotlin
// 原生端：状态管理
class OverlayStateManager(private val context: Context) {
    private val prefs = context.getSharedPreferences("overlay_state", Context.MODE_PRIVATE)

    fun saveScriptPoints(scriptId: String, points: List<ClickPoint>) {
        val json = Gson().toJson(points)
        prefs.edit().putString("script_$scriptId", json).apply()
    }

    fun loadScriptPoints(scriptId: String): List<ClickPoint> {
        val json = prefs.getString("script_$scriptId", "[]")
        return Gson().fromJson(json, Array<ClickPoint>::class.java).toList()
    }
}

// 原生端：事件发送
class OverlayEventEmitter(private val reactContext: ReactApplicationContext) {
    fun sendPointAdded(scriptId: String, point: ClickPoint) {
        val params = Arguments.createMap().apply {
            putString("scriptId", scriptId)
            putMap("point", pointToMap(point))
        }
        reactContext
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            .emit("onPointAdded", params)
    }
}
```

```typescript
// RN端：监听原生事件
useEffect(() => {
  const subscription = FloatingEditorModule.addListener(
    'onPointAdded',
    (event) => {
      addPointToScript(event.scriptId, event.point.x, event.point.y);
    }
  );

  return () => subscription.remove();
}, []);
```

**数据流设计**：
1. RN → 原生：通过Module方法调用 + SharedPreferences持久化
2. 原生 → RN：通过EventEmitter发送事件
3. 状态真实源：Zustand store（RN端）
4. 原生端仅作为UI展示层，不维护业务状态

---

### 4. 点位编辑器简化方案

**当前问题**：
- 完全原生实现复杂度极高
- 失去RN的开发效率优势

**优化方案：混合架构**

不要完全重写FloatingEditor，而是：

1. **保留当前Modal实现作为应用内编辑器**
2. **添加"跨应用模式"切换**：
   - 应用内模式：使用当前Modal（快速、流畅）
   - 跨应用模式：使用原生悬浮窗（功能受限但可跨应用）

```typescript
// FloatingEditor.tsx
const FloatingEditor = ({ scriptId, visible, onClose, crossAppMode = false }) => {
  if (crossAppMode) {
    // 使用原生悬浮窗
    useEffect(() => {
      if (visible) {
        FloatingEditorModule.show(scriptId);
      }
      return () => FloatingEditorModule.hide();
    }, [visible, scriptId]);

    return null; // 原生悬浮窗不需要RN组件
  }

  // 应用内模式：使用当前Modal实现
  return (
    <Modal visible={visible} ...>
      {/* 当前实现 */}
    </Modal>
  );
};
```

**原生悬浮窗简化版**：
- 只显示标记和基本操作按钮
- 点击标记后返回应用进行详细编辑
- 或者使用简化的原生编辑对话框

**优势**：
- 降低开发复杂度
- 保留应用内的流畅体验
- 跨应用功能作为可选增强

---

### 5. 前台服务通知

**当前问题**：
- Service可能被系统杀死
- 没有用户可见的运行指示

**优化方案**：

```kotlin
class UnifiedOverlayService : Service() {
    override fun onCreate() {
        super.onCreate()
        createNotificationChannel()
        startForeground(NOTIFICATION_ID, createNotification())
    }

    private fun createNotification(): Notification {
        val intent = packageManager.getLaunchIntentForPackage(packageName)
        val pendingIntent = PendingIntent.getActivity(
            this, 0, intent,
            PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
        )

        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("自动点击器")
            .setContentText("悬浮窗服务运行中")
            .setSmallIcon(R.drawable.ic_notification)
            .setOngoing(true)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .setContentIntent(pendingIntent)
            .build()
    }
}
```

---

### 6. 错误处理和恢复机制

**当前问题**：
- 没有错误处理逻辑
- Service崩溃后无法恢复

**优化方案**：

```kotlin
class UnifiedOverlayService : Service() {
    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        try {
            handleIntent(intent)
        } catch (e: Exception) {
            Log.e(TAG, "Error handling intent", e)
            sendErrorToJS(e.message)
            // 尝试恢复
            recoverFromError()
        }
        return START_STICKY // 系统会尝试重启Service
    }

    private fun recoverFromError() {
        // 清理所有悬浮窗
        hideAll()
        // 通知RN端
        sendEventToJS("onServiceError")
    }
}
```

```typescript
// RN端错误处理
useEffect(() => {
  const subscription = OverlayModule.addListener('onServiceError', () => {
    Alert.alert('错误', '悬浮窗服务异常，请重试');
    // 重置状态
    resetOverlayState();
  });

  return () => subscription.remove();
}, []);
```

---

## 优化后的实施步骤

### 第1步：基础架构（2小时）
1. 创建UnifiedOverlayService
2. 实现前台服务通知
3. 创建OverlayPermissionModule
4. 创建OverlayStateManager
5. 创建OverlayEventEmitter
6. 添加权限到AndroidManifest

### 第2步：Debug圆点（2小时）
1. 创建DebugOverlayManager（使用Canvas方案）
2. 创建DebugCanvasView
3. 创建DebugOverlayModule桥接
4. 在executionEngine集成
5. 在设置中添加debug开关

### 第3步：运行控制悬浮窗（3小时）
1. 创建ExecutionControlManager
2. 设计简洁的UI布局
3. 实现拖动功能
4. 实现按钮和状态显示
5. 创建ExecutionControlModule桥接
6. 重构ConfigScreen运行逻辑

### 第4步：点位编辑器混合方案（1天）
1. 保留当前Modal实现
2. 添加crossAppMode prop
3. 创建简化版FloatingEditorManager
4. 实现基本的标记显示
5. 实现点击返回应用编辑
6. 测试跨应用功能

### 第5步：测试和文档（半天）
1. 完整测试所有功能
2. 更新CLAUDE.md
3. 创建用户文档
4. 修复bug

## 优化后的时间估算

- 第1步：2小时
- 第2步：2小时
- 第3步：3小时
- 第4步：1天
- 第5步：半天

**总计：约2天**（相比原计划的4-5天大幅缩短）

---

## 关键改进总结

1. ✅ **统一Service架构** - 减少资源占用，简化管理
2. ✅ **Canvas绘制Debug圆点** - 性能优化，支持更多效果
3. ✅ **明确的状态同步机制** - SharedPreferences + EventEmitter
4. ✅ **混合编辑器方案** - 降低复杂度，保留流畅体验
5. ✅ **前台服务通知** - 提高稳定性
6. ✅ **完善的错误处理** - 提高健壮性

## 技术风险降低

| 风险项 | 原方案 | 优化方案 | 风险降低 |
|--------|--------|----------|----------|
| 开发复杂度 | 高（完全原生） | 中（混合方案） | ⬇️ 60% |
| 性能问题 | 中（频繁创建View） | 低（Canvas绘制） | ⬇️ 80% |
| 状态同步 | 不明确 | 清晰的数据流 | ⬇️ 70% |
| 维护成本 | 高（多个Service） | 低（统一Service） | ⬇️ 50% |

## 建议

我强烈推荐采用优化后的方案，因为：

1. **开发时间缩短50%**（2天 vs 4-5天）
2. **技术风险大幅降低**
3. **保留了核心功能**（跨应用显示）
4. **用户体验更好**（应用内编辑更流畅）
5. **代码更易维护**

特别是**点位编辑器的混合方案**，既满足了跨应用需求，又避免了完全重写的巨大工作量。
