package com.autoclicker.overlay

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Intent
import android.os.Build
import android.os.IBinder
import android.util.Log
import androidx.core.app.NotificationCompat
import com.autoclicker.R

class UnifiedOverlayService : Service() {

    companion object {
        private const val TAG = "UnifiedOverlayService"
        private const val NOTIFICATION_CHANNEL_ID = "overlay_service_channel"
        private const val NOTIFICATION_ID = 2001

        const val ACTION_SHOW_DEBUG_POINT = "show_debug_point"
        const val ACTION_SHOW_EXECUTION_CONTROL = "show_execution_control"
        const val ACTION_HIDE_EXECUTION_CONTROL = "hide_execution_control"
        const val ACTION_UPDATE_EXECUTION_STATUS = "update_execution_status"
        const val ACTION_SHOW_EDITOR = "show_editor"
        const val ACTION_HIDE_EDITOR = "hide_editor"
        const val ACTION_STOP_SERVICE = "stop_service"

        const val EXTRA_X = "x"
        const val EXTRA_Y = "y"
        const val EXTRA_DURATION = "duration"
        const val EXTRA_SCRIPT_ID = "script_id"
        const val EXTRA_STATUS = "status"
        const val EXTRA_PROGRESS = "progress"
    }

    private lateinit var debugOverlayManager: DebugOverlayManager
    private lateinit var executionControlManager: ExecutionControlManager
    private lateinit var floatingEditorManager: FloatingEditorManager

    override fun onCreate() {
        super.onCreate()
        Log.d(TAG, "Service created")

        debugOverlayManager = DebugOverlayManager(this)
        executionControlManager = ExecutionControlManager(this)
        floatingEditorManager = FloatingEditorManager(this)

        createNotificationChannel()
        startForeground(NOTIFICATION_ID, createNotification())
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        Log.d(TAG, "onStartCommand: ${intent?.action}")

        try {
            when (intent?.action) {
                ACTION_SHOW_DEBUG_POINT -> {
                    val x = intent.getIntExtra(EXTRA_X, 0)
                    val y = intent.getIntExtra(EXTRA_Y, 0)
                    val duration = intent.getLongExtra(EXTRA_DURATION, 1000)
                    debugOverlayManager.showClickPoint(x, y, duration)
                }
                ACTION_SHOW_EXECUTION_CONTROL -> {
                    val scriptId = intent.getStringExtra(EXTRA_SCRIPT_ID)
                    executionControlManager.show(scriptId)
                }
                ACTION_HIDE_EXECUTION_CONTROL -> {
                    executionControlManager.hide()
                }
                ACTION_UPDATE_EXECUTION_STATUS -> {
                    val status = intent.getStringExtra(EXTRA_STATUS)
                    val progress = intent.getStringExtra(EXTRA_PROGRESS)
                    executionControlManager.updateStatus(status, progress)
                }
                ACTION_SHOW_EDITOR -> {
                    val scriptId = intent.getStringExtra(EXTRA_SCRIPT_ID)
                    floatingEditorManager.show(scriptId)
                }
                ACTION_HIDE_EDITOR -> {
                    floatingEditorManager.hide()
                }
                ACTION_STOP_SERVICE -> {
                    stopSelf()
                }
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error handling intent", e)
        }

        return START_STICKY
    }

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onDestroy() {
        super.onDestroy()
        Log.d(TAG, "Service destroyed")
        debugOverlayManager.cleanup()
        executionControlManager.cleanup()
        floatingEditorManager.cleanup()
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                NOTIFICATION_CHANNEL_ID,
                "悬浮窗服务",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "管理自动点击器的悬浮窗功能"
                setShowBadge(false)
                enableLights(false)
                enableVibration(false)
            }

            val notificationManager = getSystemService(NotificationManager::class.java)
            notificationManager?.createNotificationChannel(channel)
        }
    }

    private fun createNotification(): Notification {
        val intent = packageManager.getLaunchIntentForPackage(packageName)
        val pendingIntentFlags = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
        } else {
            PendingIntent.FLAG_UPDATE_CURRENT
        }
        val pendingIntent = PendingIntent.getActivity(this, 0, intent, pendingIntentFlags)

        return NotificationCompat.Builder(this, NOTIFICATION_CHANNEL_ID)
            .setContentTitle("自动点击器")
            .setContentText("悬浮窗服务运行中")
            .setSmallIcon(android.R.drawable.ic_menu_mylocation)
            .setOngoing(true)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .setCategory(NotificationCompat.CATEGORY_SERVICE)
            .setContentIntent(pendingIntent)
            .build()
    }
}
