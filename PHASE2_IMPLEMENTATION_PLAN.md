# 阶段2实施计划：跨应用悬浮窗功能

## 概述

本阶段将实现所有需要跨应用显示的悬浮窗功能，包括：
- 3.4 Debug模式（点击轨迹可视化）
- 3.5 运行控制悬浮窗
- 3.6 点位编辑悬浮窗

## 技术架构

### 核心组件

1. **OverlayPermissionModule** - 权限管理
   - 检查SYSTEM_ALERT_WINDOW权限
   - 请求权限（跳转到系统设置）
   - 权限状态监听

2. **DebugOverlayModule** - Debug可视化
   - 显示点击位置的圆点
   - 自动消失机制
   - 支持多个圆点同时显示

3. **ExecutionControlModule** - 运行控制
   - 显示start/stop按钮
   - 显示执行状态和进度
   - 可拖动、可最小化

4. **FloatingEditorModule** - 点位编辑器
   - 完全原生实现的悬浮窗
   - 支持添加、编辑、删除点位
   - 可拖动的标记
   - 跨应用显示

### Android原生实现

#### 1. 权限管理 (OverlayPermissionModule.kt)

```kotlin
class OverlayPermissionModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName() = "OverlayPermissionModule"

    @ReactMethod
    fun checkPermission(promise: Promise) {
        val hasPermission = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            Settings.canDrawOverlays(reactApplicationContext)
        } else {
            true
        }
        promise.resolve(hasPermission)
    }

    @ReactMethod
    fun requestPermission(promise: Promise) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            val intent = Intent(
                Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                Uri.parse("package:${reactApplicationContext.packageName}")
            )
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            reactApplicationContext.startActivity(intent)
            promise.resolve(null)
        } else {
            promise.resolve(null)
        }
    }
}
```

#### 2. Debug悬浮圆点 (DebugOverlayService.kt)

```kotlin
class DebugOverlayService : Service() {
    private val windowManager by lazy {
        getSystemService(WINDOW_SERVICE) as WindowManager
    }

    private val activeViews = mutableListOf<View>()

    fun showClickPoint(x: Int, y: Int, duration: Long = 1000) {
        val view = createCircleView()
        val params = createWindowParams(x, y)

        windowManager.addView(view, params)
        activeViews.add(view)

        // 自动移除
        Handler(Looper.getMainLooper()).postDelayed({
            removeView(view)
        }, duration)
    }

    private fun createCircleView(): View {
        return View(this).apply {
            setBackgroundResource(R.drawable.debug_circle)
            // 圆形，半透明红色
        }
    }

    private fun createWindowParams(x: Int, y: Int): WindowManager.LayoutParams {
        return WindowManager.LayoutParams().apply {
            type = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
            } else {
                WindowManager.LayoutParams.TYPE_PHONE
            }
            format = PixelFormat.TRANSLUCENT
            flags = WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE or
                    WindowManager.LayoutParams.FLAG_NOT_TOUCHABLE or
                    WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS
            width = 40.dp
            height = 40.dp
            this.x = x - 20.dp
            this.y = y - 20.dp
            gravity = Gravity.TOP or Gravity.START
        }
    }
}
```

#### 3. 运行控制悬浮窗 (ExecutionControlService.kt)

```kotlin
class ExecutionControlService : Service() {
    private lateinit var windowManager: WindowManager
    private var floatingView: View? = null

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        when (intent?.action) {
            ACTION_SHOW -> showFloatingWindow()
            ACTION_HIDE -> hideFloatingWindow()
            ACTION_UPDATE_STATUS -> updateStatus(intent)
        }
        return START_STICKY
    }

    private fun showFloatingWindow() {
        if (floatingView != null) return

        floatingView = LayoutInflater.from(this)
            .inflate(R.layout.execution_control_overlay, null)

        val params = WindowManager.LayoutParams(
            WindowManager.LayoutParams.WRAP_CONTENT,
            WindowManager.LayoutParams.WRAP_CONTENT,
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
            } else {
                WindowManager.LayoutParams.TYPE_PHONE
            },
            WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE,
            PixelFormat.TRANSLUCENT
        )

        params.gravity = Gravity.TOP or Gravity.END
        params.x = 20
        params.y = 100

        setupDraggable(floatingView!!, params)
        setupButtons(floatingView!!)

        windowManager.addView(floatingView, params)
    }

    private fun setupButtons(view: View) {
        view.findViewById<ImageButton>(R.id.btnStart).setOnClickListener {
            sendEventToJS("onStartClick")
        }

        view.findViewById<ImageButton>(R.id.btnStop).setOnClickListener {
            sendEventToJS("onStopClick")
        }
    }
}
```

#### 4. 点位编辑悬浮窗 (FloatingEditorService.kt)

这是最复杂的部分，需要：
- 全屏半透明遮罩
- 可拖动的标记
- 操作面板
- 与RN状态同步

