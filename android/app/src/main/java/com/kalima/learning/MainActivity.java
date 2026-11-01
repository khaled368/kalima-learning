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
    if (webView != null) {
      webView.stopLoading();
      webView.destroy();
      webView = null;
    }
    super.onDestroy();
  }
}
