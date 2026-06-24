package com.herride.backend.kafka.producer;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.herride.backend.kafka.KafkaTopicConfig;
import com.herride.backend.model.dto.response.SosAlertResponse;
import com.herride.backend.model.dto.response.TripResponse;
import com.herride.backend.event.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class TripEventProducer {

    private final KafkaTemplate<String, String> kafkaTemplate;
    private final ObjectMapper objectMapper;
    private final ApplicationEventPublisher eventPublisher;

    public void publishTripRequested(TripResponse trip) {
        try {
            eventPublisher.publishEvent(new LocalTripRequestedEvent(trip));
        } catch (Exception e) {
            log.error("Failed to publish local LocalTripRequestedEvent for tripId={}: {}", trip.getId(), e.getMessage());
        }
        publish(KafkaTopicConfig.TRIP_REQUESTED_TOPIC, trip);
    }

    public void publishTripAccepted(TripResponse trip) {
        try {
            eventPublisher.publishEvent(new LocalTripAcceptedEvent(trip));
        } catch (Exception e) {
            log.error("Failed to publish local LocalTripAcceptedEvent for tripId={}: {}", trip.getId(), e.getMessage());
        }
        publish(KafkaTopicConfig.TRIP_ACCEPTED_TOPIC, trip);
    }

    public void publishTripCompleted(TripResponse trip) {
        try {
            eventPublisher.publishEvent(new LocalTripCompletedEvent(trip));
        } catch (Exception e) {
            log.error("Failed to publish local LocalTripCompletedEvent for tripId={}: {}", trip.getId(), e.getMessage());
        }
        publish(KafkaTopicConfig.TRIP_COMPLETED_TOPIC, trip);
    }

    public void publishTripCancelled(TripResponse trip) {
        try {
            eventPublisher.publishEvent(new LocalTripCancelledEvent(trip));
        } catch (Exception e) {
            log.error("Failed to publish local LocalTripCancelledEvent for tripId={}: {}", trip.getId(), e.getMessage());
        }
        publish(KafkaTopicConfig.TRIP_CANCELLED_TOPIC, trip);
    }

    @org.springframework.beans.factory.annotation.Value("${app.kafka.enabled:true}")
    private boolean kafkaEnabled;

    public void publishSosTriggered(SosAlertResponse alert) {
        try {
            eventPublisher.publishEvent(new LocalSosTriggeredEvent(alert));
        } catch (Exception e) {
            log.error("Failed to publish local LocalSosTriggeredEvent for alertId={}: {}", alert.getId(), e.getMessage());
        }
        if (!kafkaEnabled) {
            log.info("Kafka is disabled. Skipping publish of SOS alert to Kafka.");
            return;
        }
        try {
            String payload = objectMapper.writeValueAsString(alert);
            kafkaTemplate.send(KafkaTopicConfig.SOS_TRIGGERED_TOPIC, alert.getId().toString(), payload);
            log.info("Published to {}: alertId={}", KafkaTopicConfig.SOS_TRIGGERED_TOPIC, alert.getId());
        } catch (Exception e) {
            log.error("Failed to publish SOS alert event to Kafka for alertId={}: {}",
                    alert.getId(), e.getMessage());
        }
    }

    private void publish(String topic, TripResponse trip) {
        if (!kafkaEnabled) {
            log.info("Kafka is disabled. Skipping publish to topic: {}", topic);
            return;
        }
        try {
            String payload = objectMapper.writeValueAsString(trip);
            kafkaTemplate.send(topic, trip.getId().toString(), payload);
            log.info("Published to {}: tripId={}", topic, trip.getId());
        } catch (Exception e) {
            log.error("Failed to publish event to Kafka topic {} for tripId={}: {}",
                    topic, trip.getId(), e.getMessage());
        }
    }

    public void publishTripStatusUpdated(TripResponse trip) {
        try {
            eventPublisher.publishEvent(new LocalTripStatusUpdatedEvent(trip));
        } catch (Exception e) {
            log.error("Failed to publish local LocalTripStatusUpdatedEvent for tripId={}: {}", trip.getId(), e.getMessage());
        }
        publish(KafkaTopicConfig.TRIP_STATUS_UPDATED_TOPIC, trip);
    }
}
