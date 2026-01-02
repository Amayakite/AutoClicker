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
import android.widget.TextView
import com.autoclicker.R

class ExecutionControlManager(private val context: Context) {
    private val windowManager = context.getSystemService(Context.WINDOW_SERVICE) as WindowManager
    private var floatingView: View? = null
    private var scriptId: String? = null

    fun show(scriptId: String?) {
        if (floatingView != null) return

        this.scriptId = scriptId
        try {
            floatingView = createFloatingView()
            val params = createWindowParams()
            setupDraggable(floatingView!!, params)
            windowManager.addView(floatingView, params)
        } catch (e: Exception) {
            Log.e("ExecutionControlManager", "Error showing control", e)
        }
    }

    fun hide() {
        try {
            floatingView?.let {
                windowManager.removeView(it)
                floatingView = null
            }
        } catch (e: Exception) {
            Log.e("ExecutionControlManager", "Error hiding control", e)
        }
    }

    fun updateStatus(status: String?, progress: String?) {
        floatingView?.let { view ->
            view.findViewById<TextView>(R.id.tvStatus)?.text = status ?: "就绪"
            view.findViewById<TextView>(R.id.tvProgress)?.text = progress ?: ""
        }
    }

    fun cleanup() {
        hide()
    }

    private fun createFloatingView(): View {
        return LayoutInflater.from(context).inflate(R.layout.execution_control, null).apply {
            findViewById<Button>(R.id.btnStop)?.setOnClickListener {
                // TODO: Implement stop functionality
            }
            findViewById<Button>(R.id.btnClose)?.setOnClickListener {
                hide()
            }
        }
    }

    private fun createWindowParams(): WindowManager.LayoutParams {
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
            gravity = Gravity.TOP or Gravity.END
            x = 20
            y = 100
        }
    }

    private fun setupDraggable(view: View, params: WindowManager.LayoutParams) {
        var initialX = 0
        var initialY = 0
        var initialTouchX = 0f
        var initialTouchY = 0f

        view.setOnTouchListener { _, event ->
            when (event.action) {
                MotionEvent.ACTION_DOWN -> {
                    initialX = params.x
                    initialY = params.y
                    initialTouchX = event.rawX
                    initialTouchY = event.rawY
                    true
                }
                MotionEvent.ACTION_MOVE -> {
                    params.x = initialX + (event.rawX - initialTouchX).toInt()
                    params.y = initialY + (event.rawY - initialTouchY).toInt()
                    windowManager.updateViewLayout(view, params)
                    true
                }
                else -> false
            }
        }
    }
}
