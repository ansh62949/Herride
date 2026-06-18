package com.herride.backend.model.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class IncidentReportRequest {

    @NotNull(message = "Trip ID is required")
    private Long tripId;

    @NotBlank(message = "Category is required")
    private String category; // UNSAFE_DRIVING, HARASSMENT, VEHICLE_ISSUE, OTHER

    @NotBlank(message = "Description is required")
    private String description;
}