```kotlin
class FloatingEditorService : Service() {
    private lateinit var windowManager: WindowManager
    private var overlayView: View? = null
    private var panelView: View? = null
    private val markers = mutableMapOf<String, View>()

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        when (intent?.action) {
            ACTION_SHOW -> {
                val scriptId = intent.getStringExtra("scriptId")
                showEditor(scriptId)
            }
            ACTION_HIDE -> hideEditor()
            ACTION_ADD_MARKER -> addMarker(intent)
            ACTION_UPDATE_MARKER -> updateMarker(intent)
            ACTION_REMOVE_MARKER -> removeMarker(intent)
        }
        return START_STICKY
    }

    private fun showEditor(scriptId: String?) {
        // 创建全屏半透明遮罩
        overlayView = createOverlayView()
        windowManager.addView(overlayView, createFullScreenParams())

        // 创建操作面板
        panelView = createPanelView()
        windowManager.addView(panelView, createPanelParams())

        // 加载脚本的点位并创建标记
        loadScriptPoints(scriptId)
    }

    private fun createMarkerView(point: ClickPoint): View {
        return LayoutInflater.from(this)
            .inflate(R.layout.target_marker, null).apply {
                // 设置标记样式（十字准星）
                setupDraggable(this, point)
            }
    }
}
```

### React Native集成

#### 1. 权限检查流程

```typescript
// src/hooks/useOverlayPermission.ts
export const useOverlayPermission = () => {
  const [hasPermission, setHasPermission] = useState(false);

  useEffect(() => {
    checkPermission();
  }, []);

  const checkPermission = async () => {
    const granted = await OverlayPermissionModule.checkPermission();
    setHasPermission(granted);
  };

  const requestPermission = async () => {
    await OverlayPermissionModule.requestPermission();
    // 用户需要手动授权后返回
    Alert.alert('提示', '请在设置中允许显示悬浮窗，然后返回应用');
  };

  return { hasPermission, requestPermission, checkPermission };
};
```

#### 2. Debug模式集成

```typescript
// src/services/executionEngine.ts
async execute(points, config, onProgress) {
  // ...
  for (const point of points) {
    await AccessibilityModule.simulateClick(x, y);

    // Debug模式：显示点击位置
    if (config.debugMode) {
      await DebugOverlayModule.showClickPoint(x, y);
    }

    // ...
  }
}
```

#### 3. 运行控制悬浮窗

```typescript
// src/screens/ConfigScreen.tsx
const handleRunScript = async (scriptId: string) => {
  // 显示运行控制悬浮窗
  await ExecutionControlModule.show(scriptId);

  // 监听start按钮点击
  const subscription = ExecutionControlModule.addListener(
    'onStartClick',
    () => {
      startExecution(scriptId);
    }
  );

  return () => subscription.remove();
};
```

## 实施步骤

### 第1步：权限管理（1小时）
1. 创建OverlayPermissionModule.kt
2. 创建TS接口
3. 在AndroidManifest.xml添加权限
4. 创建useOverlayPermission hook
5. 在ConfigScreen添加权限检查

### 第2步：Debug悬浮圆点（2-3小时）
1. 创建DebugOverlayService.kt
2. 创建圆点drawable资源
3. 实现显示/隐藏逻辑
4. 创建DebugOverlayModule桥接
5. 在executionEngine集成
6. 在设置中添加debug开关

### 第3步：运行控制悬浮窗（4-5小时）
1. 创建ExecutionControlService.kt
2. 设计并实现UI布局
3. 实现拖动功能
4. 实现start/stop按钮
5. 实现状态显示
6. 创建ExecutionControlModule桥接
7. 重构ConfigScreen的运行逻辑

### 第4步：点位编辑悬浮窗（2-3天）
1. 创建FloatingEditorService.kt
2. 实现全屏遮罩
3. 实现可拖动标记
4. 实现操作面板
5. 实现RN与原生状态同步
6. 重构FloatingEditor组件
7. 测试跨应用功能

### 第5步：文档和测试（1天）
1. 更新CLAUDE.md
2. 创建用户使用文档
3. 完整测试所有功能
4. 修复bug

## 预计时间

- 第1步：1小时
- 第2步：3小时
- 第3步：5小时
- 第4步：3天
- 第5步：1天

**总计：约4-5天**

## 风险和挑战

1. **权限管理复杂性**
   - Android 6.0+需要用户手动授权
   - 需要引导用户到设置页面

2. **悬浮窗生命周期**
   - Service需要正确管理
   - 内存泄漏风险

3. **RN与原生状态同步**
   - 点位编辑器的状态需要双向同步
   - 性能考虑

4. **不同Android版本兼容性**
   - TYPE_APPLICATION_OVERLAY vs TYPE_PHONE
   - 不同厂商的限制

## 下一步行动

1. 用户确认实施计划
2. 开始第1步：权限管理
3. 逐步实施各个功能
4. 持续测试和优化
