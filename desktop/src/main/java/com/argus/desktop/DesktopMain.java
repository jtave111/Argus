package com.argus.desktop;

import javafx.application.Application;
import javafx.application.Platform;
import javafx.scene.Scene;
import javafx.scene.web.WebView;
import javafx.stage.Stage;

/**
 * Host desktop do Argus — abre uma janela nativa com um WebView (motor WebKit, mesma
 * família do Tauri no Linux) que carrega o frontend React servido localmente em 127.0.0.1.
 * O usuário vê um app desktop; não há URL exposta no navegador.
 */
public final class DesktopMain extends Application {

    private LocalWebServer web;

    @Override
    public void start(Stage stage) throws Exception {
        web = LocalWebServer.create();
        int port = web.start();

        WebView webView = new WebView();
        webView.setContextMenuEnabled(false);
        webView.getEngine().setJavaScriptEnabled(true);
        webView.getEngine().load(web.url());

        Scene scene = new Scene(webView, 1440, 900);
        stage.setTitle("Argus — Control Panel");
        stage.setScene(scene);
        stage.setMinWidth(1024);
        stage.setMinHeight(640);
        stage.centerOnScreen();
        stage.show();

        System.out.println("[Argus] frontend em " + web.url() + " (porta local " + port + ")");
    }

    @Override
    public void stop() {
        if (web != null) web.stop();
        Platform.exit();
    }

    public static void main(String[] args) {
        launch(args);
    }
}
