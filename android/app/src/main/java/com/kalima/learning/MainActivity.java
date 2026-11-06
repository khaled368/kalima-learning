package com.kalima.learning;

import android.app.Activity;
import android.Manifest;
import android.content.pm.PackageManager;
import android.content.SharedPreferences;
import android.app.AlertDialog;
import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.graphics.Color;
import android.media.AudioAttributes;
import android.media.AudioManager;
import android.os.Handler;
import android.os.Looper;
import java.util.concurrent.atomic.AtomicBoolean;
import android.net.Uri;
import android.os.Bundle;
import android.view.Gravity;
import android.view.View;
import android.view.ViewGroup;
import android.webkit.CookieManager;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;
import android.speech.tts.TextToSpeech;
import android.speech.tts.UtteranceProgressListener;
import android.speech.tts.Voice;
import java.util.Locale;
import java.util.Set;
import android.widget.Button;
import android.widget.FrameLayout;
import android.widget.LinearLayout;
import android.widget.ProgressBar;
import android.widget.TextView;
import android.widget.Toast;

public final class MainActivity extends Activity {
  private static final String HOME = "https://khaled368.github.io/kalima-learning/";
  private static final String HOST = "khaled368.github.io";
  private static final String BASE_PATH = "/kalima-learning";
  private static final String ASSET_ROOT = "kalima/";
  private static final int REMINDER_REQUEST = 811;
  private WebView webView;
  private ProgressBar progress;
  private LinearLayout networkError;
  private TextToSpeech androidTts;
  private volatile boolean ttsReady = false;
  private volatile boolean ttsInitFailed = false;
  private final Handler speechHandler = new Handler(Looper.getMainLooper());
  private SpeechRequest waitingSpeech;
  private volatile int activeSpeechId = -1;
  private boolean speechHelpShown = false;

  private static final class SpeechRequest {
    final String text;
    final String language;
    final int id;
    SpeechRequest(String text, String language, int id) {
      this.text = text;
      this.language = language;
      this.id = id;
    }
  }

  private int dp(float amount) {
    return Math.round(amount * getResources().getDisplayMetrics().density);
  }

