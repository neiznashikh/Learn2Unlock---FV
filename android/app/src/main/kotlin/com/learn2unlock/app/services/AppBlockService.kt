package com.learn2unlock.app.services

import android.accessibilityservice.AccessibilityService
import android.content.Intent
import android.view.accessibility.AccessibilityEvent
import com.learn2unlock.app.MainActivity

class AppBlockService : AccessibilityService() {

    // Список заблокированных приложений (потом сделаем настраиваемым)
    private val blockedPackages = hashSetOf(
        "com.google.android.youtube",
        "com.zhiliaoapp.musically", // TikTok
        "com.instagram.android",
        "com.android.vending" // Play Store
    )

    override fun onAccessibilityEvent(event: AccessibilityEvent) {
        if (event.eventType == AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED) {
            val packageName = event.packageName?.toString() ?: return
            
            if (blockedPackages.contains(packageName)) {
                // Если открыто запрещенное приложение - запускаем наше окно с заданиями
                val intent = Intent(this, MainActivity::class.java)
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                intent.addFlags(Intent.FLAG_ACTIVITY_REORDER_TO_FRONT)
                intent.putExtra("BLOCKED_APP", packageName)
                startActivity(intent)
            }
        }
    }

    override fun onInterrupt() {
        // Вызывается, если система прерывает работу сервиса
    }
}
