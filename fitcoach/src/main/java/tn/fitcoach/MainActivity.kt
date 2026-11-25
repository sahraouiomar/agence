package tn.fitcoach

import android.Manifest
import android.annotation.SuppressLint
import android.content.Intent
import android.content.pm.PackageManager
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.ImageDecoder
import android.media.MediaMetadataRetriever
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.provider.MediaStore
import android.speech.tts.TextToSpeech
import android.util.Base64
import android.webkit.JavascriptInterface
import android.webkit.PermissionRequest
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
import com.google.android.gms.tasks.Tasks
import com.google.mlkit.vision.barcode.BarcodeScanning
import com.google.mlkit.vision.common.InputImage
import com.google.mlkit.vision.objects.ObjectDetection
import com.google.mlkit.vision.objects.defaults.ObjectDetectorOptions
import com.google.mlkit.vision.label.ImageLabeling
import com.google.mlkit.vision.label.defaults.ImageLabelerOptions
import com.google.mlkit.vision.pose.PoseDetection
import com.google.mlkit.vision.pose.PoseDetector
import com.google.mlkit.vision.pose.defaults.PoseDetectorOptions
import org.json.JSONArray
import org.json.JSONObject
import java.io.ByteArrayOutputStream
import java.net.HttpURLConnection
import java.net.URL
import java.util.Locale
import java.util.concurrent.Executors

/**
 * Hosts the web UI (assets/www) and exposes native, on-device AI to it through `window.Android`:
 *  - Food photo -> ML Kit image labelling (labels are matched to the nutrition database in JS)
 *  - Exercise video -> ML Kit pose detection frame by frame (33 body points), analysed in JS
 *  - Live camera frames (getUserMedia in the WebView) -> pose detection for real-time correction
 *  - Text-to-speech for spoken coaching cues (fr / en / ar)
 */
class MainActivity : AppCompatActivity(), TextToSpeech.OnInitListener {

    private lateinit var web: WebView
    private var tts: TextToSpeech? = null
    private val main = Handler(Looper.getMainLooper())
    private val worker = Executors.newSingleThreadExecutor()
    private val net = Executors.newFixedThreadPool(2)
    private var pendingImageCb: String? = null
    private var pendingImageSource = "camera"
    private var pendingVideoCb: String? = null
    private var pendingWebCam: PermissionRequest? = null
    private var lastVideo: Uri? = null

    private val streamPose: PoseDetector by lazy {
        PoseDetection.getClient(
            PoseDetectorOptions.Builder().setDetectorMode(PoseDetectorOptions.STREAM_MODE).build()
        )
    }
    private val imagePose: PoseDetector by lazy {
        PoseDetection.getClient(
            PoseDetectorOptions.Builder().setDetectorMode(PoseDetectorOptions.SINGLE_IMAGE_MODE).build()
        )
    }
    private val labeler by lazy {
        ImageLabeling.getClient(ImageLabelerOptions.Builder().setConfidenceThreshold(0.35f).build())
    }
    private val barcodes by lazy { BarcodeScanning.getClient() }
    private val objects by lazy {
        ObjectDetection.getClient(
            ObjectDetectorOptions.Builder()
                .setDetectorMode(ObjectDetectorOptions.SINGLE_IMAGE_MODE)
                .enableMultipleObjects()
                .enableClassification()
                .build()
        )
    }

    // --- activity results -------------------------------------------------------------------

    private val takePhoto =
        registerForActivityResult(ActivityResultContracts.TakePicturePreview()) { bmp ->
            val cb = pendingImageCb ?: return@registerForActivityResult
            pendingImageCb = null
            if (bmp == null) imageResult(cb, null, "cancel") else worker.execute { analyzeFood(cb, bmp) }
        }

    private val pickImage =
        registerForActivityResult(ActivityResultContracts.GetContent()) { uri ->
            val cb = pendingImageCb ?: return@registerForActivityResult
            pendingImageCb = null
            if (uri == null) { imageResult(cb, null, "cancel"); return@registerForActivityResult }
            worker.execute {
                try { analyzeFood(cb, decode(uri)) } catch (e: Exception) { imageResult(cb, null, e.message ?: "error") }
            }
        }

