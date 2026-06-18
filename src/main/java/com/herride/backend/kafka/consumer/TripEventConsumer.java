package com.herride.backend.kafka.consumer;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.herride.backend.kafka.KafkaTopicConfig;
import com.herride.backend.model.dto.response.TripResponse;
import com.herride.backend.repository.DriverProfileRepository;
import com.herride.backend.service.SmsService;
import com.herride.backend.websocket.WebSocketNotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class TripEventConsumer {

    private final WebSocketNotificationService notificationService;
    private final SmsService smsService;
    private final DriverProfileRepository driverProfileRepository;
    private final ObjectMapper objectMapper;

    @KafkaListener(topics = KafkaTopicConfig.TRIP_REQUESTED_TOPIC,
            groupId = "HerRide-group")
    public void onTripRequested(String message) {
        try {
            TripResponse trip = objectMapper.readValue(message, TripResponse.class);
            log.info("Consumed trip.requested: tripId={}", trip.getId());

            if (trip.getDriverId() != null) {
                notificationService.notifyDriverNewTripRequest(trip.getDriverId(), trip);
            }
        } catch (Exception e) {
            log.error("Error processing trip.requested: {}", e.getMessage());
        }
    }

    @KafkaListener(topics = KafkaTopicConfig.TRIP_ACCEPTED_TOPIC,
            groupId = "HerRide-group")
    public void onTripAccepted(String message) {
        try {
            TripResponse trip = objectMapper.readValue(message, TripResponse.class);
            log.info("Consumed trip.accepted: tripId={}", trip.getId());

            notificationService.notifyRiderTripStatus(trip.getRiderId(), trip);
            notificationService.broadcastTripUpdate(trip.getId(), trip);

            // SMS notifications
            String plateNumber = trip.getPlateNumber() != null ? trip.getPlateNumber() : "N/A";
            smsService.notifyTripAccepted(
                    trip.getRiderPhone(),
                    trip.getRiderName(),
                    trip.getDriverName(),
                    plateNumber
            );
            if (trip.getDriverPhone() != null) {
                smsService.notifyDriverTripAccepted(
                        trip.getDriverPhone(),
                        trip.getRiderName(),
                        trip.getPickupAddress()
                );
            }

        } catch (Exception e) {
            log.error("Error processing trip.accepted: {}", e.getMessage());
        }
    }

    @KafkaListener(topics = KafkaTopicConfig.TRIP_COMPLETED_TOPIC,
            groupId = "HerRide-group")
    public void onTripCompleted(String message) {
        try {
            TripResponse trip = objectMapper.readValue(message, TripResponse.class);
            log.info("Consumed trip.completed: tripId={}", trip.getId());

            notificationService.notifyRiderTripStatus(trip.getRiderId(), trip);
            if (trip.getDriverId() != null) {
                notificationService.notifyDriverTripStatus(trip.getDriverId(), trip);
            }
            notificationService.broadcastTripUpdate(trip.getId(), trip);

            // SMS notifications
            smsService.notifyTripCompleted(
                    trip.getRiderPhone(),
                    trip.getRiderName(),
                    trip.getActualFare(),
                    trip.getDistanceKm()
            );
            if (trip.getDriverPhone() != null && trip.getDriverEarnings() != null) {
                smsService.notifyDriverTripCompleted(
                        trip.getDriverPhone(),
                        trip.getDriverName(),
                        trip.getDriverEarnings()
                );
            }

        } catch (Exception e) {
            log.error("Error processing trip.completed: {}", e.getMessage());
        }
    }

    @KafkaListener(topics = KafkaTopicConfig.TRIP_CANCELLED_TOPIC,
            groupId = "HerRide-group")
    public void onTripCancelled(String message) {
        try {
            TripResponse trip = objectMapper.readValue(message, TripResponse.class);
            log.info("Consumed trip.cancelled: tripId={}", trip.getId());

            notificationService.notifyRiderTripStatus(trip.getRiderId(), trip);
            if (trip.getDriverId() != null) {
                notificationService.notifyDriverTripStatus(trip.getDriverId(), trip);
            }

            // SMS notifications
            String reason = trip.getCancellationReason() != null
                    ? trip.getCancellationReason().name() : "Unknown";

            smsService.notifyTripCancelled(
                    trip.getRiderPhone(), trip.getRiderName(), reason);

            if (trip.getDriverPhone() != null && trip.getDriverName() != null) {
                smsService.notifyTripCancelled(
                        trip.getDriverPhone(), trip.getDriverName(), reason);
            }

        } catch (Exception e) {
            log.error("Error processing trip.cancelled: {}", e.getMessage());
        }
    }

    @KafkaListener(topics = KafkaTopicConfig.TRIP_STATUS_UPDATED_TOPIC,
            groupId = "HerRide-group")
    public void onTripStatusUpdated(String message) {
        try {
            TripResponse trip = objectMapper.readValue(message, TripResponse.class);
            log.info("Consumed trip.status.updated: tripId={} status={}",
                    trip.getId(), trip.getStatus());

            String smsMessage = switch (trip.getStatus()) {
                case DRIVER_ARRIVING -> "Your driver is on the way to your pickup location!";
                case RIDER_PICKED -> "Your driver has arrived and you have been picked up!";
                case IN_PROGRESS -> "Your trip has started. Destination: "
                        + trip.getDestinationAddress();
                default -> null;
            };

            // Push WebSocket update to both rider and driver
            notificationService.notifyRiderTripStatus(trip.getRiderId(), trip);
            if (trip.getDriverId() != null) {
                notificationService.notifyDriverTripStatus(trip.getDriverId(), trip);
            }
            notificationService.broadcastTripUpdate(trip.getId(), trip);

            // Send SMS to rider
            if (smsMessage != null && trip.getRiderPhone() != null) {
                smsService.sendSms(trip.getRiderPhone(), smsMessage);
            }

        } catch (Exception e) {
            log.error("Error processing trip.status.updated: {}", e.getMessage());
        }
    }
}
