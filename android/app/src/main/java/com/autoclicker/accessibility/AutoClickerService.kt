package com.autoclicker.accessibility

import android.accessibilityservice.AccessibilityService
import android.accessibilityservice.AccessibilityServiceInfo
import android.accessibilityservice.GestureDescription
import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.graphics.Path
import android.os.Build
import android.os.Handler
import android.os.Looper
import android.util.Log
import android.view.accessibility.AccessibilityEvent
import androidx.core.app.NotificationCompat

class AutoClickerService : AccessibilityService() {

    companion object {
        private const val TAG = "AutoClickerService"
        private const val NOTIFICATION_CHANNEL_ID = "autoclicker_service_channel"
        private const val NOTIFICATION_ID = 1001
        private const val KEEP_ALIVE_INTERVAL = 30000L // 30秒检查一次

        @Volatile
        private var instance: AutoClickerService? = null

        fun getInstance(): AutoClickerService? = instance
    }

    private val handler = Handler(Looper.getMainLooper())
    private var keepAliveRunnable: Runnable? = null
    private var screenStateReceiver: BroadcastReceiver? = null

    override fun onAccessibilityEvent(event: AccessibilityEvent?) {
        // 收到事件时保持服务活跃
        // 可以选择性处理某些事件
    }

    override fun onInterrupt() {
        Log.w(TAG, "Service interrupted")
    }

    override fun onCreate() {
        super.onCreate()
        Log.d(TAG, "Service created")
        instance = this
    }

    override fun onServiceConnected() {
        super.onServiceConnected()
        Log.d(TAG, "Service connected")
        instance = this
        
        // 配置服务信息以增强稳定性
        configureServiceInfo()
        
        // 创建通知渠道
        createNotificationChannel()
        
        // 启动前台服务以防止被系统杀死
        startForegroundService()
        
        // 启动保活机制
        startKeepAlive()
        
        // 注册屏幕状态监听器
        registerScreenStateReceiver()
    }

    /**
     * 配置服务信息
     */
    private fun configureServiceInfo() {
        try {
            val info = serviceInfo ?: AccessibilityServiceInfo()
            
            // 设置事件类型
            info.eventTypes = AccessibilityEvent.TYPES_ALL_MASK
            
            // 设置反馈类型
            info.feedbackType = AccessibilityServiceInfo.FEEDBACK_GENERIC
            
            // 设置标志
            info.flags = AccessibilityServiceInfo.FLAG_INCLUDE_NOT_IMPORTANT_VIEWS or
                    AccessibilityServiceInfo.FLAG_REPORT_VIEW_IDS or
                    AccessibilityServiceInfo.FLAG_REQUEST_ENHANCED_WEB_ACCESSIBILITY or
                    AccessibilityServiceInfo.DEFAULT
            
            // 设置通知超时
            info.notificationTimeout = 100
            
            // 应用配置
            serviceInfo = info
            
            Log.d(TAG, "Service info configured")
        } catch (e: Exception) {
            Log.e(TAG, "Failed to configure service info: ${e.message}")
        }
    }

