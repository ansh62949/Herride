package com.herride.backend.model.dto.request;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class PaystackInitRequest {

    @JsonProperty("email")
    private String email;

    // Paystack/Gateway accepts amount in minor units (paise/kobo)
    @JsonProperty("amount")
    private Long amount;

    @JsonProperty("reference")
    private String reference;

    @JsonProperty("currency")
    @Builder.Default
    private String currency = "INR";

    @JsonProperty("metadata")
    private Object metadata;
}
