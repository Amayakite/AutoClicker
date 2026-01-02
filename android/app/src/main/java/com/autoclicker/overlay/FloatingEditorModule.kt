package com.autoclicker.overlay

import android.content.Intent
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class FloatingEditorModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String {
        return "FloatingEditorModule"
    }

    @ReactMethod
    fun show(scriptId: String?, promise: Promise) {
        try {
            val intent = Intent(reactContext, UnifiedOverlayService::class.java).apply {
                action = UnifiedOverlayService.ACTION_SHOW_EDITOR
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
                action = UnifiedOverlayService.ACTION_HIDE_EDITOR
            }
            reactContext.startService(intent)
            promise.resolve(null)
        } catch (e: Exception) {
            promise.reject("ERROR", e.message)
        }
    }
}
