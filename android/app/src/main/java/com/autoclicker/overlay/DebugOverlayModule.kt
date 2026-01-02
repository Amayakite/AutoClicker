package com.autoclicker.overlay

import android.content.Intent
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class DebugOverlayModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String {
        return "DebugOverlayModule"
    }

    @ReactMethod
    fun showClickPoint(x: Int, y: Int, duration: Int = 1000, promise: Promise) {
        try {
            val intent = Intent(reactContext, UnifiedOverlayService::class.java).apply {
                action = UnifiedOverlayService.ACTION_SHOW_DEBUG_POINT
                putExtra(UnifiedOverlayService.EXTRA_X, x)
                putExtra(UnifiedOverlayService.EXTRA_Y, y)
                putExtra(UnifiedOverlayService.EXTRA_DURATION, duration.toLong())
            }
            reactContext.startService(intent)
            promise.resolve(null)
        } catch (e: Exception) {
            promise.reject("ERROR", e.message)
        }
    }
}
