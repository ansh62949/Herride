package com.herride.backend.websocket;

import com.herride.backend.model.dto.request.LocationUpdateRequest;
import com.herride.backend.service.DriverProfileService;
import com.herride.backend.websocket.event.DriverLocationEvent;
import com.herride.backend.websocket.event.ChatMessageEvent;
import com.herride.backend.service.ChatService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.stereotype.Controller;

import java.security.Principal;
import java.time.LocalDateTime;

@Slf4j
@Controller
@RequiredArgsConstructor
public class WebSocketController {

    private final DriverProfileService driverProfileService;
    private final WebSocketNotificationService notificationService;
    private final ChatService chatService;

    // Driver sends location update via WebSocket
    // Client sends to: /app/driver.location
    @MessageMapping("driver.location")
    public void updateDriverLocation(@Payload DriverLocationEvent event,
                                     Principal principal) {
        if (principal == null) return;

        String email = principal.getName();
        log.info("WS location update from driver {}: {}, {}",
                email, event.getLatitude(), event.getLongitude());

        // Update location in Redis
        LocationUpdateRequest request = new LocationUpdateRequest();
        request.setLatitude(event.getLatitude());
        request.setLongitude(event.getLongitude());
        driverProfileService.updateLocation(email, request);

        // If driver is on a trip, push live location to rider
        if (event.getTripId() != null && event.getRiderId() != null) {
            DriverLocationEvent locationEvent = DriverLocationEvent.builder()
                    .driverId(event.getDriverId())
                    .tripId(event.getTripId())
                    .latitude(event.getLatitude())
                    .longitude(event.getLongitude())
                    .timestamp(LocalDateTime.now())
                    .build();

            notificationService.notifyRiderDriverLocation(event.getRiderId(), locationEvent);
        }
    }

    // Chat messages routed via WebSocket
    @MessageMapping("chat.message")
    public void handleChatMessage(@Payload ChatMessageEvent event) {
        log.info("Chat message for trip {}: {}", event.getTripId(), event.getText());
        event.setTimestamp(LocalDateTime.now());
        chatService.addMessage(event.getTripId(), event);
        notificationService.broadcastChatMessage(event.getTripId(), event);
    }
}
