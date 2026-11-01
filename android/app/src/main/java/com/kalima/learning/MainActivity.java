package com.kalima.learning;

import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.graphics.Color;
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
  private WebView webView;
  private ProgressBar progress;
  private LinearLayout networkError;
  private TextToSpeech androidTts;
  private volatile boolean ttsReady = false;

  private int dp(float amount) {
    return Math.round(amount * getResources().getDisplayMetrics().density);
  }

  @Override
  protected void onCreate(Bundle state) {
    super.onCreate(state);
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
    initializeSystemSpeech();

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
    androidTts = new TextToSpeech(this, status -> {
      ttsReady = status == TextToSpeech.SUCCESS;
      if (ttsReady && androidTts != null) {
        androidTts.setSpeechRate(0.96f);
        androidTts.setPitch(1.0f);
      }
    });
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
    Set<Voice> voices = androidTts.getVoices();
    if (voices != null) {
      for (Voice voice : voices) {
        if (voice.getLocale() == null
            || !locale.getLanguage().equals(voice.getLocale().getLanguage())) continue;
        int score = voice.getQuality();
        if (locale.getCountry().equals(voice.getLocale().getCountry())) score += 100;
        if (voice.isNetworkConnectionRequired()) score += 25;
        if (score > bestScore) {
          best = voice;
          bestScore = score;
        }
      }
    }
    if (best != null && androidTts.setVoice(best) == TextToSpeech.SUCCESS) return true;
    return androidTts.setLanguage(locale) != TextToSpeech.LANG_NOT_SUPPORTED;
  }

  private void sendSpeechStatus(int requestId, String status) {
    runOnUiThread(() -> {
      if (webView == null) return;
      String code = "window.dispatchEvent(new CustomEvent('kalima-tts-status',"
          + "{detail:{id:" + requestId + ",status:'" + status + "'}}))";
      webView.evaluateJavascript(code, null);
    });
  }

  public final class KalimaSpeechBridge {
    @android.webkit.JavascriptInterface
    public void speak(String text, String language, int requestId) {
      if (text == null || text.trim().length() == 0 || text.length() > 2500
          || requestId < 0 || requestId > 100000000
          || language == null) {
        sendSpeechStatus(requestId, "error");
        return;
      }
      final Locale locale = speechLocale(language);
      if (locale == null) {
        sendSpeechStatus(requestId, "error");
        return;
      }
      runOnUiThread(() -> {
        if (!ttsReady || androidTts == null || !configureSpeechVoice(locale)) {
          sendSpeechStatus(requestId, "error");
          return;
        }
        final String id = Integer.toString(requestId);
        androidTts.setOnUtteranceProgressListener(new UtteranceProgressListener() {
          @Override public void onStart(String utteranceId) {
            if (id.equals(utteranceId)) sendSpeechStatus(requestId, "playing");
          }
          @Override public void onDone(String utteranceId) {
            if (id.equals(utteranceId)) sendSpeechStatus(requestId, "finished");
          }
          @Override public void onError(String utteranceId) {
            if (id.equals(utteranceId)) sendSpeechStatus(requestId, "error");
          }
          @Override public void onStop(String utteranceId, boolean interrupted) {
            if (id.equals(utteranceId)) sendSpeechStatus(requestId, "stopped");
          }
        });
        int result = androidTts.speak(text, TextToSpeech.QUEUE_FLUSH, null, id);
        if (result == TextToSpeech.ERROR) sendSpeechStatus(requestId, "error");
      });
    }

    @android.webkit.JavascriptInterface
    public void stop() {
      runOnUiThread(() -> {
        if (androidTts != null) androidTts.stop();
      });
    }
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
