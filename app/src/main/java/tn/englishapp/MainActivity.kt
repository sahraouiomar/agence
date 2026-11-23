package tn.englishapp

import android.Manifest
import android.annotation.SuppressLint
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.speech.RecognizerIntent
import android.speech.tts.TextToSpeech
import android.speech.tts.UtteranceProgressListener
import android.speech.tts.Voice
import android.webkit.JavascriptInterface
import android.webkit.PermissionRequest
import android.webkit.ValueCallback
import android.webkit.WebChromeClient
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.activity.OnBackPressedCallback
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import androidx.webkit.WebViewAssetLoader
import com.google.mlkit.common.model.DownloadConditions
import com.google.mlkit.nl.translate.TranslateLanguage
import com.google.mlkit.nl.translate.Translation
import com.google.mlkit.nl.translate.Translator
import com.google.mlkit.nl.translate.TranslatorOptions
import org.json.JSONArray
import org.json.JSONObject
import java.io.File
import java.net.HttpURLConnection
import java.net.URL
import java.util.Locale

/**
 * Hosts the web UI (assets/www) and exposes native features to it through `window.Android`:
 *  - Text-to-speech in English / Arabic with adjustable speed + word-by-word progress events
 *  - On-device translation EN <-> AR (Google ML Kit)
 *  - Speech recognition for pronunciation practice
 *  - Downloading free books (Project Gutenberg) into app storage, served back at /files/
 *  - File import (<input type=file>) and microphone recording (getUserMedia) inside the WebView
 */
class MainActivity : AppCompatActivity(), TextToSpeech.OnInitListener {

    private lateinit var web: WebView
    private var tts: TextToSpeech? = null
    private var ttsReady = false
    private val main = Handler(Looper.getMainLooper())
    private var enAr: Translator? = null
    private var arEn: Translator? = null
    private var pendingSpeechCb: String? = null
    private var fileCallback: ValueCallback<Array<Uri>>? = null
    private var pendingMic: PermissionRequest? = null
    private val publicDir by lazy { File(filesDir, "public").apply { mkdirs() } }

    private val fileLauncher =
        registerForActivityResult(ActivityResultContracts.StartActivityForResult()) { res ->
            val cb = fileCallback ?: return@registerForActivityResult
            fileCallback = null
            cb.onReceiveValue(WebChromeClient.FileChooserParams.parseResult(res.resultCode, res.data))
        }

    private val micLauncher =
        registerForActivityResult(ActivityResultContracts.RequestPermission()) { granted ->
            val req = pendingMic ?: return@registerForActivityResult
            pendingMic = null
            if (granted) req.grant(arrayOf(PermissionRequest.RESOURCE_AUDIO_CAPTURE)) else req.deny()
        }

    private val speechLauncher =
        registerForActivityResult(ActivityResultContracts.StartActivityForResult()) { res ->
            val cb = pendingSpeechCb ?: return@registerForActivityResult
            pendingSpeechCb = null
            val list = res.data?.getStringArrayListExtra(RecognizerIntent.EXTRA_RESULTS)
            val arr = JSONArray()
            list?.forEach { arr.put(it) }
            js("window.__native && __native.onSpeech(${JSONObject.quote(cb)}, $arr)")
        }

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        tts = TextToSpeech(this, this)

        val loader = WebViewAssetLoader.Builder()
            .addPathHandler("/assets/", WebViewAssetLoader.AssetsPathHandler(this))
            .addPathHandler("/files/", WebViewAssetLoader.InternalStoragePathHandler(this, publicDir))
            .build()

