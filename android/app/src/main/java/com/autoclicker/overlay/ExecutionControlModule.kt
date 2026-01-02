package com.autoclicker.overlay

import android.content.Intent
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class ExecutionControlModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String {
        return "ExecutionControlModule"
    }

    @ReactMethod
    fun show(scriptId: String?, promise: Promise) {
        try {
            val intent = Intent(reactContext, UnifiedOverlayService::class.java).apply {
                action = UnifiedOverlayService.ACTION_SHOW_EXECUTION_CONTROL
                putExtra(UnifiedOverlayService.EXTRA_SCRIPT_ID, scriptId)
            }
            reactContext.startService(intent)
            promise.resolve(null)
        } catch (e: Exception) {
            promise.reject("ERROR", e.message)
        }
    }

    @ReactMethod
    fun hide(promise: Promise) {
        try {
            val intent = Intent(reactContext, UnifiedOverlayService::class.java).apply {
                action = UnifiedOverlayService.ACTION_HIDE_EXECUTION_CONTROL
            }
            reactContext.startService(intent)
            promise.resolve(null)
        } catch (e: Exception) {
            promise.reject("ERROR", e.message)
        }
    }

    @ReactMethod
    fun updateStatus(status: String?, progress: String?, promise: Promise) {
        try {
            val intent = Intent(reactContext, UnifiedOverlayService::class.java).apply {
                action = UnifiedOverlayService.ACTION_UPDATE_EXECUTION_STATUS
                putExtra(UnifiedOverlayService.EXTRA_STATUS, status)
                putExtra(UnifiedOverlayService.EXTRA_PROGRESS, progress)
            }
            reactContext.startService(intent)
            promise.resolve(null)
        } catch (e: Exception) {
            promise.reject("ERROR", e.message)
        }
    }
}
