package com.herride.backend.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.connection.RedisConnection;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.io.PrintWriter;
import java.io.StringWriter;
import java.net.URI;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/auth")
public class RedisDebugController {

    @Value("${spring.data.redis.host:localhost}")
    private String redisHost;

    @Value("${spring.data.redis.port:6379}")
    private int redisPort;

    @Value("${spring.data.redis.password:}")
    private String redisPassword;

    @Value("${REDIS_URL:}")
    private String redisUrlEnv;

    private final RedisConnectionFactory redisConnectionFactory;

    public RedisDebugController(RedisConnectionFactory redisConnectionFactory) {
        this.redisConnectionFactory = redisConnectionFactory;
    }

    @GetMapping("/redis-debug")
    public ResponseEntity<Map<String, Object>> debugRedis() {
        Map<String, Object> response = new HashMap<>();
        response.put("springHost", redisHost);
        response.put("springPort", redisPort);
        response.put("hasSpringPassword", redisPassword != null && !redisPassword.isEmpty());

        response.put("hasRedisUrlEnv", redisUrlEnv != null && !redisUrlEnv.isEmpty());
        if (redisUrlEnv != null && !redisUrlEnv.isEmpty()) {
            try {
                URI uri = new URI(redisUrlEnv);
                response.put("urlScheme", uri.getScheme());
                response.put("urlHost", uri.getHost());
                response.put("urlPort", uri.getPort());
                response.put("urlUserInfoPresent", uri.getUserInfo() != null);
            } catch (Exception e) {
                response.put("urlParseError", e.getMessage());
            }
        }

        // Test connection
        try {
            RedisConnection connection = redisConnectionFactory.getConnection();
            String pingResult = connection.ping();
            response.put("connectionSuccess", true);
            response.put("pingResult", pingResult);
            connection.close();
        } catch (Exception e) {
            response.put("connectionSuccess", false);
            response.put("errorMessage", e.getMessage());
            response.put("errorType", e.getClass().getName());
            
            StringWriter sw = new StringWriter();
            PrintWriter pw = new PrintWriter(sw);
            e.printStackTrace(pw);
            response.put("stackTrace", sw.toString());
        }

        return ResponseEntity.ok(response);
    }
}