  @Override
  protected void onCreate(Bundle state) {
    super.onCreate(state);
    setVolumeControlStream(AudioManager.STREAM_MUSIC);
    getWindow().setStatusBarColor(Color.WHITE);
    getWindow().setNavigationBarColor(Color.WHITE);
    getWindow().getDecorView().setSystemUiVisibility(View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR);

    FrameLayout root = new FrameLayout(this);
    root.setBackgroundColor(Color.WHITE);
    webView = new WebView(this);
    webView.setBackgroundColor(Color.WHITE);
    root.addView(webView, new FrameLayout.LayoutParams(
        ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT));

    progress = new ProgressBar(this);
    FrameLayout.LayoutParams loadingParams = new FrameLayout.LayoutParams(
        dp(48), dp(48), Gravity.CENTER);
    root.addView(progress, loadingParams);

    networkError = makeErrorView();
    FrameLayout.LayoutParams errorParams = new FrameLayout.LayoutParams(
        ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT, Gravity.CENTER);
    errorParams.setMargins(dp(24), dp(24), dp(24), dp(24));
    root.addView(networkError, errorParams);
    networkError.setVisibility(View.GONE);
    setContentView(root);

    WebSettings settings = webView.getSettings();
    settings.setJavaScriptEnabled(true);
    settings.setDomStorageEnabled(true);
    settings.setDatabaseEnabled(true);
    settings.setAllowFileAccess(false);
    settings.setAllowContentAccess(false);
    settings.setJavaScriptCanOpenWindowsAutomatically(false);
    settings.setSupportMultipleWindows(false);
    settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
    settings.setMediaPlaybackRequiresUserGesture(true);
    settings.setCacheMode(WebSettings.LOAD_DEFAULT);
    settings.setSafeBrowsingEnabled(true);
    CookieManager.getInstance().setAcceptCookie(true);
    CookieManager.getInstance().setAcceptThirdPartyCookies(webView, false);

    // Minimal speech-only bridge. No filesystem, account or device-data methods.
    // External navigation never loads inside this WebView.
    webView.addJavascriptInterface(new KalimaSpeechBridge(), "KalimaAndroidTTS");
    webView.addJavascriptInterface(new ReminderBridge(), "KalimaDailyReminder");
    webView.addJavascriptInterface(new RankHapticsBridge(), "KalimaHaptics");
    DailyReminderReceiver.channel(this);
    DailyReminderReceiver.schedule(this);
    initializeSystemSpeech();

    // Keep the existing trusted HTTPS app origin and serve its complete UI
    // and learning content from inside the APK instead of the remote site.
    // Remote debugging is deliberately not enabled, even in this test APK,
    // because WebView may contain an authenticated learning account.
    webView.setWebChromeClient(new WebChromeClient() {
      @Override public void onProgressChanged(WebView view, int amount) {
        if (networkError.getVisibility() == View.GONE) {
          progress.setVisibility(amount >= 95 ? View.GONE : View.VISIBLE);
        }
      }
    });
    webView.setWebViewClient(new WebViewClient() {
      @Override public WebResourceResponse shouldInterceptRequest(
          WebView view, WebResourceRequest request) {
        Uri uri = request.getUrl();
        if (!isAppUrl(uri)) return null;
        return loadBundledAsset(uri);
      }

      @Override public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
        Uri uri = request.getUrl();
        if (isAppUrl(uri)) return false;
        openExternal(uri);
        return true;
      }

      @Override public void onPageStarted(WebView view, String url, android.graphics.Bitmap favicon) {
        networkError.setVisibility(View.GONE);
        progress.setVisibility(View.VISIBLE);
      }

      @Override public void onPageFinished(WebView view, String url) {
        progress.setVisibility(View.GONE);
      }

      @Override public void onReceivedError(
          WebView view, WebResourceRequest request, WebResourceError error) {
        if (request.isForMainFrame()) showNetworkError();
      }

      @Override public void onReceivedHttpError(
          WebView view, WebResourceRequest request, WebResourceResponse response) {
        if (request.isForMainFrame() && response.getStatusCode() >= 400) {
          showNetworkError();
        }
      }
    });
    webView.setDownloadListener((url, userAgent, contentDisposition, mimeType, length) ->
        openExternal(Uri.parse(url)));

