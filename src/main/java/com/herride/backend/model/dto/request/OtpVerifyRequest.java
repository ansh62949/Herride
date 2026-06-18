package com.herride.backend.model.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OtpVerifyRequest {
    @NotBlank(message = "Phone number is required")
    private String phone;

    @NotBlank(message = "OTP is required")
    private String otp;

    // Registration fields (used if the user is not registered yet)
    private String firstName;
    private String lastName;
    private String email;
    private String role; // "RIDER" or "DRIVER"
    private String gender; // "FEMALE" (enforced for riders and drivers)
}

