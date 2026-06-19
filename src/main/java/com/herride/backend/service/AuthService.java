package com.herride.backend.service;

import com.herride.backend.model.dto.request.LoginRequest;
import com.herride.backend.model.dto.request.RefreshTokenRequest;
import com.herride.backend.model.dto.request.RegisterRequest;
import com.herride.backend.model.dto.request.OtpVerifyRequest;
import com.herride.backend.model.dto.response.AuthResponse;
import com.herride.backend.model.dto.response.OtpSendResponse;

public interface AuthService {
    AuthResponse register(RegisterRequest request);
    AuthResponse login(LoginRequest request);
    AuthResponse refreshToken(RefreshTokenRequest request);
    void logout(String email);
    OtpSendResponse sendOtp(String phone);
    AuthResponse verifyOtpAndLogin(OtpVerifyRequest request);
    void resetAdminPassword();
}
