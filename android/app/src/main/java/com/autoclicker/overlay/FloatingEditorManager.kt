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
import android.widget.TextView
import com.autoclicker.R
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReactContext
import com.facebook.react.modules.core.DeviceEventManagerModule

class FloatingEditorManager(private val context: Context) {
    private val windowManager = context.getSystemService(Context.WINDOW_SERVICE) as WindowManager
    private var topBarView: View? = null
    private var bottomBarView: View? = null
    private var overlayView: View? = null
    private var scriptId: String? = null
    private var pointCount = 0

    fun show(scriptId: String?) {
        if (overlayView != null) return

        this.scriptId = scriptId
        this.pointCount = 0

        try {
            // Create transparent full-screen overlay to capture taps
            overlayView = createOverlayView()
            windowManager.addView(overlayView, createFullScreenParams())

            // Create top bar
            topBarView = createTopBar()
            windowManager.addView(topBarView, createTopBarParams())

            // Create bottom bar
            bottomBarView = createBottomBar()
            windowManager.addView(bottomBarView, createBottomBarParams())

            updateCounter()
        } catch (e: Exception) {
            Log.e("FloatingEditorManager", "Error showing editor", e)
        }
    }

    fun hide() {
        try {
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
            setBackgroundColor(0x00000000) // Transparent
            setOnTouchListener { _, event ->
                when (event.action) {
                    MotionEvent.ACTION_DOWN -> {
                        val x = event.rawX.toInt()
                        val y = event.rawY.toInt()

                        // Check if touch is not in control bars area
                        val topBarHeight = 56 * resources.displayMetrics.density
                        val bottomBarHeight = 64 * resources.displayMetrics.density
                        val screenHeight = resources.displayMetrics.heightPixels

                        if (y > topBarHeight && y < screenHeight - bottomBarHeight) {
                            showClickIndicator(x, y)
                            sendEvent("onFloatingEditorPointAdded", mapOf("x" to x, "y" to y, "scriptId" to (scriptId ?: "")))
                            pointCount++
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

            // Create circular background
            background = GradientDrawable().apply {
                shape = GradientDrawable.OVAL
                setColor(0x8800FF00.toInt())
            }

            // Set initial scale
            scaleX = 0.8f
            scaleY = 0.8f
            alpha = 1f

            // Animate
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

        // Add indicator to overlay at touch position
        (overlayView as? FrameLayout)?.addView(indicator)
        indicator.x = x - (indicator.layoutParams.width / 2f)
        indicator.y = y - (indicator.layoutParams.height / 2f)
    }

    private fun createTopBar(): View {
        return LayoutInflater.from(context).inflate(R.layout.floating_editor_top_bar, null).apply {
            findViewById<Button>(R.id.btnDone)?.setOnClickListener {
                sendEvent("onFloatingEditorDone", mapOf("scriptId" to (scriptId ?: "")))
                hide()
            }
        }
    }

    private fun createBottomBar(): View {
        return LayoutInflater.from(context).inflate(R.layout.floating_editor_bottom_bar, null).apply {
            findViewById<Button>(R.id.btnUndo)?.setOnClickListener {
                if (pointCount > 0) {
                    sendEvent("onFloatingEditorUndo", mapOf("scriptId" to (scriptId ?: "")))
                    pointCount--
                    updateCounter()
                }
            }
            findViewById<Button>(R.id.btnClear)?.setOnClickListener {
                sendEvent("onFloatingEditorClear", mapOf("scriptId" to (scriptId ?: "")))
                pointCount = 0
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

    private fun updateCounter() {
        topBarView?.findViewById<TextView>(R.id.tvCounter)?.text = " | 已添加: $pointCount 个点"
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
}
