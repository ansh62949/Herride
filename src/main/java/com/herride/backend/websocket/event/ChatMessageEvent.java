package com.herride.backend.websocket.event;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChatMessageEvent {
    private Long tripId;
    private String sender; // "RIDER" or "DRIVER"
    private String text;
    private String senderName;
    private LocalDateTime timestamp;
}

