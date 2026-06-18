package com.herride.backend.model.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class IncidentReportResponse {
    private Long id;
    private Long rideId;
    private Long reporterId;
    private String category;
    private String description;
    private String status;
    private LocalDateTime createdAt;
}