        web = WebView(this)
        web.settings.javaScriptEnabled = true
        web.settings.domStorageEnabled = true
        web.settings.mediaPlaybackRequiresUserGesture = false
        web.settings.textZoom = 100
        web.webViewClient = object : WebViewClient() {
            override fun shouldInterceptRequest(view: WebView, request: WebResourceRequest): WebResourceResponse? =
                loader.shouldInterceptRequest(request.url)
        }
        web.webChromeClient = object : WebChromeClient() {
            override fun onShowFileChooser(
                view: WebView, callback: ValueCallback<Array<Uri>>, params: FileChooserParams
            ): Boolean {
                fileCallback?.onReceiveValue(null)
                fileCallback = callback
                return try {
                    val i = Intent(Intent.ACTION_GET_CONTENT).apply {
                        addCategory(Intent.CATEGORY_OPENABLE)
                        type = "*/*"
                    }
                    fileLauncher.launch(Intent.createChooser(i, "اختر كتابًا (.txt / .epub)"))
                    true
                } catch (e: Exception) {
                    fileCallback = null
                    false
                }
            }

            override fun onPermissionRequest(request: PermissionRequest) {
                runOnUiThread {
                    if (!request.resources.contains(PermissionRequest.RESOURCE_AUDIO_CAPTURE)) {
                        request.deny(); return@runOnUiThread
                    }
                    if (ContextCompat.checkSelfPermission(this@MainActivity, Manifest.permission.RECORD_AUDIO)
                        == PackageManager.PERMISSION_GRANTED
                    ) {
                        request.grant(arrayOf(PermissionRequest.RESOURCE_AUDIO_CAPTURE))
                    } else {
                        pendingMic = request
                        micLauncher.launch(Manifest.permission.RECORD_AUDIO)
                    }
                }
            }
        }
        web.addJavascriptInterface(Bridge(), "Android")
        setContentView(web)
        web.loadUrl("https://appassets.androidplatform.net/assets/www/index.html")

        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                web.evaluateJavascript("window.appBack ? appBack() : false") { r ->
                    if (r != "true") finish()
                }
            }
        })
    }

    override fun onInit(status: Int) {
        ttsReady = status == TextToSpeech.SUCCESS
        if (!ttsReady) return
        tts?.language = Locale.US
        tts?.setOnUtteranceProgressListener(object : UtteranceProgressListener() {
            override fun onStart(id: String) = event(id, "start")
            override fun onDone(id: String) = event(id, "done")
            @Deprecated("Deprecated in Java")
            override fun onError(id: String) = event(id, "error")
            override fun onError(id: String, errorCode: Int) = event(id, "error")
            override fun onStop(id: String, interrupted: Boolean) = event(id, "stop")
            override fun onRangeStart(id: String, start: Int, end: Int, frame: Int) {
                js("window.__native && __native.onTts(${JSONObject.quote(id)},'range',$start,$end)")
            }
        })
        js("window.__native && __native.onReady()")
    }

    private fun event(id: String, type: String): Unit =
        js("window.__native && __native.onTts(${JSONObject.quote(id)},'$type',0,0)")

    private fun js(code: String) {
        main.post { if (::web.isInitialized) web.evaluateJavascript(code, null) }
    }

    private fun localeFor(lang: String): Locale = when (lang) {
        "ar" -> Locale("ar")
        "en-GB" -> Locale.UK
        else -> Locale.US
    }

    inner class Bridge {
        @JavascriptInterface
        fun isReady(): Boolean = ttsReady

        /** Speak [text]; rate 1.0 = normal, 0.5 = half speed. */
        @JavascriptInterface
        fun speak(text: String, lang: String, rate: Float, id: String) {
            val t = tts ?: return
            if (!ttsReady) { event(id, "error"); return }
            main.post {
                val loc = localeFor(lang)
                val res = t.setLanguage(loc)
                if (res == TextToSpeech.LANG_MISSING_DATA || res == TextToSpeech.LANG_NOT_SUPPORTED) {
                    js("window.__native && __native.onTts(${JSONObject.quote(id)},'nolang',0,0)")
                    return@post
                }
                t.setSpeechRate(rate.coerceIn(0.25f, 2.5f))
                t.speak(text, TextToSpeech.QUEUE_FLUSH, Bundle(), id)
            }
        }

        @JavascriptInterface
        fun stop() { main.post { tts?.stop() } }

        @JavascriptInterface
        fun hasLanguage(lang: String): Boolean {
            val t = tts ?: return false
            val r = t.isLanguageAvailable(localeFor(lang))
            return r >= TextToSpeech.LANG_AVAILABLE
        }

        /** Opens Android's "install voice data" screen (e.g. to add the Arabic voice). */
        @JavascriptInterface
        fun installVoices() {
            main.post {
                try {
                    startActivity(Intent(TextToSpeech.Engine.ACTION_INSTALL_TTS_DATA))
                } catch (_: Exception) {
                    try { startActivity(Intent("com.android.settings.TTS_SETTINGS")) } catch (_: Exception) {}
                }
            }
        }

        @JavascriptInterface
        fun voices(): String {
            val arr = JSONArray()
            try {
                tts?.voices?.filter { it.locale.language == "en" && !it.isNetworkConnectionRequired }
                    ?.sortedBy { it.name }
                    ?.forEach { v: Voice -> arr.put(v.locale.toLanguageTag() + "|" + v.name) }
            } catch (_: Exception) {}
            return arr.toString()
        }

        @JavascriptInterface
        fun setVoice(name: String) {
            main.post {
                val t = tts ?: return@post
                if (name.isEmpty()) { t.language = Locale.US; return@post }
                t.voices?.firstOrNull { it.name == name }?.let { t.voice = it }
            }
        }

        /** Translate text. dir = "en-ar" or "ar-en". Result delivered to __native.onTranslate(cb, text, error). */
        @JavascriptInterface
        fun translate(text: String, dir: String, cb: String) {
            main.post {
                val translator = if (dir == "ar-en") {
                    arEn ?: Translation.getClient(
                        TranslatorOptions.Builder()
                            .setSourceLanguage(TranslateLanguage.ARABIC)
                            .setTargetLanguage(TranslateLanguage.ENGLISH).build()
                    ).also { arEn = it; lifecycle.addObserver(it) }
                } else {
                    enAr ?: Translation.getClient(
                        TranslatorOptions.Builder()
                            .setSourceLanguage(TranslateLanguage.ENGLISH)
                            .setTargetLanguage(TranslateLanguage.ARABIC).build()
                    ).also { enAr = it; lifecycle.addObserver(it) }
                }
                val q = JSONObject.quote(cb)
                translator.downloadModelIfNeeded(DownloadConditions.Builder().build())
                    .addOnSuccessListener {
                        translator.translate(text)
                            .addOnSuccessListener { out ->
                                js("__native.onTranslate($q, ${JSONObject.quote(out)}, null)")
                            }
                            .addOnFailureListener { e ->
                                js("__native.onTranslate($q, null, ${JSONObject.quote(e.message ?: "error")})")
                            }
                    }
                    .addOnFailureListener { e ->
                        js("__native.onTranslate($q, null, ${JSONObject.quote(e.message ?: "download")})")
                    }
            }
        }

        /**
         * Download a text file (tries each URL in [urlsJson] in order) into app storage.
         * When done: __native.onDownload(cb, path|null, error). The file is then readable at
         * https://appassets.androidplatform.net/files/<path>.
         */
        @JavascriptInterface
        fun download(urlsJson: String, name: String, cb: String) {
            val safe = name.replace(Regex("[^A-Za-z0-9_.-]"), "_")
            Thread {
                var lastErr = "network"
                val urls = try { JSONArray(urlsJson) } catch (e: Exception) { JSONArray() }
                for (k in 0 until urls.length()) {
                    try {
                        var url = URL(urls.getString(k))
                        var conn: HttpURLConnection
                        var hops = 0
                        while (true) {
                            conn = url.openConnection() as HttpURLConnection
                            conn.connectTimeout = 15000
                            conn.readTimeout = 60000
                            conn.instanceFollowRedirects = false
                            conn.setRequestProperty("User-Agent", "EnglishArabi/1.0 (Android; reading app)")
                            val code = conn.responseCode
                            if (code in 300..399 && hops < 5) {
                                val loc = conn.getHeaderField("Location") ?: break
                                url = URL(url, loc); hops++; conn.disconnect(); continue
                            }
                            break
                        }
                        if (conn.responseCode != 200) { lastErr = "HTTP " + conn.responseCode; conn.disconnect(); continue }
                        val bytes = conn.inputStream.use { it.readBytes() }
                        conn.disconnect()
                        if (bytes.size > 15_000_000) { lastErr = "too big"; continue }
                        val text = String(bytes, Charsets.UTF_8)
                        if (text.length < 500 || text.take(400).contains("<html", ignoreCase = true)) { lastErr = "not a text file"; continue }
                        val dir = File(publicDir, "books").apply { mkdirs() }
                        File(dir, "$safe.txt").writeText(text)
                        js("__native.onDownload(${JSONObject.quote(cb)}, ${JSONObject.quote("books/$safe.txt")}, null)")
                        return@Thread
                    } catch (e: Exception) {
                        lastErr = e.message ?: "error"
                    }
                }
                js("__native.onDownload(${JSONObject.quote(cb)}, null, ${JSONObject.quote(lastErr)})")
            }.start()
        }

        @JavascriptInterface
        fun deleteFile(path: String) {
            if (path.contains("..")) return
            File(publicDir, path).delete()
        }

        /** Launch speech recognition. lang = "en-US". Results -> __native.onSpeech(cb, [alternatives]). */
        @JavascriptInterface
        fun listen(lang: String, cb: String) {
            main.post {
                pendingSpeechCb = cb
                val i = Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH).apply {
                    putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM)
                    putExtra(RecognizerIntent.EXTRA_LANGUAGE, lang)
                    putExtra(RecognizerIntent.EXTRA_MAX_RESULTS, 5)
                    putExtra(RecognizerIntent.EXTRA_PROMPT, "Speak now… تكلّم الآن")
                }
                try {
                    speechLauncher.launch(i)
                } catch (_: Exception) {
                    pendingSpeechCb = null
                    js("__native.onSpeech(${JSONObject.quote(cb)}, null)")
                }
            }
        }
    }

    override fun onPause() {
        super.onPause()
        tts?.stop()
        if (::web.isInitialized) {
            web.evaluateJavascript("window.onAppPause && onAppPause()", null)
            web.onPause()
        }
    }

    override fun onResume() {
        super.onResume()
        if (::web.isInitialized) {
            web.onResume()
            web.evaluateJavascript("window.onAppResume && onAppResume()", null)
        }
    }

    override fun onDestroy() {
        tts?.shutdown()
        if (::web.isInitialized) web.destroy()
        super.onDestroy()
    }
}
