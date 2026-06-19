package com.herride.backend.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.data.redis.LettuceClientConfigurationBuilderCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.serializer.GenericJackson2JsonRedisSerializer;
import org.springframework.data.redis.serializer.StringRedisSerializer;

@Configuration
public class RedisConfig {

    @Value("${spring.data.redis.host:localhost}")
    private String redisHost;

    @Value("${spring.data.redis.url:}")
    private String redisUrl;

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

    @Bean
    public LettuceClientConfigurationBuilderCustomizer lettuceClientCustomizer() {
        return builder -> {
            boolean isRemoteHost = !"localhost".equals(redisHost) && !"127.0.0.1".equals(redisHost);
            boolean isRemoteUrl = redisUrl != null && !redisUrl.isEmpty() && !redisUrl.contains("localhost") && !redisUrl.contains("127.0.0.1");
            if (isRemoteHost || isRemoteUrl) {
                builder.useSsl().disablePeerVerification();
            }
        };
    }
}
