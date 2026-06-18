package com.herride.backend.model.dto.request;

import com.herride.backend.model.enums.CancellationReason;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class CancelTripRequest {

    @NotNull(message = "Cancellation reason is required")
    private CancellationReason reason;

    private String note;
}
