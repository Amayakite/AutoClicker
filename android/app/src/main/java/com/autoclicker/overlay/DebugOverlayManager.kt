package com.autoclicker.overlay

import android.content.Context
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.graphics.PixelFormat
import android.os.Build
import android.os.Handler
import android.os.Looper
import android.util.Log
import android.view.Gravity
import android.view.View
import android.view.WindowManager

class DebugOverlayManager(private val context: Context) {
    private val windowManager = context.getSystemService(Context.WINDOW_SERVICE) as WindowManager
    private var canvasView: DebugCanvasView? = null

    fun showClickPoint(x: Int, y: Int, duration: Long = 1000) {
        try {
            if (canvasView == null) {
                canvasView = DebugCanvasView(context)
                val params = createFullScreenParams()
                windowManager.addView(canvasView, params)
            }
            canvasView?.addPoint(x.toFloat(), y.toFloat(), duration)
        } catch (e: Exception) {
            Log.e("DebugOverlayManager", "Error showing click point", e)
        }
    }

    fun cleanup() {
        try {
            canvasView?.let {
                windowManager.removeView(it)
                canvasView = null
            }
        } catch (e: Exception) {
            Log.e("DebugOverlayManager", "Error cleaning up", e)
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
                    WindowManager.LayoutParams.FLAG_NOT_TOUCHABLE or
                    WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS,
            PixelFormat.TRANSLUCENT
        ).apply {
            gravity = Gravity.TOP or Gravity.START
        }
    }
}

data class DebugPoint(
    val x: Float,
    val y: Float,
    val expireTime: Long
)

class DebugCanvasView(context: Context) : View(context) {
    private val points = mutableListOf<DebugPoint>()
    private val handler = Handler(Looper.getMainLooper())
    private val paint = Paint().apply {
        color = Color.RED
        alpha = 180
        style = Paint.Style.FILL
        isAntiAlias = true
    }

    private val strokePaint = Paint().apply {
        color = Color.WHITE
        alpha = 200
        style = Paint.Style.STROKE
        strokeWidth = 3f
        isAntiAlias = true
    }

    fun addPoint(x: Float, y: Float, duration: Long) {
        synchronized(points) {
            points.add(DebugPoint(x, y, System.currentTimeMillis() + duration))
        }
        invalidate()

        handler.postDelayed({
            synchronized(points) {
                points.removeAll { it.expireTime < System.currentTimeMillis() }
            }
            invalidate()
        }, duration)
    }

    override fun onDraw(canvas: Canvas) {
        super.onDraw(canvas)
        synchronized(points) {
            points.forEach { point ->
                // 绘制红色圆点
                canvas.drawCircle(point.x, point.y, 20f, paint)
                // 绘制白色边框
                canvas.drawCircle(point.x, point.y, 20f, strokePaint)
            }
        }
    }
}
