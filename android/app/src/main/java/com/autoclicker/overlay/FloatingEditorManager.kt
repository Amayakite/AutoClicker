package com.autoclicker.overlay

import android.content.Context
import android.graphics.PixelFormat
import android.graphics.drawable.GradientDrawable
import android.os.Build
import android.util.Log
import android.view.Gravity
import android.view.LayoutInflater
import android.view.MotionEvent
import android.view.View
import android.view.WindowManager
import android.widget.Button
import android.widget.FrameLayout
import android.widget.LinearLayout
import android.widget.TextView
import com.autoclicker.R
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReactContext
import com.facebook.react.modules.core.DeviceEventManagerModule

data class PointMarker(
    val order: Int,
    val x: Int,
    val y: Int,
    val view: View
)

class FloatingEditorManager(private val context: Context) {
    private val windowManager = context.getSystemService(Context.WINDOW_SERVICE) as WindowManager
    private var topBarView: View? = null
    private var bottomBarView: View? = null
    private var overlayView: View? = null
    private var configPanelView: View? = null
    private var scriptId: String? = null
    private val markers = mutableListOf<PointMarker>()

    fun show(scriptId: String?) {
        if (overlayView != null) return

        this.scriptId = scriptId
        markers.clear()

        try {
            overlayView = createOverlayView()
            windowManager.addView(overlayView, createFullScreenParams())

            topBarView = createTopBar()
            windowManager.addView(topBarView, createTopBarParams())

            bottomBarView = createBottomBar()
            windowManager.addView(bottomBarView, createBottomBarParams())

            updateCounter()
        } catch (e: Exception) {
            Log.e("FloatingEditorManager", "Error showing editor", e)
        }
    }

    fun hide() {
        try {
            hideConfigPanel()
            overlayView?.let {
                windowManager.removeView(it)
                overlayView = null
            }
            topBarView?.let {
                windowManager.removeView(it)
                topBarView = null
            }
            bottomBarView?.let {
                windowManager.removeView(it)
                bottomBarView = null
            }
            markers.clear()
        } catch (e: Exception) {
            Log.e("FloatingEditorManager", "Error hiding editor", e)
        }
    }

    fun cleanup() {
        hide()
    }

    private fun sendEvent(eventName: String, params: Map<String, Any>?) {
        if (context is ReactContext) {
            val args = Arguments.createMap()
            params?.forEach { (key, value) ->
                when (value) {
                    is Int -> args.putInt(key, value)
                    is String -> args.putString(key, value)
                    is Double -> args.putDouble(key, value)
                    is Boolean -> args.putBoolean(key, value)
                }
            }
            context.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                .emit(eventName, args)
        }
    }

    private fun createOverlayView(): View {
        return FrameLayout(context).apply {
            setBackgroundColor(0x00000000)
            setOnTouchListener { _, event ->
                when (event.action) {
                    MotionEvent.ACTION_DOWN -> {
                        val x = event.rawX.toInt()
                        val y = event.rawY.toInt()

                        val topBarHeight = 56 * resources.displayMetrics.density
                        val bottomBarHeight = 64 * resources.displayMetrics.density
                        val screenHeight = resources.displayMetrics.heightPixels

                        if (y > topBarHeight && y < screenHeight - bottomBarHeight) {
                            showClickIndicator(x, y)
                            addPersistentMarker(x, y)
                            sendEvent("onFloatingEditorPointAdded", mapOf("x" to x, "y" to y, "scriptId" to (scriptId ?: "")))
                            updateCounter()
                        }
                        true
                    }
                    else -> false
                }
            }
        }
    }

    private fun showClickIndicator(x: Int, y: Int) {
        val indicator = View(context).apply {
            val size = (48 * resources.displayMetrics.density).toInt()
            layoutParams = FrameLayout.LayoutParams(size, size)

            background = GradientDrawable().apply {
                shape = GradientDrawable.OVAL
                setColor(0x8800FF00.toInt())
            }

            scaleX = 0.8f
            scaleY = 0.8f
            alpha = 1f

            animate()
                .scaleX(1.2f)
                .scaleY(1.2f)
                .alpha(0f)
                .setDuration(500)
                .withEndAction {
                    try {
                        (overlayView as? FrameLayout)?.removeView(this)
                    } catch (e: Exception) {
                        Log.e("FloatingEditorManager", "Error removing indicator", e)
                    }
                }
                .start()
        }

        (overlayView as? FrameLayout)?.addView(indicator)
        indicator.x = x - (indicator.layoutParams.width / 2f)
        indicator.y = y - (indicator.layoutParams.height / 2f)
    }

    private fun addPersistentMarker(x: Int, y: Int) {
        val markerView = LayoutInflater.from(context).inflate(R.layout.floating_editor_point_marker, null).apply {
            val size = (48 * resources.displayMetrics.density).toInt()
            layoutParams = FrameLayout.LayoutParams(size, size)
            findViewById<TextView>(R.id.tvMarkerNumber)?.text = (markers.size + 1).toString()
        }

        val marker = PointMarker(markers.size, x, y, markerView)
        markers.add(marker)

        (overlayView as? FrameLayout)?.addView(markerView)
        markerView.x = x - (markerView.layoutParams.width / 2f)
        markerView.y = y - (markerView.layoutParams.height / 2f)
    }

    private fun removeLastMarker() {
        if (markers.isNotEmpty()) {
            val marker = markers.removeLast()
            (overlayView as? FrameLayout)?.removeView(marker.view)
        }
    }

