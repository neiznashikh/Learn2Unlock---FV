package com.learn.blocker.safeapp

import android.app.*
import android.app.usage.UsageStatsManager
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.Handler
import android.os.IBinder
import android.os.Looper
import androidx.core.app.NotificationCompat
import java.util.*

class AppBlockingService : Service() {

    private val handler = Handler(Looper.getMainLooper())
    private var isRunning = false
    private val checkInterval = 1000L // 1 second

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onCreate() {
        super.onCreate()
        createNotificationChannel()
        val notification = createNotification("Learn2Unlock", "Система защиты активна")
        startForeground(1, notification)
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        if (!isRunning) {
            isRunning = true
            startMonitoring()
        }
        return START_STICKY
    }

    private fun startMonitoring() {
        handler.post(object : Runnable {
            override fun run() {
                checkTopApp()
                if (isRunning) {
                    handler.postDelayed(this, checkInterval)
                }
            }
        })
    }

    private fun checkTopApp() {
        val topPackage = getTopPackageName()
        if (topPackage != null && isAppBlocked(topPackage)) {
            // Check if our app is not already showing the lock screen
            if (topPackage != packageName) {
                launchLockScreen()
            }
        }
    }

    private fun getTopPackageName(): String? {
        val usageStatsManager = getSystemService(Context.USAGE_STATS_SERVICE) as UsageStatsManager
        val time = System.currentTimeMillis()
        val stats = usageStatsManager.queryUsageStats(UsageStatsManager.INTERVAL_DAILY, time - 1000 * 60, time)
        if (stats != null && stats.isNotEmpty()) {
            val sortedStats = stats.sortedByDescending { it.lastTimeUsed }
            return sortedStats[0].packageName
        }
        return null
    }

    private fun isAppBlocked(packageName: String): Boolean {
        // Here we will check against the list stored in SharedPreferences
        val prefs = getSharedPreferences("BlockedApps", Context.MODE_PRIVATE)
        val blockedApps = prefs.getStringSet("packages", emptySet())
        return blockedApps?.contains(packageName) == true
    }

    private fun launchLockScreen() {
        val intent = Intent(this, MainActivity::class.java)
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        intent.addFlags(Intent.FLAG_ACTIVITY_REORDER_TO_FRONT)
        intent.putExtra("IS_LOCK_SCREEN", true)
        startActivity(intent)
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                "blocking_service",
                "App Blocking Service",
                NotificationManager.IMPORTANCE_LOW
            )
            val manager = getSystemService(NotificationManager::class.java)
            manager?.createNotificationChannel(channel)
        }
    }

    private fun createNotification(title: String, content: String): Notification {
        return NotificationCompat.Builder(this, "blocking_service")
            .setContentTitle(title)
            .setContentText(content)
            .setSmallIcon(R.mipmap.ic_launcher)
            .build()
    }

    override fun onDestroy() {
        isRunning = false
        super.onDestroy()
    }
}
