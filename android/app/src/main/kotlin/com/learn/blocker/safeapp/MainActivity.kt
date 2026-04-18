package com.learn.blocker.safeapp

import android.Manifest
import android.app.AppOpsManager
import android.content.Context
import android.content.Intent
import android.content.pm.ApplicationInfo
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.provider.Settings
import android.webkit.JavascriptInterface
import android.webkit.PermissionRequest
import android.webkit.WebChromeClient
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.core.app.ActivityCompat
import org.json.JSONArray
import org.json.JSONObject

class MainActivity : AppCompatActivity() {

    private lateinit var webView: WebView

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        // Запрос базовых разрешений при старте
        requestAudioPermissions()

        webView = WebView(this)
        webView.settings.javaScriptEnabled = true
        webView.settings.domStorageEnabled = true
        webView.settings.databaseEnabled = true
        webView.settings.mediaPlaybackRequiresUserGesture = false
        webView.settings.mixedContentMode = android.webkit.WebSettings.MIXED_CONTENT_ALWAYS_ALLOW
        webView.settings.userAgentString = "Mozilla/5.0 (Linux; Android 10; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.149 Mobile Safari/537.36"
        
        // Добавляем мостик для JS
        webView.addJavascriptInterface(WebAppInterface(this), "Android")

        webView.webViewClient = object : WebViewClient() {
            override fun onReceivedError(view: WebView?, errorCode: Int, description: String?, failingUrl: String?) {
                view?.postDelayed({ view.reload() }, 3000)
            }
        }

        webView.webChromeClient = object : WebChromeClient() {
            override fun onPermissionRequest(request: PermissionRequest?) {
                request?.grant(request.resources)
            }
        }
        
        webView.settings.cacheMode = android.webkit.WebSettings.LOAD_DEFAULT
        var finalUrl = "https://ais-pre-ehhpukwzjqxnwrvn73fvkk-366435121233.europe-west1.run.app"
        if (intent.getBooleanExtra("IS_LOCK_SCREEN", false)) {
            finalUrl += "?lock=true"
        }
        webView.loadUrl(finalUrl) 

        setContentView(webView)

        // Запуск сервиса, если есть разрешения
        if (hasUsageStatsPermission() && hasOverlayPermission()) {
            startBlockingService()
        }
    }

    private fun requestAudioPermissions() {
        if (ActivityCompat.checkSelfPermission(this, Manifest.permission.RECORD_AUDIO) != PackageManager.PERMISSION_GRANTED) {
            ActivityCompat.requestPermissions(this, arrayOf(Manifest.permission.RECORD_AUDIO), 1)
        }
    }

    fun hasUsageStatsPermission(): Boolean {
        val appOps = getSystemService(Context.APP_OPS_SERVICE) as AppOpsManager
        val mode = appOps.checkOpNoThrow(AppOpsManager.OPSTR_GET_USAGE_STATS, android.os.Process.myUid(), packageName)
        return mode == AppOpsManager.MODE_ALLOWED
    }

    fun hasOverlayPermission(): Boolean {
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            Settings.canDrawOverlays(this)
        } else {
            true
        }
    }

    fun startBlockingService() {
        val serviceIntent = Intent(this, AppBlockingService::class.java)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            startForegroundService(serviceIntent)
        } else {
            startService(serviceIntent)
        }
    }

    override fun onBackPressed() {
        if (webView.canGoBack()) {
            webView.goBack()
        } else {
            // Если мы на главном экране нашего приложения, не закрываем его кнопкой "Назад"
            // чтобы ребенок не мог просто выйти из лок-скрина
            if (intent.getBooleanExtra("IS_LOCK_SCREEN", false)) {
                // Ничего не делаем
            } else {
                super.onBackPressed()
            }
        }
    }

    inner class WebAppInterface(private val mContext: Context) {

        @JavascriptInterface
        fun getInstalledApps(): String {
            val pm = mContext.packageManager
            val apps = pm.getInstalledApplications(PackageManager.GET_META_DATA)
            val jsonArray = JSONArray()
            for (app in apps) {
                // Берем только пользовательские приложения (не системные, если нужно)
                // Или просто все, кроме нашего
                if (app.packageName != mContext.packageName) {
                    val obj = JSONObject()
                    obj.put("name", pm.getApplicationLabel(app).toString())
                    obj.put("packageName", app.packageName)
                    jsonArray.put(obj)
                }
            }
            return jsonArray.toString()
        }

        @JavascriptInterface
        fun setBlockedApps(packageNamesJson: String) {
            val jsonArray = JSONArray(packageNamesJson)
            val set = mutableSetOf<String>()
            for (i in 0 until jsonArray.length()) {
                set.add(jsonArray.getString(i))
            }
            val prefs = mContext.getSharedPreferences("BlockedApps", Context.MODE_PRIVATE)
            prefs.edit().putStringSet("packages", set).apply()
            
            // Запускаем сервис после настройки, если есть разрешения
            if (hasUsageStatsPermission() && hasOverlayPermission()) {
                startBlockingService()
            }
        }

        @JavascriptInterface
        fun requestUsageStatsPermission() {
            val intent = Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS)
            mContext.startActivity(intent)
        }

        @JavascriptInterface
        fun requestOverlayPermission() {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                val intent = Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION, Uri.parse("package:" + mContext.packageName))
                mContext.startActivity(intent)
            }
        }

        @JavascriptInterface
        fun checkPermissions(): String {
            val obj = JSONObject()
            obj.put("usageStats", hasUsageStatsPermission())
            obj.put("overlay", hasOverlayPermission())
            return obj.toString()
        }

        @JavascriptInterface
        fun showToast(message: String) {
            Toast.makeText(mContext, message, Toast.LENGTH_SHORT).show()
        }
        
        @JavascriptInterface
        fun unlockCurrentApp() {
            // Отправляем сигнал сервису разблокировки
            val targetPkg = intent.getStringExtra("TARGET_PACKAGE")
            if (targetPkg != null) {
                val serviceIntent = Intent(mContext, AppBlockingService::class.java)
                serviceIntent.action = "UNLOCK_PACKAGE"
                serviceIntent.putExtra("PACKAGE_NAME", targetPkg)
                mContext.startService(serviceIntent)
            }
            
            // Сворачиваем наше приложение, чтобы вернуться к заблокированному
            moveTaskToBack(true)
        }
    }
}