    private fun clearMarkers() {
        markers.forEach { (overlayView as? FrameLayout)?.removeView(it.view) }
        markers.clear()
    }

    private fun createTopBar(): View {
        return LayoutInflater.from(context).inflate(R.layout.floating_editor_top_bar, null).apply {
            findViewById<Button>(R.id.btnConfig)?.setOnClickListener {
                showConfigPanel()
            }
            findViewById<Button>(R.id.btnTest)?.setOnClickListener {
                startTestRun()
            }
        }
    }

    private fun createBottomBar(): View {
        return LayoutInflater.from(context).inflate(R.layout.floating_editor_bottom_bar, null).apply {
            findViewById<Button>(R.id.btnUndo)?.setOnClickListener {
                if (markers.isNotEmpty()) {
                    removeLastMarker()
                    sendEvent("onFloatingEditorUndo", mapOf("scriptId" to (scriptId ?: "")))
                    updateCounter()
                }
            }
            findViewById<Button>(R.id.btnClear)?.setOnClickListener {
                clearMarkers()
                sendEvent("onFloatingEditorClear", mapOf("scriptId" to (scriptId ?: "")))
                updateCounter()
            }
            findViewById<Button>(R.id.btnCancel)?.setOnClickListener {
                sendEvent("onFloatingEditorCancel", mapOf("scriptId" to (scriptId ?: "")))
                hide()
            }
            findViewById<Button>(R.id.btnSave)?.setOnClickListener {
                sendEvent("onFloatingEditorDone", mapOf("scriptId" to (scriptId ?: "")))
                hide()
            }
        }
    }

    private fun showConfigPanel() {
        if (configPanelView != null) return

        configPanelView = LayoutInflater.from(context).inflate(R.layout.floating_editor_config_panel, null).apply {
            findViewById<Button>(R.id.btnCloseConfig)?.setOnClickListener {
                hideConfigPanel()
            }

            val container = findViewById<LinearLayout>(R.id.pointListContainer)
            container?.removeAllViews()

            markers.forEachIndexed { index, marker ->
                val itemView = LayoutInflater.from(context).inflate(android.R.layout.simple_list_item_2, container, false).apply {
                    findViewById<TextView>(android.R.id.text1)?.text = "点 ${index + 1}"
                    findViewById<TextView>(android.R.id.text2)?.text = "坐标: (${marker.x}, ${marker.y})"
                    setOnClickListener {
                        sendEvent("onFloatingEditorPointConfig", mapOf(
                            "scriptId" to (scriptId ?: ""),
                            "pointIndex" to index,
                            "x" to marker.x,
                            "y" to marker.y
                        ))
                    }
                }
                container?.addView(itemView)
            }
        }

        try {
            windowManager.addView(configPanelView, createConfigPanelParams())
            configPanelView?.translationX = 280f * context.resources.displayMetrics.density
            configPanelView?.animate()
                ?.translationX(0f)
                ?.setDuration(300)
                ?.start()
        } catch (e: Exception) {
            Log.e("FloatingEditorManager", "Error showing config panel", e)
        }
    }

    private fun hideConfigPanel() {
        configPanelView?.animate()
            ?.translationX(280f * context.resources.displayMetrics.density)
            ?.setDuration(300)
            ?.withEndAction {
                try {
                    windowManager.removeView(configPanelView)
                    configPanelView = null
                } catch (e: Exception) {
                    Log.e("FloatingEditorManager", "Error hiding config panel", e)
                }
            }
            ?.start()
    }

    private fun startTestRun() {
        sendEvent("onFloatingEditorTestRun", mapOf("scriptId" to (scriptId ?: "")))
    }

    private fun updateCounter() {
        topBarView?.findViewById<TextView>(R.id.tvCounter)?.text = " | 已添加: ${markers.size} 个点"
    }

    private fun createFullScreenParams(): WindowManager.LayoutParams {
        return WindowManager.LayoutParams(
            WindowManager.LayoutParams.MATCH_PARENT,
            WindowManager.LayoutParams.MATCH_PARENT,
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
            } else {
                WindowManager.LayoutParams.TYPE_PHONE
            },
            WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE or
                    WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN,
            PixelFormat.TRANSLUCENT
        )
    }

    private fun createTopBarParams(): WindowManager.LayoutParams {
        return WindowManager.LayoutParams(
            WindowManager.LayoutParams.MATCH_PARENT,
            WindowManager.LayoutParams.WRAP_CONTENT,
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
            } else {
                WindowManager.LayoutParams.TYPE_PHONE
            },
            WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE,
            PixelFormat.TRANSLUCENT
        ).apply {
            gravity = Gravity.TOP
        }
    }

    private fun createBottomBarParams(): WindowManager.LayoutParams {
        return WindowManager.LayoutParams(
            WindowManager.LayoutParams.MATCH_PARENT,
            WindowManager.LayoutParams.WRAP_CONTENT,
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
            } else {
                WindowManager.LayoutParams.TYPE_PHONE
            },
            WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE,
            PixelFormat.TRANSLUCENT
        ).apply {
            gravity = Gravity.BOTTOM
        }
    }

    private fun createConfigPanelParams(): WindowManager.LayoutParams {
        return WindowManager.LayoutParams(
            WindowManager.LayoutParams.WRAP_CONTENT,
            WindowManager.LayoutParams.MATCH_PARENT,
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
            } else {
                WindowManager.LayoutParams.TYPE_PHONE
            },
            WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE,
            PixelFormat.TRANSLUCENT
        ).apply {
            gravity = Gravity.END
        }
    }
}