    private val pickVideo =
        registerForActivityResult(ActivityResultContracts.GetContent()) { uri ->
            val cb = pendingVideoCb ?: return@registerForActivityResult
            pendingVideoCb = null
            if (uri == null) { js("__native.onVideo(${q(cb)}, null, 'cancel')"); return@registerForActivityResult }
            lastVideo = uri
            worker.execute { analyzeVideo(cb, uri) }
        }

    private val cameraPermission =
        registerForActivityResult(ActivityResultContracts.RequestPermission()) { granted ->
            pendingWebCam?.let { req ->
                pendingWebCam = null
                if (granted) req.grant(arrayOf(PermissionRequest.RESOURCE_VIDEO_CAPTURE)) else req.deny()
            }
            pendingImageCb?.let { cb ->
                if (pendingImageSource == "camera") {
                    if (granted) takePhoto.launch(null) else { pendingImageCb = null; imageResult(cb, null, "permission") }
                }
            }
        }

    // --- setup ------------------------------------------------------------------------------

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        tts = TextToSpeech(this, this)

        val loader = WebViewAssetLoader.Builder()
            .addPathHandler("/assets/", WebViewAssetLoader.AssetsPathHandler(this))
            .build()

        web = WebView(this)
        web.settings.javaScriptEnabled = true
        web.settings.domStorageEnabled = true
        web.settings.mediaPlaybackRequiresUserGesture = false
        web.settings.textZoom = 100
        web.webViewClient = object : WebViewClient() {
            override fun shouldInterceptRequest(view: WebView, request: WebResourceRequest): WebResourceResponse? =
                loader.shouldInterceptRequest(request.url)

            override fun shouldOverrideUrlLoading(view: WebView, request: WebResourceRequest): Boolean {
                val url = request.url
                if (url.host == "appassets.androidplatform.net") return false
                openExternal(url.toString()); return true
            }
        }
        web.webChromeClient = object : WebChromeClient() {
            override fun onPermissionRequest(request: PermissionRequest) {
                runOnUiThread {
                    if (!request.resources.contains(PermissionRequest.RESOURCE_VIDEO_CAPTURE)) {
                        request.deny(); return@runOnUiThread
                    }
                    if (hasCamera()) request.grant(arrayOf(PermissionRequest.RESOURCE_VIDEO_CAPTURE))
                    else { pendingWebCam = request; cameraPermission.launch(Manifest.permission.CAMERA) }
                }
            }
        }
        web.addJavascriptInterface(Bridge(), "Android")
        setContentView(web)
        web.loadUrl("https://appassets.androidplatform.net/assets/www/index.html")

        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                web.evaluateJavascript("window.__native ? __native.onBack() : false") { r ->
                    if (r != "true") finish()
                }
            }
        })
    }

    override fun onInit(status: Int) {}

    private fun hasCamera() =
        ContextCompat.checkSelfPermission(this, Manifest.permission.CAMERA) == PackageManager.PERMISSION_GRANTED

    private fun q(s: String) = JSONObject.quote(s)

    private fun js(code: String) {
        main.post { web.evaluateJavascript(code, null) }
    }

    private fun openExternal(url: String) {
        try { startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(url))) } catch (_: Exception) {}
    }

    private fun decode(uri: Uri): Bitmap {
        val bmp = if (Build.VERSION.SDK_INT >= 28) {
            ImageDecoder.decodeBitmap(ImageDecoder.createSource(contentResolver, uri)) { d, info, _ ->
                d.allocator = ImageDecoder.ALLOCATOR_SOFTWARE
                val s = info.size
                val k = 1024f / maxOf(s.width, s.height)
                if (k < 1f) d.setTargetSize((s.width * k).toInt(), (s.height * k).toInt())
            }
        } else {
            @Suppress("DEPRECATION")
            MediaStore.Images.Media.getBitmap(contentResolver, uri)
        }
        return scale(bmp, 1024)
    }

    private fun scale(b: Bitmap, max: Int): Bitmap {
        val k = max.toFloat() / maxOf(b.width, b.height)
        return if (k >= 1f) b else Bitmap.createScaledBitmap(b, (b.width * k).toInt(), (b.height * k).toInt(), true)
    }

    private fun dataUrl(b: Bitmap, quality: Int = 75): String {
        val out = ByteArrayOutputStream()
        b.compress(Bitmap.CompressFormat.JPEG, quality, out)
        return "data:image/jpeg;base64," + Base64.encodeToString(out.toByteArray(), Base64.NO_WRAP)
    }

    // --- food photo ---------------------------------------------------------------------------

    private fun imageResult(cb: String, json: JSONObject?, err: String?) =
        js("__native.onImage(${q(cb)}, ${json ?: "null"}, ${if (err == null) "null" else q(err)})")

    private fun labelsOf(bmp: Bitmap): JSONArray {
        val arr = JSONArray()
        try {
            Tasks.await(labeler.process(InputImage.fromBitmap(bmp, 0))).forEach {
                arr.put(JSONObject().put("text", it.text).put("conf", it.confidence.toDouble()))
            }
        } catch (_: Exception) {}
        return arr
    }

    /**
     * Runs on [worker]. One photo -> whole-image labels, barcodes (packaged products) and the
     * separate items found on the plate, each with its own labels and a small thumbnail.
     */
    private fun analyzeFood(cb: String, bmp: Bitmap) {
        try {
            val img = InputImage.fromBitmap(bmp, 0)
            val codes = JSONArray()
            try {
                Tasks.await(barcodes.process(img)).forEach { b -> b.rawValue?.let { codes.put(it) } }
            } catch (_: Exception) {}
            val items = JSONArray()
            try {
                val found = Tasks.await(objects.process(img))
                    .filter { it.boundingBox.width() * it.boundingBox.height() > bmp.width * bmp.height * 0.03 }
                    .sortedByDescending { it.boundingBox.width() * it.boundingBox.height() }
                    .take(6)
                for (o in found) {
                    val r = o.boundingBox
                    val x = r.left.coerceIn(0, bmp.width - 1); val y = r.top.coerceIn(0, bmp.height - 1)
                    val w = r.width().coerceAtMost(bmp.width - x); val h = r.height().coerceAtMost(bmp.height - y)
                    if (w < 16 || h < 16) continue
                    val crop = Bitmap.createBitmap(bmp, x, y, w, h)
                    items.put(
                        JSONObject()
                            .put("box", JSONArray().put(x.toDouble() / bmp.width).put(y.toDouble() / bmp.height)
                                .put(w.toDouble() / bmp.width).put(h.toDouble() / bmp.height))
                            .put("labels", labelsOf(crop))
                            .put("thumb", dataUrl(scale(crop, 200), 70))
                    )
                }
            } catch (_: Exception) {}
            val res = JSONObject()
                .put("img", dataUrl(scale(bmp, 1024), 80))
                .put("labels", labelsOf(bmp))
                .put("barcodes", codes)
                .put("items", items)
            imageResult(cb, res, null)
        } catch (e: Exception) {
            imageResult(cb, null, e.message ?: "error")
        }
    }

    private fun httpGet(url: String): String {
        val c = URL(url).openConnection() as HttpURLConnection
        c.connectTimeout = 12000; c.readTimeout = 15000
        c.setRequestProperty("User-Agent", "FitCoach/2.0 (Android)")
        c.setRequestProperty("Accept", "application/json")
        try {
            if (c.responseCode !in 200..299) throw Exception("HTTP " + c.responseCode)
            return c.inputStream.bufferedReader().use { it.readText() }
        } finally { c.disconnect() }
    }

    // --- pose -------------------------------------------------------------------------------

    private fun poseJson(detector: PoseDetector, bmp: Bitmap): JSONArray? {
        val pose = Tasks.await(detector.process(InputImage.fromBitmap(bmp, 0)))
        val lms = pose.allPoseLandmarks
        if (lms.isEmpty()) return null
        val arr = JSONArray()
        for (i in 0 until 33) {
            val lm = pose.getPoseLandmark(i)
            if (lm == null) { arr.put(JSONArray().put(0).put(0).put(0)); continue }
            arr.put(
                JSONArray()
                    .put(Math.round(lm.position.x / bmp.width * 10000) / 10000.0)
                    .put(Math.round(lm.position.y / bmp.height * 10000) / 10000.0)
                    .put(Math.round(lm.inFrameLikelihood * 100) / 100.0)
            )
        }
        return arr
    }

    private fun analyzeVideo(cb: String, uri: Uri) {
        val r = MediaMetadataRetriever()
        try {
            r.setDataSource(this, uri)
            val dur = r.extractMetadata(MediaMetadataRetriever.METADATA_KEY_DURATION)?.toLongOrNull() ?: 0L
            val limit = minOf(dur, 60_000L)
            val step = maxOf(150L, limit / 160)
            val frames = JSONArray()
            var w = 0; var h = 0
            var t = 0L
            while (t <= limit) {
                val raw = r.getFrameAtTime(t * 1000, MediaMetadataRetriever.OPTION_CLOSEST)
                if (raw != null) {
                    val bmp = scale(raw, 480)
                    w = bmp.width; h = bmp.height
                    val lm = try { poseJson(imagePose, bmp) } catch (_: Exception) { null }
                    frames.put(JSONObject().put("t", t).put("lm", lm ?: JSONObject.NULL))
                }
                val pct = if (limit == 0L) 100 else (t * 100 / limit)
                js("__native.onVideoProgress(${q(cb)}, $pct)")
                t += step
            }
            val res = JSONObject().put("duration", dur).put("w", w).put("h", h).put("frames", frames)
            js("__native.onVideo(${q(cb)}, $res, null)")
        } catch (e: Exception) {
            js("__native.onVideo(${q(cb)}, null, ${q(e.message ?: "error")})")
        } finally {
            try { r.release() } catch (_: Exception) {}
        }
    }

    // --- JS bridge ----------------------------------------------------------------------------

    inner class Bridge {
        @JavascriptInterface
        fun speak(text: String, lang: String) {
            main.post {
                val loc = when (lang) { "ar" -> Locale("ar"); "en" -> Locale.US; else -> Locale.FRENCH }
                tts?.language = loc
                tts?.speak(text, TextToSpeech.QUEUE_FLUSH, null, "cue")
            }
        }

        @JavascriptInterface
        fun stopSpeak() { main.post { tts?.stop() } }

        @JavascriptInterface
        fun openUrl(url: String) { main.post { openExternal(url) } }

        /** source = "camera" | "gallery". Result -> __native.onImage(cb, {img, labels}, err) */
        @JavascriptInterface
        fun pickImage(source: String, cb: String) {
            main.post {
                pendingImageCb = cb
                pendingImageSource = source
                if (source == "gallery") pickImage.launch("image/*")
                else if (hasCamera()) takePhoto.launch(null)
                else cameraPermission.launch(Manifest.permission.CAMERA)
            }
        }

        /** Result -> __native.onVideo(cb, {duration,w,h,frames:[{t,lm}]}, err) */
        @JavascriptInterface
        fun pickVideo(cb: String) {
            main.post { pendingVideoCb = cb; pickVideo.launch("video/*") }
        }

        /** JPEG data URL of the last analysed video at time t (ms). Blocking. */
        @JavascriptInterface
        fun videoFrame(t: Long): String {
            val uri = lastVideo ?: return ""
            val r = MediaMetadataRetriever()
            return try {
                r.setDataSource(this@MainActivity, uri)
                val b = r.getFrameAtTime(t * 1000, MediaMetadataRetriever.OPTION_CLOSEST) ?: return ""
                dataUrl(scale(b, 640), 80)
            } catch (_: Exception) { "" } finally { try { r.release() } catch (_: Exception) {} }
        }

        /** Live camera frame (JPEG data URL) -> landmarks JSON "[[x,y,v],...]" or "null". Blocking. */
        @JavascriptInterface
        fun poseFrame(data: String): String {
            return try {
                val bytes = Base64.decode(data.substringAfter(","), Base64.DEFAULT)
                val bmp = BitmapFactory.decodeByteArray(bytes, 0, bytes.size) ?: return "null"
                poseJson(streamPose, bmp)?.toString() ?: "null"
            } catch (_: Exception) { "null" }
        }

        /** GET a public JSON API (Open Food Facts). Result -> __native.onHttp(cb, text, err) */
        @JavascriptInterface
        fun get(url: String, cb: String) {
            if (!url.startsWith("https://")) { js("__native.onHttp(${q(cb)}, null, 'url')"); return }
            net.execute {
                try { js("__native.onHttp(${q(cb)}, ${q(httpGet(url))}, null)") }
                catch (e: Exception) { js("__native.onHttp(${q(cb)}, null, ${q(e.message ?: "network")})") }
            }
        }

        @JavascriptInterface
        fun isNative(): Boolean = true
    }

    override fun onPause() {
        super.onPause()
        web.evaluateJavascript("window.__native && __native.onPause && __native.onPause()", null)
    }

    override fun onDestroy() {
        tts?.shutdown()
        worker.shutdownNow()
        net.shutdownNow()
        web.destroy()
        super.onDestroy()
    }
}
