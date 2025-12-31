package com.autoclicker

import android.content.Intent
import android.provider.Settings
import com.facebook.react.bridge.*
import com.autoclicker.accessibility.AutoClickerService

class AccessibilityModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String {
        return "AccessibilityModule"
    }

    @ReactMethod
    fun checkPermission(promise: Promise) {
        try {
            val enabled = AutoClickerService.getInstance() != null
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
                promise.reject("ERROR", "Accessibility service not enabled")
            }
        } catch (e: Exception) {
            promise.reject("ERROR", e.message)
        }
    }

    @ReactMethod
    fun isServiceEnabled(promise: Promise) {
        try {
            val enabled = AutoClickerService.getInstance() != null
            promise.resolve(enabled)
        } catch (e: Exception) {
            promise.reject("ERROR", e.message)
        }
    }
}
