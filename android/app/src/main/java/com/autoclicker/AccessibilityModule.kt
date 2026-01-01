package com.autoclicker

import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.provider.Settings
import android.text.TextUtils
import android.accessibilityservice.AccessibilityServiceInfo
import android.view.accessibility.AccessibilityManager
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule
import com.autoclicker.accessibility.AutoClickerService

class AccessibilityModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    companion object {
        private const val SERVICE_NAME = "com.autoclicker/.accessibility.AutoClickerService"
    }

    override fun getName(): String {
        return "AccessibilityModule"
    }

    /**
     * 使用系统 API 检查无障碍服务是否启用
     * 这比依赖 singleton instance 更可靠
     */
    private fun isAccessibilityServiceEnabled(): Boolean {
        val context = reactApplicationContext
        
        // 方法1: 检查 AccessibilityManager 中已启用的服务列表
        val accessibilityManager = context.getSystemService(Context.ACCESSIBILITY_SERVICE) as? AccessibilityManager
        if (accessibilityManager != null) {
            val enabledServices = accessibilityManager.getEnabledAccessibilityServiceList(
                AccessibilityServiceInfo.FEEDBACK_ALL_MASK
            )
            for (service in enabledServices) {
                val serviceId = service.id
                if (serviceId.contains("com.autoclicker") && serviceId.contains("AutoClickerService")) {
                    return true
                }
            }
        }
        
        // 方法2: 检查 Settings.Secure 中的设置（作为后备）
        val enabledServices = Settings.Secure.getString(
            context.contentResolver,
            Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES
        )
        
        if (!TextUtils.isEmpty(enabledServices)) {
            val colonSplitter = TextUtils.SimpleStringSplitter(':')
            colonSplitter.setString(enabledServices)
            while (colonSplitter.hasNext()) {
                val componentName = colonSplitter.next()
                if (componentName.equals(SERVICE_NAME, ignoreCase = true) ||
                    componentName.contains("AutoClickerService", ignoreCase = true)) {
                    return true
                }
            }
        }
        
        return false
    }

    @ReactMethod
    fun checkPermission(promise: Promise) {
        try {
            val enabled = isAccessibilityServiceEnabled()
            promise.resolve(enabled)
        } catch (e: Exception) {
            promise.reject("ERROR", e.message)
        }
    }

    @ReactMethod
    fun requestPermission(promise: Promise) {
        try {
            val intent = Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS)
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            reactApplicationContext.startActivity(intent)
            promise.resolve(null)
        } catch (e: Exception) {
            promise.reject("ERROR", e.message)
        }
    }

    @ReactMethod
    fun simulateClick(x: Int, y: Int, promise: Promise) {
        try {
            val service = AutoClickerService.getInstance()
            if (service != null) {
                service.performClick(x, y) { success ->
                    if (success) {
                        promise.resolve(null)
                    } else {
                        promise.reject("ERROR", "Click gesture cancelled")
                    }
                }
            } else {
                // 如果 instance 为空，但系统显示已启用，提示重新启用
                if (isAccessibilityServiceEnabled()) {
                    promise.reject("ERROR", "服务已启用但未初始化，请重新开关一次无障碍服务")
                } else {
                    promise.reject("ERROR", "Accessibility service not enabled")
                }
            }
        } catch (e: Exception) {
            promise.reject("ERROR", e.message)
        }
    }

    @ReactMethod
    fun isServiceEnabled(promise: Promise) {
        try {
            // 同时检查系统设置和实际服务实例
            val systemEnabled = isAccessibilityServiceEnabled()
            val instanceAvailable = AutoClickerService.getInstance() != null
            
            // 如果系统显示已启用但实例不可用，返回特殊状态
            // 但对于 UI 显示，我们以系统设置为准
            promise.resolve(systemEnabled && instanceAvailable)
        } catch (e: Exception) {
            promise.reject("ERROR", e.message)
        }
    }

    @ReactMethod
    fun isServiceRunning(promise: Promise) {
        try {
            val instanceAvailable = AutoClickerService.getInstance() != null
            promise.resolve(instanceAvailable)
        } catch (e: Exception) {
            promise.reject("ERROR", e.message)
        }
    }

    /**
     * 发送事件到 JS 层
     */
    private fun sendEvent(eventName: String, params: WritableMap?) {
        reactApplicationContext
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            .emit(eventName, params)
    }

    @ReactMethod
    fun addListener(eventName: String) {
        // Required for RN event emitter
    }

    @ReactMethod
    fun removeListeners(count: Int) {
        // Required for RN event emitter
    }
}
