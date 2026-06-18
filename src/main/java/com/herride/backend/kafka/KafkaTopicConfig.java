package com.herride.backend.kafka;

import org.apache.kafka.clients.admin.NewTopic;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.config.TopicBuilder;

@Configuration
public class KafkaTopicConfig {

    public static final String TRIP_REQUESTED_TOPIC = "trip.requested";
    public static final String TRIP_ACCEPTED_TOPIC = "trip.accepted";
    public static final String TRIP_COMPLETED_TOPIC = "trip.completed";
    public static final String TRIP_CANCELLED_TOPIC = "trip.cancelled";
    public static final String TRIP_STATUS_UPDATED_TOPIC = "trip.status.updated";
    public static final String SOS_TRIGGERED_TOPIC = "sos.triggered";


    @Bean
    public NewTopic tripRequestedTopic() {
        return TopicBuilder.name(TRIP_REQUESTED_TOPIC).partitions(3).replicas(1).build();
    }

    @Bean
    public NewTopic tripAcceptedTopic() {
        return TopicBuilder.name(TRIP_ACCEPTED_TOPIC).partitions(3).replicas(1).build();
    }

    @Bean
    public NewTopic tripCompletedTopic() {
        return TopicBuilder.name(TRIP_COMPLETED_TOPIC).partitions(3).replicas(1).build();
    }

    @Bean
    public NewTopic tripCancelledTopic() {
        return TopicBuilder.name(TRIP_CANCELLED_TOPIC).partitions(3).replicas(1).build();
    }

    @Bean
    public NewTopic tripStatusUpdatedTopic() {
        return TopicBuilder.name(TRIP_STATUS_UPDATED_TOPIC).partitions(3).replicas(1).build();
    }

    @Bean
    public NewTopic sosTriggeredTopic() {
        return TopicBuilder.name(SOS_TRIGGERED_TOPIC).partitions(3).replicas(1).build();
    }

    @Bean
    public NewTopic tripRequestedDlq() {
        return TopicBuilder.name(TRIP_REQUESTED_TOPIC + ".DLQ").partitions(1).replicas(1).build();
    }

    @Bean
    public NewTopic tripAcceptedDlq() {
        return TopicBuilder.name(TRIP_ACCEPTED_TOPIC + ".DLQ").partitions(1).replicas(1).build();
    }

    @Bean
    public NewTopic tripCompletedDlq() {
        return TopicBuilder.name(TRIP_COMPLETED_TOPIC + ".DLQ").partitions(1).replicas(1).build();
    }

    @Bean
    public NewTopic tripCancelledDlq() {
        return TopicBuilder.name(TRIP_CANCELLED_TOPIC + ".DLQ").partitions(1).replicas(1).build();
    }

    @Bean
    public NewTopic tripStatusUpdatedDlq() {
        return TopicBuilder.name(TRIP_STATUS_UPDATED_TOPIC + ".DLQ").partitions(1).replicas(1).build();
    }
}
