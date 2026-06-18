package com.herride.backend.model.dto.response;

import com.herride.backend.model.enums.Gender;
import com.herride.backend.model.enums.Role;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class AuthResponse {
    private Long userId;
    private String firstName;
    private String lastName;
    private String email;
    private String phone;
    private Role role;
    private Gender gender;
    private String accessToken;
    private String refreshToken;
}
