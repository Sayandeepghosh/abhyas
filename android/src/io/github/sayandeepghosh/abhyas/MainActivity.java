package io.github.sayandeepghosh.abhyas;

import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.graphics.Color;
import android.graphics.Insets;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.view.View;
import android.view.WindowInsets;
import android.view.WindowInsetsController;
import android.view.WindowManager;
import android.webkit.JavascriptInterface;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.FrameLayout;
import android.widget.Toast;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.HashSet;
import java.util.Set;

/** Offline-only shell. Only packaged assets can execute in the bridged WebView. */
public final class MainActivity extends Activity {
    private static final String HOST = "appassets.androidplatform.net";
    private static final String BASE = "https://" + HOST + "/assets/www/";
    private static final int IMPORT = 21, EXPORT = 22;
    private static final int MAX_EXPORT_BYTES = 32 * 1024 * 1024;
    private static final Set<String> ASSETS = new HashSet<>(Arrays.asList(
        "index.html", "styles.css", "design.css", "theme.js", "data.js", "app.js",
        "icon.svg", "icon-192.png", "icon-512.png", "study-art.svg", "manifest.webmanifest"));
    private WebView web;
    private FrameLayout frame;
    private ValueCallback<Uri[]> importResult;
    private byte[] exportBytes;

    @Override public void onCreate(Bundle state) {
        super.onCreate(state);
        frame = new FrameLayout(this);
        frame.setBackgroundColor(Color.WHITE);
        web = new WebView(this);
        frame.addView(web, new FrameLayout.LayoutParams(-1, -1));
        setContentView(frame);
        if (Build.VERSION.SDK_INT >= 30) {
            getWindow().setDecorFitsSystemWindows(false);
            frame.setOnApplyWindowInsetsListener((v, insets) -> {
                Insets safe = insets.getInsets(WindowInsets.Type.systemBars() | WindowInsets.Type.displayCutout() | WindowInsets.Type.ime());
                frame.setPadding(safe.left, safe.top, safe.right, safe.bottom);
                return WindowInsets.CONSUMED;
            });
        }
        WebView.setWebContentsDebuggingEnabled(false);
        WebSettings settings = web.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setAllowFileAccess(false);
        settings.setAllowContentAccess(true); // User-selected imports from the system document picker.
        settings.setAllowFileAccessFromFileURLs(false);
        settings.setAllowUniversalAccessFromFileURLs(false);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        settings.setBlockNetworkLoads(true);
        settings.setSupportMultipleWindows(false);
        settings.setJavaScriptCanOpenWindowsAutomatically(false);
        settings.setMediaPlaybackRequiresUserGesture(true);
        settings.setSafeBrowsingEnabled(true);
        web.addJavascriptInterface(new Bridge(), "AbhyasAndroid");
        web.setWebViewClient(new WebViewClient() {
            @Override public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                Uri uri = request.getUrl();
                if ("GET".equals(request.getMethod()) && trusted(uri)) {
                    String name = uri.getPath().substring("/assets/www/".length());
                    if (name.isEmpty()) name = "index.html";
                    if (ASSETS.contains(name)) {
                        try { return new WebResourceResponse(mime(name), "UTF-8", getAssets().open("www/" + name)); }
                        catch (IOException ignored) { }
                    }
                }
                return new WebResourceResponse("text/plain", "UTF-8", 403, "Blocked", null,
                    new ByteArrayInputStream("Unavailable".getBytes(StandardCharsets.UTF_8)));
            }
            @Override public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                Uri uri = request.getUrl();
                if (trusted(uri) && ("/assets/www/index.html".equals(uri.getPath()) || "/assets/www/".equals(uri.getPath()))) return false;
                if (request.isForMainFrame() && request.hasGesture() && "https".equals(uri.getScheme()) && !HOST.equals(uri.getHost())) {
                    try { startActivity(new Intent(Intent.ACTION_VIEW, uri).addCategory(Intent.CATEGORY_BROWSABLE)); }
                    catch (ActivityNotFoundException ignored) { message("No browser is available to open this link."); }
                }
                return true;
            }
        });
        web.setWebChromeClient(new WebChromeClient() {
            @Override public boolean onShowFileChooser(WebView view, ValueCallback<Uri[]> callback, FileChooserParams params) {
                if (importResult != null) importResult.onReceiveValue(null);
                importResult = callback;
                Intent picker = new Intent(Intent.ACTION_OPEN_DOCUMENT).addCategory(Intent.CATEGORY_OPENABLE).setType("*/*");
                picker.putExtra(Intent.EXTRA_MIME_TYPES, new String[]{"application/json", "text/plain", "application/octet-stream"});
                try { startActivityForResult(picker, IMPORT); }
                catch (ActivityNotFoundException ignored) { importResult.onReceiveValue(null); importResult = null; message("No document picker is available."); }
                return true;
            }
        });
        web.loadUrl(BASE + "index.html");
    }

    private static boolean trusted(Uri uri) {
        return "https".equals(uri.getScheme()) && HOST.equals(uri.getHost()) && uri.getPort() == -1
            && uri.getUserInfo() == null && uri.getPath() != null && uri.getPath().startsWith("/assets/www/");
    }
    private static String mime(String name) {
        if (name.endsWith(".html")) return "text/html";
        if (name.endsWith(".js")) return "application/javascript";
        if (name.endsWith(".css")) return "text/css";
        if (name.endsWith(".svg")) return "image/svg+xml";
        if (name.endsWith(".png")) return "image/png";
        return "application/manifest+json";
    }
    private void message(String text) { Toast.makeText(this, text, Toast.LENGTH_LONG).show(); }
    private void applyTheme(String theme) {
        boolean dark = "dark".equals(theme);
        int color = Color.parseColor(dark ? "#141b1d" : "#ffffff");
        frame.setBackgroundColor(color);
        web.setBackgroundColor(color);
        getWindow().setStatusBarColor(color);
        getWindow().setNavigationBarColor(color);
        if (Build.VERSION.SDK_INT >= 30) {
            WindowInsetsController controller = getWindow().getInsetsController();
            int flags = WindowInsetsController.APPEARANCE_LIGHT_STATUS_BARS | WindowInsetsController.APPEARANCE_LIGHT_NAVIGATION_BARS;
            if (controller != null) controller.setSystemBarsAppearance(dark ? 0 : flags, flags);
        } else {
            getWindow().getDecorView().setSystemUiVisibility(dark ? 0 : View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR | View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR);
        }
    }
    public final class Bridge {
        @JavascriptInterface public void setTheme(String theme) {
            if ("dark".equals(theme) || "light".equals(theme)) runOnUiThread(() -> applyTheme(theme));
        }
        @JavascriptInterface public void keepAwake(boolean enabled) {
            runOnUiThread(() -> {
                if (enabled) getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
                else getWindow().clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
            });
        }
        @JavascriptInterface public void saveFile(String name, String content, String type) {
            if (name == null || content == null || content.length() > MAX_EXPORT_BYTES) return;
            if (!("application/json".equals(type) || "text/plain".equals(type))) return;
            byte[] bytes = content.getBytes(StandardCharsets.UTF_8);
            if (bytes.length > MAX_EXPORT_BYTES) { runOnUiThread(() -> message("This export is too large.")); return; }
            String safeName = name.replaceAll("[^a-zA-Z0-9._-]", "_");
            if (safeName.length() > 180) safeName = safeName.substring(0, 180);
            final String fileName = safeName;
            runOnUiThread(() -> {
                if (exportBytes != null) { message("Finish the current export first."); return; }
                exportBytes = bytes;
                Intent picker = new Intent(Intent.ACTION_CREATE_DOCUMENT).addCategory(Intent.CATEGORY_OPENABLE).setType(type);
                picker.putExtra(Intent.EXTRA_TITLE, fileName);
                try { startActivityForResult(picker, EXPORT); }
                catch (ActivityNotFoundException ignored) { exportBytes = null; message("No document picker is available."); }
            });
        }
    }
    @Override protected void onActivityResult(int request, int result, Intent data) {
        super.onActivityResult(request, result, data);
        Uri uri = result == RESULT_OK && data != null ? data.getData() : null;
        if (request == IMPORT && importResult != null) {
            importResult.onReceiveValue(uri == null ? null : new Uri[]{uri}); importResult = null;
        } else if (request == EXPORT) {
            final byte[] bytes = exportBytes; exportBytes = null;
            if (uri == null) return;
            if (bytes == null) { message("Export interrupted. Please export again."); return; }
            new Thread(() -> {
                try (OutputStream out = getContentResolver().openOutputStream(uri, "wt")) {
                    if (out == null) throw new IOException("No output stream");
                    out.write(bytes);
                    runOnUiThread(() -> message("Export saved."));
                } catch (IOException | SecurityException error) {
                    runOnUiThread(() -> message("Could not save the export. Please try another folder."));
                }
            }, "Abhyas-export").start();
        }
    }
    @Override public void onBackPressed() {
        web.evaluateJavascript("(()=>{const d=document.querySelector('dialog[open]');if(d){d.close();return true}const s=document.getElementById('sidebar');if(s&&s.classList.contains('open')){closeNavigation();return true}if(location.hash!=='#dashboard'){location.hash='dashboard';return true}return false})()", handled -> {
            if (!"true".equals(handled)) MainActivity.super.onBackPressed();
        });
    }
    @Override protected void onPause() { web.onPause(); super.onPause(); }
    @Override protected void onResume() { super.onResume(); if (web != null) web.onResume(); }
    @Override protected void onDestroy() {
        if (importResult != null) importResult.onReceiveValue(null);
        exportBytes = null;
        web.removeJavascriptInterface("AbhyasAndroid");
        web.destroy();
        super.onDestroy();
    }
}