    /**
     * 创建通知渠道 (Android 8.0+)
     */
    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                NOTIFICATION_CHANNEL_ID,
                "自动点击器服务",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "保持自动点击器服务在后台运行"
                setShowBadge(false)
                enableLights(false)
                enableVibration(false)
            }
            
            val notificationManager = getSystemService(NotificationManager::class.java)
            notificationManager?.createNotificationChannel(channel)
        }
    }

    /**
     * 启动前台服务
     */
    private fun startForegroundService() {
        try {
            val notification = createNotification()
            startForeground(NOTIFICATION_ID, notification)
            Log.d(TAG, "Foreground service started")
        } catch (e: Exception) {
            Log.e(TAG, "Failed to start foreground service: ${e.message}")
        }
    }

    /**
     * 创建前台通知
     */
    private fun createNotification(): Notification {
        // 创建点击通知时打开应用的 Intent
        val intent = packageManager.getLaunchIntentForPackage(packageName)
        val pendingIntentFlags = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
        } else {
            PendingIntent.FLAG_UPDATE_CURRENT
        }
        val pendingIntent = PendingIntent.getActivity(this, 0, intent, pendingIntentFlags)

        return NotificationCompat.Builder(this, NOTIFICATION_CHANNEL_ID)
            .setContentTitle("自动点击器运行中")
            .setContentText("无障碍服务已启用")
            .setSmallIcon(android.R.drawable.ic_menu_mylocation)
            .setOngoing(true)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .setCategory(NotificationCompat.CATEGORY_SERVICE)
            .setContentIntent(pendingIntent)
            .build()
    }

    /**
     * 启动保活机制
     */
    private fun startKeepAlive() {
        keepAliveRunnable?.let { handler.removeCallbacks(it) }
        
        keepAliveRunnable = object : Runnable {
            override fun run() {
                if (instance == this@AutoClickerService) {
                    Log.d(TAG, "Keep alive check - service is running")
                    
                    // 重新配置服务信息以保持活跃
                    try {
                        val info = serviceInfo
                        if (info != null) {
                            serviceInfo = info
                        }
                    } catch (e: Exception) {
                        Log.w(TAG, "Keep alive check warning: ${e.message}")
                    }
                    
                    handler.postDelayed(this, KEEP_ALIVE_INTERVAL)
                }
            }
        }
        
        handler.postDelayed(keepAliveRunnable!!, KEEP_ALIVE_INTERVAL)
    }

    /**
     * 注册屏幕状态监听器
     */
    private fun registerScreenStateReceiver() {
        screenStateReceiver = object : BroadcastReceiver() {
            override fun onReceive(context: Context?, intent: Intent?) {
                when (intent?.action) {
                    Intent.ACTION_SCREEN_ON -> {
                        Log.d(TAG, "Screen ON - checking service")
                        // 屏幕亮起时确保服务正常
                        startKeepAlive()
                    }
                    Intent.ACTION_SCREEN_OFF -> {
                        Log.d(TAG, "Screen OFF - maintaining service")
                        // 屏幕关闭时保持服务
                    }
                    Intent.ACTION_USER_PRESENT -> {
                        Log.d(TAG, "User present - service check")
                    }
                }
            }
        }

        val filter = IntentFilter().apply {
            addAction(Intent.ACTION_SCREEN_ON)
            addAction(Intent.ACTION_SCREEN_OFF)
            addAction(Intent.ACTION_USER_PRESENT)
        }
        
        registerReceiver(screenStateReceiver, filter)
    }

    override fun onUnbind(intent: Intent?): Boolean {
        Log.w(TAG, "Service unbind")
        cleanup()
        return super.onUnbind(intent)
    }

    override fun onDestroy() {
        Log.w(TAG, "Service destroyed")
        cleanup()
        super.onDestroy()
    }

    private fun cleanup() {
        instance = null
        
        // 停止保活
        keepAliveRunnable?.let { handler.removeCallbacks(it) }
        keepAliveRunnable = null
        
        // 注销广播接收器
        screenStateReceiver?.let {
            try {
                unregisterReceiver(it)
            } catch (e: Exception) {
                Log.w(TAG, "Failed to unregister receiver: ${e.message}")
            }
        }
        screenStateReceiver = null
        
        // 停止前台服务
        try {
            stopForeground(STOP_FOREGROUND_REMOVE)
        } catch (e: Exception) {
            Log.w(TAG, "Failed to stop foreground: ${e.message}")
        }
    }

    /**
     * 执行点击手势
     */
    fun performClick(x: Int, y: Int, callback: ((Boolean) -> Unit)? = null) {
        try {
            val path = Path()
            path.moveTo(x.toFloat(), y.toFloat())

            val gestureBuilder = GestureDescription.Builder()
            val strokeDescription = GestureDescription.StrokeDescription(path, 0, 100)
            gestureBuilder.addStroke(strokeDescription)

            val gesture = gestureBuilder.build()

            val result = dispatchGesture(gesture, object : GestureResultCallback() {
                override fun onCompleted(gestureDescription: GestureDescription?) {
                    super.onCompleted(gestureDescription)
                    Log.d(TAG, "Click completed at ($x, $y)")
                    callback?.invoke(true)
                }

                override fun onCancelled(gestureDescription: GestureDescription?) {
                    super.onCancelled(gestureDescription)
                    Log.w(TAG, "Click cancelled at ($x, $y)")
                    callback?.invoke(false)
                }
            }, null)
            
            if (!result) {
                Log.e(TAG, "Failed to dispatch gesture")
                callback?.invoke(false)
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error performing click: ${e.message}")
            callback?.invoke(false)
        }
    }

    /**
     * 执行长按手势
     */
    fun performLongClick(x: Int, y: Int, duration: Long = 500, callback: ((Boolean) -> Unit)? = null) {
        try {
            val path = Path()
            path.moveTo(x.toFloat(), y.toFloat())

            val gestureBuilder = GestureDescription.Builder()
            val strokeDescription = GestureDescription.StrokeDescription(path, 0, duration)
            gestureBuilder.addStroke(strokeDescription)

            val gesture = gestureBuilder.build()

            dispatchGesture(gesture, object : GestureResultCallback() {
                override fun onCompleted(gestureDescription: GestureDescription?) {
                    super.onCompleted(gestureDescription)
                    callback?.invoke(true)
                }

                override fun onCancelled(gestureDescription: GestureDescription?) {
                    super.onCancelled(gestureDescription)
                    callback?.invoke(false)
                }
            }, null)
        } catch (e: Exception) {
            Log.e(TAG, "Error performing long click: ${e.message}")
            callback?.invoke(false)
        }
    }

    /**
     * 执行滑动手势
     */
    fun performSwipe(
        startX: Int, startY: Int,
        endX: Int, endY: Int,
        duration: Long = 300,
        callback: ((Boolean) -> Unit)? = null
    ) {
        try {
            val path = Path()
            path.moveTo(startX.toFloat(), startY.toFloat())
            path.lineTo(endX.toFloat(), endY.toFloat())

            val gestureBuilder = GestureDescription.Builder()
            val strokeDescription = GestureDescription.StrokeDescription(path, 0, duration)
            gestureBuilder.addStroke(strokeDescription)

            val gesture = gestureBuilder.build()

            dispatchGesture(gesture, object : GestureResultCallback() {
                override fun onCompleted(gestureDescription: GestureDescription?) {
                    super.onCompleted(gestureDescription)
                    callback?.invoke(true)
                }

                override fun onCancelled(gestureDescription: GestureDescription?) {
                    super.onCancelled(gestureDescription)
                    callback?.invoke(false)
                }
            }, null)
        } catch (e: Exception) {
            Log.e(TAG, "Error performing swipe: ${e.message}")
            callback?.invoke(false)
        }
    }
}