    if (state != null && webView.restoreState(state) != null) {
      progress.setVisibility(View.GONE);
    } else {
      webView.loadUrl(HOME);
    }
  }

  private boolean isAppUrl(Uri uri) {
    String scheme = uri.getScheme();
    String host = uri.getHost();
    String path = uri.getPath();
    return "https".equalsIgnoreCase(scheme) && HOST.equalsIgnoreCase(host)
        && path != null && (BASE_PATH.equals(path) || path.startsWith(BASE_PATH + "/"));
  }

  // Bundle the entire trusted app origin (page, scripts, styles, lesson JSON,
  // and local speech resources). A missing file must not silently fall back
  // to remote website code with a potentially different release version.
  private WebResourceResponse loadBundledAsset(Uri uri) {
    String path = uri.getPath();
    if (path == null || !isAppUrl(uri)) return missingAsset();
    String relative = path.substring(BASE_PATH.length());
    if (relative.isEmpty() || "/".equals(relative)) relative = "/index.html";
    if (!relative.startsWith("/") || relative.indexOf('\\') >= 0) return missingAsset();
    relative = relative.substring(1);
    for (String segment : relative.split("/", -1)) {
      if (segment.isEmpty() || ".".equals(segment) || "..".equals(segment)) {
        return missingAsset();
      }
    }
    try {
      InputStream content = getAssets().open(ASSET_ROOT + relative);
      Map<String, String> headers = new HashMap<>();
      headers.put("Cache-Control", "no-store");
      headers.put("X-Content-Type-Options", "nosniff");
      String mime = contentType(relative);
      String encoding = mime.startsWith("text/")
          || "application/javascript".equals(mime) || "application/json".equals(mime)
              ? "UTF-8" : null;
      return new WebResourceResponse(mime, encoding, 200, "OK", headers, content);
    } catch (IOException error) {
      return missingAsset();
    }
  }

  private WebResourceResponse missingAsset() {
    Map<String, String> headers = new HashMap<>();
    headers.put("Cache-Control", "no-store");
    return new WebResourceResponse("text/plain", "UTF-8", 404, "Not Found",
        headers, new ByteArrayInputStream(
            "Bundled Kalima resource not found".getBytes(StandardCharsets.UTF_8)));
  }

  private String contentType(String filename) {
    String lower = filename.toLowerCase(Locale.ROOT);
    if (lower.endsWith(".html")) return "text/html";
    if (lower.endsWith(".css")) return "text/css";
    if (lower.endsWith(".js") || lower.endsWith(".mjs")) return "application/javascript";
    if (lower.endsWith(".json")) return "application/json";
    if (lower.endsWith(".svg")) return "image/svg+xml";
    if (lower.endsWith(".png")) return "image/png";
    if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
    if (lower.endsWith(".webp")) return "image/webp";
    if (lower.endsWith(".gif")) return "image/gif";
    if (lower.endsWith(".woff2")) return "font/woff2";
    if (lower.endsWith(".woff")) return "font/woff";
    if (lower.endsWith(".ttf")) return "font/ttf";
    if (lower.endsWith(".mp3")) return "audio/mpeg";
    if (lower.endsWith(".wav")) return "audio/wav";
    if (lower.endsWith(".pdf")) return "application/pdf";
    return "application/octet-stream";
  }

  private void openExternal(Uri uri) {
    String scheme = uri.getScheme();
    if (scheme == null || !(scheme.equalsIgnoreCase("https")
        || scheme.equalsIgnoreCase("http")
        || scheme.equalsIgnoreCase("mailto")
        || scheme.equalsIgnoreCase("tel"))) {
      Toast.makeText(this, "تعذّر فتح هذا النوع من الروابط", Toast.LENGTH_SHORT).show();
      return;
    }
    try {
      startActivity(new Intent(Intent.ACTION_VIEW, uri));
    } catch (ActivityNotFoundException error) {
      Toast.makeText(this, "تعذّر فتح الرابط", Toast.LENGTH_SHORT).show();
    }
  }

  private LinearLayout makeErrorView() {
    LinearLayout box = new LinearLayout(this);
    box.setOrientation(LinearLayout.VERTICAL);
    box.setGravity(Gravity.CENTER);
    box.setPadding(dp(22), dp(25), dp(22), dp(25));
    box.setBackgroundColor(Color.rgb(244, 250, 251));
    TextView title = new TextView(this);
    title.setText("تعذّر فتح تطبيق كلمة");
    title.setTextColor(Color.rgb(23, 52, 68));
    title.setTextSize(22);
    title.setGravity(Gravity.CENTER);
    box.addView(title, new LinearLayout.LayoutParams(
        ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT));
    TextView subtitle = new TextView(this);
    subtitle.setText("تحقّق من اتصال الإنترنت، ثم حاول مجددًا.");
    subtitle.setTextColor(Color.rgb(52, 80, 95));
    subtitle.setTextSize(16);
    subtitle.setGravity(Gravity.CENTER);
    LinearLayout.LayoutParams subtitleParams = new LinearLayout.LayoutParams(
        ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT);
    subtitleParams.topMargin = dp(12);
    subtitleParams.bottomMargin = dp(20);
    box.addView(subtitle, subtitleParams);

    Button retry = new Button(this);
    retry.setText("إعادة المحاولة");
    retry.setTextColor(Color.WHITE);
    retry.setAllCaps(false);
    retry.setBackgroundTintList(android.content.res.ColorStateList.valueOf(Color.rgb(16, 117, 113)));
    retry.setOnClickListener(v -> retryLoad());
    box.addView(retry, new LinearLayout.LayoutParams(
        ViewGroup.LayoutParams.MATCH_PARENT, dp(52)));
    return box;
  }

  private void showNetworkError() {
    progress.setVisibility(View.GONE);
    networkError.setVisibility(View.VISIBLE);
  }

  private void retryLoad() {
    networkError.setVisibility(View.GONE);
    progress.setVisibility(View.VISIBLE);
    String current = webView.getUrl();
    Uri uri = current != null ? Uri.parse(current) : null;
    webView.loadUrl(uri != null && isAppUrl(uri) ? current : HOME);
  }

  private void initializeSystemSpeech() {
    // TextToSpeech initializes asynchronously. The old build discarded taps
    // before initialization completed and silently fell back to WebView audio.
    androidTts = new TextToSpeech(this, status -> runOnUiThread(() -> {
      ttsReady = status == TextToSpeech.SUCCESS && androidTts != null;
      ttsInitFailed = !ttsReady;
      if (ttsReady) {
        androidTts.setSpeechRate(0.96f);
        androidTts.setPitch(1.0f);
        androidTts.setAudioAttributes(new AudioAttributes.Builder()
            .setUsage(AudioAttributes.USAGE_MEDIA)
            .setContentType(AudioAttributes.CONTENT_TYPE_SPEECH)
            .build());
      }
      if (waitingSpeech != null) {
        SpeechRequest request = waitingSpeech;
        waitingSpeech = null;
        if (ttsReady) playSpeech(request);
        else sendSpeechStatus(request.id, "engine-unavailable");
      }
    }));
  }

  private Locale speechLocale(String language) {
    switch (language) {
      case "de": return Locale.GERMANY;
      case "en": return Locale.US;
      case "nl": return new Locale("nl", "NL");
      case "ar": return new Locale("ar", "SA");
      default: return null;
    }
  }

  private boolean configureSpeechVoice(Locale locale) {
    if (androidTts == null) return false;
    int support = androidTts.isLanguageAvailable(locale);
    if (support == TextToSpeech.LANG_MISSING_DATA
        || support == TextToSpeech.LANG_NOT_SUPPORTED) return false;
    Voice best = null;
    int bestScore = Integer.MIN_VALUE;
    try {
      Set<Voice> voices = androidTts.getVoices();
      if (voices != null) {
        for (Voice voice : voices) {
          if (voice.getLocale() == null
              || !locale.getLanguage().equals(voice.getLocale().getLanguage())) continue;
          int score = voice.getQuality();
          if (locale.getCountry().equals(voice.getLocale().getCountry())) score += 100;
          if (!voice.isNetworkConnectionRequired()) score += 50;
          if (score > bestScore) {
            best = voice;
            bestScore = score;
          }
        }
      }
    } catch (RuntimeException ignored) {
      // Some speech engines do not enumerate installed voices.
    }
    if (best != null && androidTts.setVoice(best) == TextToSpeech.SUCCESS) return true;
    int fallback = androidTts.setLanguage(locale);
    return fallback != TextToSpeech.LANG_MISSING_DATA
        && fallback != TextToSpeech.LANG_NOT_SUPPORTED;
  }

  private void openSpeechSettings() {
    try {
      startActivity(new Intent("com.android.settings.TTS_SETTINGS"));
    } catch (ActivityNotFoundException notFound) {
      try {
        startActivity(new Intent(TextToSpeech.Engine.ACTION_INSTALL_TTS_DATA));
      } catch (ActivityNotFoundException unavailable) {
        startActivity(new Intent(android.provider.Settings.ACTION_ACCESSIBILITY_SETTINGS));
      }
    }
  }

  private void sendSpeechStatus(int requestId, String status) {
    runOnUiThread(() -> {
      if (webView == null) return;
      String code = "window.dispatchEvent(new CustomEvent('kalima-tts-status',"
          + "{detail:{id:" + requestId + ",status:'" + status + "'}}))";
      webView.evaluateJavascript(code, null);
      if (!speechHelpShown
          && ("no-voice".equals(status) || "engine-unavailable".equals(status))) {
        speechHelpShown = true;
        new AlertDialog.Builder(this)
            .setTitle("إعداد الصوت في كلمة")
            .setMessage("لم يعثر أندرويد على صوت نطق جاهز. افتح إعدادات تحويل النص إلى كلام، واختر محرك النطق وثبّت الصوت الألماني (Deutsch). وتأكد أيضًا من رفع مستوى صوت الوسائط.")
            .setPositiveButton("إعدادات الصوت", (dialog, which) -> openSpeechSettings())
            .setNegativeButton("لاحقًا", null)
            .show();
      }
    });
  }

  private void playSpeech(SpeechRequest request) {
    if (androidTts == null || !ttsReady) {
      sendSpeechStatus(request.id, "engine-unavailable");
      return;
    }
    Locale locale = speechLocale(request.language);
    if (locale == null || !configureSpeechVoice(locale)) {
      sendSpeechStatus(request.id, "no-voice");
      return;
    }
    activeSpeechId = request.id;
    final String requestId = Integer.toString(request.id);
    final AtomicBoolean retriedDefault = new AtomicBoolean(false);
    androidTts.setOnUtteranceProgressListener(new UtteranceProgressListener() {
      @Override public void onStart(String id) {
        if (requestId.equals(id) && activeSpeechId == request.id) {
          sendSpeechStatus(request.id, "playing");
        }
      }

      @Override public void onDone(String id) {
        if (requestId.equals(id) && activeSpeechId == request.id) {
          sendSpeechStatus(request.id, "finished");
        }
      }

      @Override public void onError(String id) { recoverVoiceOrReport(id); }

      @Override public void onError(String id, int errorCode) { recoverVoiceOrReport(id); }

      @Override public void onStop(String id, boolean interrupted) {
        if (requestId.equals(id) && activeSpeechId == request.id
            && !retriedDefault.get()) {
          sendSpeechStatus(request.id, "stopped");
        }
      }

      private void recoverVoiceOrReport(String id) {
        if (!requestId.equals(id)) return;
        speechHandler.post(() -> {
          if (activeSpeechId != request.id || androidTts == null) return;
          if (retriedDefault.compareAndSet(false, true)) {
            // An enhanced/network voice can fail when its data is unavailable.
            // Retry the default installed locale voice once before giving up.
            int available = androidTts.setLanguage(locale);
            if (available != TextToSpeech.LANG_MISSING_DATA
                && available != TextToSpeech.LANG_NOT_SUPPORTED) {
              if (androidTts.speak(request.text, TextToSpeech.QUEUE_FLUSH,
                  null, requestId) == TextToSpeech.SUCCESS) return;
            }
          }
          sendSpeechStatus(request.id, "error");
        });
      }
    });
    if (androidTts.speak(request.text, TextToSpeech.QUEUE_FLUSH,
        null, requestId) == TextToSpeech.ERROR) {
      sendSpeechStatus(request.id, "error");
    }
  }

  public final class KalimaSpeechBridge {
    @android.webkit.JavascriptInterface
    public void speak(String text, String language, int requestId) {
      if (text == null || text.trim().length() == 0 || text.length() > 2500
          || requestId < 0 || requestId > 100000000 || language == null) {
        sendSpeechStatus(requestId, "error");
        return;
      }
      if (speechLocale(language) == null) {
        sendSpeechStatus(requestId, "no-voice");
        return;
      }
      final SpeechRequest request = new SpeechRequest(text, language, requestId);
      runOnUiThread(() -> {
        if (ttsInitFailed) {
          sendSpeechStatus(request.id, "engine-unavailable");
        } else if (ttsReady && androidTts != null) {
          waitingSpeech = null;
          playSpeech(request);
        } else {
          waitingSpeech = request;
          // Do not silently hang forever if the OS voice engine is missing.
          speechHandler.postDelayed(() -> {
            if (waitingSpeech == request) {
              waitingSpeech = null;
              sendSpeechStatus(request.id, "engine-unavailable");
            }
          }, 8000);
        }
      });
    }

    @android.webkit.JavascriptInterface
    public void stop() {
      runOnUiThread(() -> {
        waitingSpeech = null;
        activeSpeechId = -1;
        if (androidTts != null) androidTts.stop();
      });
    }
  }

  /** One fixed, short vibration pattern for a real rank-up; no arbitrary timing input. */
  public final class RankHapticsBridge {
    @android.webkit.JavascriptInterface
    public void pulse() {
      runOnUiThread(() -> {
        android.os.Vibrator motor = (android.os.Vibrator) getSystemService(VIBRATOR_SERVICE);
        if (motor != null && motor.hasVibrator()) {
          motor.vibrate(android.os.VibrationEffect.createWaveform(
              new long[]{0, 65, 45, 135, 50, 135}, -1));
        }
      });
    }
  }

  /** Restricted reminder bridge; only preferences and word counts are writable. */
  public final class ReminderBridge {
    @android.webkit.JavascriptInterface
    public String getSettings(){
      SharedPreferences p=DailyReminderReceiver.prefs(MainActivity.this);
      return "{\"enabled\":"+p.getBoolean("enabled",false)+",\"hour\":"+p.getInt("hour",20)
          +",\"minute\":"+p.getInt("minute",0)+",\"permission\":"
          +DailyReminderReceiver.allowed(MainActivity.this)+"}";
    }
    @android.webkit.JavascriptInterface
    public void configure(boolean enabled,int hour,int minute,String lang){
      if(hour<0||hour>23||minute<0||minute>59)return;
      runOnUiThread(()->{
        DailyReminderReceiver.configure(MainActivity.this,enabled,hour,minute,lang);
        if(enabled && !DailyReminderReceiver.allowed(MainActivity.this)
            && android.os.Build.VERSION.SDK_INT>=33){
          requestPermissions(new String[]{Manifest.permission.POST_NOTIFICATIONS},REMINDER_REQUEST);
        } else sendReminderPermission(DailyReminderReceiver.allowed(MainActivity.this));
      });
    }
    @android.webkit.JavascriptInterface
    public void updateProgress(String day,int count,String lang){
      DailyReminderReceiver.progress(MainActivity.this,day,count,lang);
    }
  }
  private void sendReminderPermission(boolean granted){
    if(webView!=null)webView.evaluateJavascript("window.dispatchEvent(new CustomEvent("
       +"'kalima-reminder-permission',{detail:{granted:"+granted+"}}))",null);
  }
  @Override public void onRequestPermissionsResult(int requestCode,String[] permissions,int[] results){
    super.onRequestPermissionsResult(requestCode,permissions,results);
    if(requestCode!=REMINDER_REQUEST)return;
    boolean granted=results.length>0&&results[0]==PackageManager.PERMISSION_GRANTED;
    if(!granted){
      SharedPreferences p=DailyReminderReceiver.prefs(this);
      DailyReminderReceiver.configure(this,false,p.getInt("hour",20),p.getInt("minute",0),
          p.getString("lang","ar"));
    }
    sendReminderPermission(granted);
  }

  @Override
  public void onBackPressed() {
    if (webView == null) {
      super.onBackPressed();
      return;
    }
    // Android back closes an open website dialog first (including word details),
    // then returns to the vocabulary tab instead of unexpectedly exiting.
    String javascript = "(function(){"
        + "var dialogs=document.querySelectorAll('dialog[open]');"
        + "if(dialogs.length){var d=dialogs[dialogs.length-1];"
        + "var c=d.querySelector('#word-back,#training-close,#sources-close,"
        + ".dialog-close,.account-close,[data-close]');"
        + "if(c)c.click();else d.close();return 'handled';}"
        + "var panel=document.querySelector('section.panel:not([hidden]):not(#library-panel)');"
        + "var home=document.querySelector('.bottom-nav button[data-panel=\"library\"]');"
        + "if(panel&&home){home.click();return 'handled';}"
        + "return 'none';})()";
    webView.evaluateJavascript(javascript, result -> {
      if ("\"handled\"".equals(result)) return;
      if (webView != null && webView.canGoBack()) webView.goBack();
      else finish();
    });
  }

  @Override
  protected void onSaveInstanceState(Bundle state) {
    if (webView != null) webView.saveState(state);
    super.onSaveInstanceState(state);
  }

  @Override
  protected void onDestroy() {
    waitingSpeech = null;
    activeSpeechId = -1;
    speechHandler.removeCallbacksAndMessages(null);
    if (androidTts != null) {
      androidTts.stop();
      androidTts.shutdown();
      androidTts = null;
    }
    if (webView != null) {
      webView.stopLoading();
      webView.destroy();
      webView = null;
    }
    super.onDestroy();
  }
}
