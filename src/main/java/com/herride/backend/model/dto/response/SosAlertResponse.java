package com.herride.backend.model.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class SosAlertResponse {
    private Long id;
    private Long rideId;
    private Long userId;
    private String riderName;
    private String phone;
    private Double latitude;
    private Double longitude;
    private String status;
    private LocalDateTime createdAt;
}

