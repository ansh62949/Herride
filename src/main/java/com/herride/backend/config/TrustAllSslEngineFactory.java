package com.herride.backend.config;

import org.apache.kafka.common.security.auth.SslEngineFactory;
import javax.net.ssl.*;
import java.io.IOException;
import java.security.KeyStore;
import java.security.SecureRandom;
import java.security.cert.X509Certificate;
import java.util.Collections;
import java.util.Map;
import java.util.Set;

public class TrustAllSslEngineFactory implements SslEngineFactory {
    private SSLContext sslContext;

    @Override
    public void configure(Map<String, ?> configs) {
        try {
            sslContext = SSLContext.getInstance("TLS");
            TrustManager[] trustAllCerts = new TrustManager[]{
                new X509TrustManager() {
                    public X509Certificate[] getAcceptedIssuers() {
                        return new X509Certificate[0];
                    }
                    public void checkClientTrusted(X509Certificate[] certs, String authType) {}
                    public void checkServerTrusted(X509Certificate[] certs, String authType) {}
                }
            };
            sslContext.init(null, trustAllCerts, new SecureRandom());
        } catch (Exception e) {
            throw new RuntimeException("Failed to initialize SSLContext in TrustAllSslEngineFactory", e);
        }
    }

    @Override
    public SSLEngine createClientSslEngine(String peerHost, int peerPort, String endpointIdentification) {
        SSLEngine sslEngine = sslContext.createSSLEngine(peerHost, peerPort);
        sslEngine.setUseClientMode(true);
        return sslEngine;
    }

    @Override
    public SSLEngine createServerSslEngine(String peerHost, int peerPort) {
        SSLEngine sslEngine = sslContext.createSSLEngine(peerHost, peerPort);
        sslEngine.setUseClientMode(false);
        return sslEngine;
    }

    @Override
    public boolean shouldBeRebuilt(Map<String, Object> nextConfigs) {
        return false;
    }

    @Override
    public KeyStore keystore() {
        return null;
    }

    @Override
    public KeyStore truststore() {
        return null;
    }

    @Override
    public Set<String> reconfigurableConfigs() {
        return Collections.emptySet();
    }

    @Override
    public void close() throws IOException {}
}
