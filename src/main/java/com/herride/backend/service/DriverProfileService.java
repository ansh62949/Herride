package com.herride.backend.service;

import com.herride.backend.model.dto.request.DriverProfileRequest;
import com.herride.backend.model.dto.request.LocationUpdateRequest;
import com.herride.backend.model.dto.response.DriverProfileResponse;
import com.herride.backend.model.enums.DriverStatus;

public interface DriverProfileService {
    DriverProfileResponse createProfile(String email, DriverProfileRequest request);
    DriverProfileResponse getProfile(String email);
    DriverProfileResponse updateStatus(String email, DriverStatus status);
    void updateLocation(String email, LocationUpdateRequest request);
    java.util.List<DriverProfileResponse> getPendingDrivers();
    java.util.List<DriverProfileResponse> getAllDrivers();
    DriverProfileResponse approveDriver(Long driverId);
    DriverProfileResponse rejectDriver(Long driverId);
}
