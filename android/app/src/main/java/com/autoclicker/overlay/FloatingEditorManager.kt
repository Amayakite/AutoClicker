package com.autoclicker.overlay

import android.content.Context
import android.graphics.PixelFormat
import android.os.Build
import android.util.Log
import android.view.Gravity
import android.view.LayoutInflater
import android.view.MotionEvent
import android.view.View
import android.view.WindowManager
import android.widget.Button
import com.autoclicker.R
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReactContext
import com.facebook.react.modules.core.DeviceEventManagerModule

class FloatingEditorManager(private val context: Context) {
    private val windowManager = context.getSystemService(Context.WINDOW_SERVICE) as WindowManager
    private var controlView: View? = null
    private var overlayView: View? = null
    private var scriptId: String? = null

    fun show(scriptId: String?) {
        if (controlView != null) return

        this.scriptId = scriptId

        try {
            // Create transparent full-screen overlay to capture taps
            overlayView = createOverlayView()
            windowManager.addView(overlayView, createFullScreenParams())

            // Create control panel
            controlView = createControlView()
            windowManager.addView(controlView, createControlParams())
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
            controlView?.let {
                windowManager.removeView(it)
                controlView = null
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
        return View(context).apply {
            setBackgroundColor(0x00000000) // Transparent
            setOnTouchListener { _, event ->
                if (event.action == MotionEvent.ACTION_DOWN) {
                    val x = event.rawX.toInt()
                    val y = event.rawY.toInt()
                    sendEvent("onFloatingEditorPointAdded", mapOf("x" to x, "y" to y, "scriptId" to (scriptId ?: "")))
                    true
                } else {
                    false
                }
            }
        }
    }

    private fun createControlView(): View {
        return LayoutInflater.from(context).inflate(R.layout.floating_editor_control, null).apply {
            findViewById<Button>(R.id.btnDone)?.setOnClickListener {
                sendEvent("onFloatingEditorDone", mapOf("scriptId" to (scriptId ?: "")))
                hide()
            }
            findViewById<Button>(R.id.btnCancel)?.setOnClickListener {
                sendEvent("onFloatingEditorCancel", mapOf("scriptId" to (scriptId ?: "")))
                hide()
            }
        }
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
                    WindowManager.LayoutParams.FLAG_NOT_TOUCH_MODAL or
                    WindowManager.LayoutParams.FLAG_WATCH_OUTSIDE_TOUCH,
            PixelFormat.TRANSLUCENT
        )
    }

    private fun createControlParams(): WindowManager.LayoutParams {
        return WindowManager.LayoutParams(
            WindowManager.LayoutParams.WRAP_CONTENT,
            WindowManager.LayoutParams.WRAP_CONTENT,
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
            } else {
                WindowManager.LayoutParams.TYPE_PHONE
            },
            WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE,
            PixelFormat.TRANSLUCENT
        ).apply {
            gravity = Gravity.TOP or Gravity.CENTER_HORIZONTAL
            y = 50
        }
    }
}
