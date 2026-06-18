package com.herride.backend.config;

import lombok.extern.slf4j.Slf4j;
import org.apache.kafka.common.TopicPartition;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.annotation.EnableKafka;
import org.springframework.kafka.listener.CommonErrorHandler;
import org.springframework.kafka.listener.DeadLetterPublishingRecoverer;
import org.springframework.kafka.listener.DefaultErrorHandler;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.util.backoff.FixedBackOff;

@Slf4j
@Configuration
@EnableKafka
public class KafkaConsumerConfig {

    @Bean
    public CommonErrorHandler errorHandler(KafkaTemplate<Object, Object> template) {
        // Sends failed consumer records to their respective topic.DLQ topic
        DeadLetterPublishingRecoverer recoverer = new DeadLetterPublishingRecoverer(template,
                (r, e) -> {
                    log.error("Failed to consume message from topic={}, partition={}. Routing to DLQ.", 
                            r.topic(), r.partition(), e);
                    return new TopicPartition(r.topic() + ".DLQ", r.partition());
                });

        // 2 retries, 1000ms delay between retries
        return new DefaultErrorHandler(recoverer, new FixedBackOff(1000L, 2L));
    }
}

