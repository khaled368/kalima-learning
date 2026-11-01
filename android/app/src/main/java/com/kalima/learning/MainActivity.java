package com.kalima.learning;

import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.content.pm.ApplicationInfo;
import android.graphics.Color;
import android.net.Uri;
import android.os.Bundle;
import android.view.Gravity;
import android.view.View;
import android.view.ViewGroup;
import android.webkit.CookieManager;
import android.webkit.DownloadListener;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.FrameLayout;
import android.widget.ProgressBar;
import android.widget.Toast;

public final class MainActivity extends Activity {
  private static final String HOME = "https://khaled368.github.io/kalima-learning/";
  private static final String HOST = "khaled368.github.io";
  private static final String BASE_PATH = "/kalima-learning";
  private WebView webView;

  @Override
  protected void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);

    FrameLayout root = new FrameLayout(this);
    root.setBackgroundColor(Color.WHITE);
    webView = new WebView(this);
    webView.setBackgroundColor(Color.WHITE);
    root.addView(webView, new FrameLayout.LayoutParams(
        ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT));

    ProgressBar progress = new ProgressBar(this);
    FrameLayout.LayoutParams loading = new FrameLayout.LayoutParams(90, 90, Gravity.CENTER);
    root.addView(progress, loading);
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

    if ((getApplicationInfo().flags & ApplicationInfo.FLAG_DEBUGGABLE) != 0) {
      WebView.setWebContentsDebuggingEnabled(true);
    }
    webView.setWebChromeClient(new WebChromeClient() {
      @Override public void onProgressChanged(WebView view, int newProgress) {
        progress.setVisibility(newProgress >= 95 ? View.GONE : View.VISIBLE);
      }
    });
    webView.setWebViewClient(new WebViewClient() {
      @Override public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
        Uri uri = request.getUrl();
        if ("https".equalsIgnoreCase(uri.getScheme())
            && HOST.equalsIgnoreCase(uri.getHost())
            && (BASE_PATH.equals(uri.getPath()) || uri.getPath().startsWith(BASE_PATH + "/"))) {
          return false;
        }
        openExternal(uri);
        return true;
      }

      @Override public void onPageFinished(WebView view, String url) {
        progress.setVisibility(View.GONE);
      }
    });
    webView.setDownloadListener((url, userAgent, contentDisposition, mimeType, contentLength) -> {
      Uri uri = Uri.parse(url);
      if ("https".equalsIgnoreCase(uri.getScheme())) openExternal(uri);
    });

    if (savedInstanceState != null && webView.restoreState(savedInstanceState) != null) {
      progress.setVisibility(View.GONE);
    } else {
      webView.loadUrl(HOME);
    }
  }

  private void openExternal(Uri uri) {
    try {
      startActivity(new Intent(Intent.ACTION_VIEW, uri));
    } catch (ActivityNotFoundException error) {
      Toast.makeText(this, "تعذّر فتح الرابط", Toast.LENGTH_SHORT).show();
    }
  }

  @Override
  public void onBackPressed() {
    if (webView != null && webView.canGoBack()) webView.goBack();
    else super.onBackPressed();
  }

  @Override
  protected void onSaveInstanceState(Bundle outState) {
    if (webView != null) webView.saveState(outState);
    super.onSaveInstanceState(outState);
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
