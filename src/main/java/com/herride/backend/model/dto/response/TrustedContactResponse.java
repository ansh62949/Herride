package com.herride.backend.model.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class TrustedContactResponse {
    private Long id;
    private Long userId;
    private String name;
    private String phone;
    private String relationship;
}

