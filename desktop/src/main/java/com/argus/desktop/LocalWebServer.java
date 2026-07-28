package com.argus.desktop;

import com.sun.net.httpserver.HttpServer;

import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.InetAddress;
import java.net.InetSocketAddress;
import java.net.URL;

/**
 * Servidor estático local para servir o renderer React (desktop/renderer/dist) empacotado nos
 * recursos do jar. Escuta apenas em 127.0.0.1 numa porta efêmera — <b>não é exposto</b> na
 * rede nem acessível por URL externa; só a janela JavaFX do desktop o carrega.
 */
public final class LocalWebServer {

    private static final String ROOT = "/web"; // recurso: build/resources/main/web
    private HttpServer server;
    private int port;

    public int start() throws IOException {
        server = HttpServer.create(new InetSocketAddress(InetAddress.getByName("127.0.0.1"), 0), 0);
        this.port = server.getAddress().getPort();
        server.createContext("/", exchange -> {
            String path = exchange.getRequestURI().getPath();
            if (path.equals("/") || path.isEmpty()) path = "/index.html";
            byte[] body = read(ROOT + path);
            if (body == null) {
                // SPA fallback: rotas do cliente devolvem o index.
                body = read(ROOT + "/index.html");
            }
            if (body == null) {
                exchange.sendResponseHeaders(404, -1);
                exchange.close();
                return;
            }
            exchange.getResponseHeaders().set("Content-Type", contentType(path));
            exchange.sendResponseHeaders(200, body.length);
            try (OutputStream os = exchange.getResponseBody()) {
                os.write(body);
            }
        });
        server.start();
        return port;
    }

    public int port() {
        return port;
    }

    public String url() {
        return "http://127.0.0.1:" + port + "/";
    }

    public void stop() {
        if (server != null) server.stop(0);
    }

    private static byte[] read(String resource) {
        URL u = LocalWebServer.class.getResource(resource);
        if (u == null) return null;
        try (InputStream in = u.openStream()) {
            return in.readAllBytes();
        } catch (IOException e) {
            return null;
        }
    }

    private static String contentType(String path) {
        if (path.endsWith(".html")) return "text/html; charset=utf-8";
        if (path.endsWith(".js")) return "text/javascript; charset=utf-8";
        if (path.endsWith(".css")) return "text/css; charset=utf-8";
        if (path.endsWith(".json")) return "application/json";
        if (path.endsWith(".svg")) return "image/svg+xml";
        if (path.endsWith(".png")) return "image/png";
        if (path.endsWith(".woff2")) return "font/woff2";
        if (path.endsWith(".woff")) return "font/woff";
        return "application/octet-stream";
    }

    private LocalWebServer() {
    }

    public static LocalWebServer create() {
        return new LocalWebServer();
    }
}
