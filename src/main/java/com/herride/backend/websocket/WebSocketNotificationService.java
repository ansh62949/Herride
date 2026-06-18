package com.herride.backend.websocket;

import com.herride.backend.model.dto.response.TripResponse;
import com.herride.backend.repository.UserRepository;
import com.herride.backend.websocket.event.DriverLocationEvent;
import com.herride.backend.websocket.event.ChatMessageEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class WebSocketNotificationService {

    private final SimpMessagingTemplate messagingTemplate;
    private final UserRepository userRepository;

    // Push trip status update to a specific rider
    public void notifyRiderTripStatus(Long riderId, TripResponse event) {
        userRepository.findById(riderId).ifPresent(user -> {
            String destination = "/queue/trip-status";
            messagingTemplate.convertAndSendToUser(
                    user.getEmail(),
                    destination,
                    event
            );
            log.info("Trip status {} sent to rider {}", event.getStatus(), user.getEmail());
        });
    }

    // Push trip status update to a specific driver
    public void notifyDriverTripStatus(Long driverId, TripResponse event) {
        userRepository.findById(driverId).ifPresent(user -> {
            String destination = "/queue/trip-status";
            messagingTemplate.convertAndSendToUser(
                    user.getEmail(),
                    destination,
                    event
            );
            log.info("Trip status {} sent to driver {}", event.getStatus(), user.getEmail());
        });
    }

    // Push driver live location to rider during a trip
    public void notifyRiderDriverLocation(Long riderId, DriverLocationEvent event) {
        userRepository.findById(riderId).ifPresent(user -> {
            messagingTemplate.convertAndSendToUser(
                    user.getEmail(),
                    "/queue/driver-location",
                    event
            );
        });
    }

    // Broadcast new trip request to nearby drivers
    public void notifyDriverNewTripRequest(Long driverId, TripResponse event) {
        userRepository.findById(driverId).ifPresent(user -> {
            messagingTemplate.convertAndSendToUser(
                    user.getEmail(),
                    "/queue/trip-request",
                    event
            );
            log.info("New trip request {} sent to driver {}", event.getId(), user.getEmail());
        });
    }

    // Broadcast to all subscribers of a trip channel
    public void broadcastTripUpdate(Long tripId, TripResponse event) {
        messagingTemplate.convertAndSend("/topic/trips/" + tripId, event);
    }

    public void broadcastChatMessage(Long tripId, ChatMessageEvent event) {
        messagingTemplate.convertAndSend("/topic/trips/" + tripId + "/chat", event);
    }
}
