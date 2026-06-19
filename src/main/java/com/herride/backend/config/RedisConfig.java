package com.herride.backend.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.connection.RedisStandaloneConfiguration;
import org.springframework.data.redis.connection.lettuce.LettuceClientConfiguration;
import org.springframework.data.redis.connection.lettuce.LettuceConnectionFactory;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.serializer.GenericJackson2JsonRedisSerializer;
import org.springframework.data.redis.serializer.StringRedisSerializer;
import java.net.URI;

@Configuration
public class RedisConfig {

    @Value("${spring.data.redis.host:localhost}")
    private String redisHost;

    @Value("${spring.data.redis.port:6379}")
    private int redisPort;

    @Value("${spring.data.redis.password:}")
    private String redisPassword;

    @Value("${REDIS_URL:}")
    private String redisUrlEnv;

    @Bean
    public RedisConnectionFactory redisConnectionFactory() {
        RedisStandaloneConfiguration config;
        boolean useSsl = false;
        String host = redisHost;
        int port = redisPort;
        String password = redisPassword;

        if (redisUrlEnv != null && !redisUrlEnv.isEmpty()) {
            System.out.println("[RedisConfig] Configuring Lettuce using REDIS_URL environment variable");
            try {
                URI uri = new URI(redisUrlEnv);
                host = uri.getHost();
                port = uri.getPort();
                String userInfo = uri.getUserInfo();
                if (userInfo != null && userInfo.contains(":")) {
                    password = userInfo.split(":")[1];
                } else if (userInfo != null) {
                    password = userInfo;
                }
                if ("rediss".equalsIgnoreCase(uri.getScheme())) {
                    useSsl = true;
                }
            } catch (Exception e) {
                System.err.println("[RedisConfig] Failed to parse REDIS_URL: " + e.getMessage());
            }
        } else {
            System.out.println("[RedisConfig] Configuring Lettuce using standard host/port properties");
            if (!"localhost".equals(redisHost) && !"127.0.0.1".equals(redisHost)) {
                useSsl = true;
            }
        }

        System.out.println("[RedisConfig] Connecting to Redis host: " + host + ", port: " + port + ", useSsl: " + useSsl);

        config = new RedisStandaloneConfiguration(host, port);
        if (password != null && !password.isEmpty()) {
            config.setPassword(password);
        }

        LettuceClientConfiguration.LettuceClientConfigurationBuilder builder = LettuceClientConfiguration.builder();
        if (useSsl) {
            builder.useSsl().disablePeerVerification();
        }

        return new LettuceConnectionFactory(config, builder.build());
    }

    @Bean
    public RedisTemplate<String, Object> redisTemplate(RedisConnectionFactory factory) {
        RedisTemplate<String, Object> template = new RedisTemplate<>();
        template.setConnectionFactory(factory);
        template.setKeySerializer(new StringRedisSerializer());
        template.setValueSerializer(new GenericJackson2JsonRedisSerializer());
        template.setHashKeySerializer(new StringRedisSerializer());
        template.setHashValueSerializer(new GenericJackson2JsonRedisSerializer());
        template.afterPropertiesSet();
        return template;
    }
}
