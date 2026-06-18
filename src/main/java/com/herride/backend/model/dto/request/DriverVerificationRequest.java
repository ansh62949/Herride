package com.herride.backend.model.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class DriverVerificationRequest {
    @NotNull(message = "Driver ID is required")
    private Long driverId;
}

