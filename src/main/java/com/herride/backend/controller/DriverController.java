package com.herride.backend.controller;

import com.herride.backend.model.dto.request.DriverProfileRequest;
import com.herride.backend.model.dto.request.LocationUpdateRequest;
import com.herride.backend.model.dto.response.ApiResponse;
import com.herride.backend.model.dto.response.DriverProfileResponse;
import com.herride.backend.model.dto.response.NearbyDriverResponse;
import com.herride.backend.model.enums.DriverStatus;
import com.herride.backend.model.enums.VehicleType;
import com.herride.backend.service.DriverProfileService;
import com.herride.backend.service.LocationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/drivers")
@RequiredArgsConstructor
public class DriverController {

    private final DriverProfileService driverProfileService;
    private final LocationService locationService;

    @PostMapping("/profile")
    @PreAuthorize("hasAnyRole('DRIVER', 'RIDER')")
    public ResponseEntity<ApiResponse<DriverProfileResponse>> createProfile(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody DriverProfileRequest request) {
        DriverProfileResponse response = driverProfileService.createProfile(
                userDetails.getUsername(), request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Driver profile created", response));
    }

    @GetMapping("/profile")
    @PreAuthorize("hasAnyRole('DRIVER', 'RIDER')")
    public ResponseEntity<ApiResponse<DriverProfileResponse>> getProfile(
            @AuthenticationPrincipal UserDetails userDetails) {
        DriverProfileResponse response = driverProfileService.getProfile(userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success("Driver profile retrieved", response));
    }

    @PatchMapping("/status")
    @PreAuthorize("hasRole('DRIVER')")
    public ResponseEntity<ApiResponse<DriverProfileResponse>> updateStatus(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam DriverStatus status) {
        DriverProfileResponse response = driverProfileService.updateStatus(
                userDetails.getUsername(), status);
        return ResponseEntity.ok(ApiResponse.success("Status updated to " + status, response));
    }

    @PostMapping("/location")
    @PreAuthorize("hasRole('DRIVER')")
    public ResponseEntity<ApiResponse<Void>> updateLocation(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody LocationUpdateRequest request) {
        driverProfileService.updateLocation(userDetails.getUsername(), request);
        return ResponseEntity.ok(ApiResponse.success("Location updated", null));
    }

    @GetMapping("/nearby")
    @PreAuthorize("hasRole('RIDER')")
    public ResponseEntity<ApiResponse<List<NearbyDriverResponse>>> findNearbyDrivers(
            @RequestParam Double latitude,
            @RequestParam Double longitude,
            @RequestParam(defaultValue = "5.0") Double radiusKm,
            @RequestParam(required = false) VehicleType vehicleType) {
        List<NearbyDriverResponse> drivers = locationService.findNearbyDrivers(
                latitude, longitude, radiusKm, vehicleType);
        return ResponseEntity.ok(ApiResponse.success(
                drivers.size() + " driver(s) found nearby", drivers));
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN') and principal.username == 'admin@herride.com'")
    public ResponseEntity<ApiResponse<List<DriverProfileResponse>>> getAllDrivers() {
        List<DriverProfileResponse> response = driverProfileService.getAllDrivers();
        return ResponseEntity.ok(ApiResponse.success("All drivers retrieved", response));
    }

    @GetMapping("/pending")
    @PreAuthorize("hasRole('ADMIN') and principal.username == 'admin@herride.com'")
    public ResponseEntity<ApiResponse<List<DriverProfileResponse>>> getPendingDrivers() {
        List<DriverProfileResponse> response = driverProfileService.getPendingDrivers();
        return ResponseEntity.ok(ApiResponse.success("Pending drivers retrieved", response));
    }

    @PostMapping("/approve")
    @PreAuthorize("hasRole('ADMIN') and principal.username == 'admin@herride.com'")
    public ResponseEntity<ApiResponse<DriverProfileResponse>> approveDriver(
            @RequestParam Long driverId) {
        DriverProfileResponse response = driverProfileService.approveDriver(driverId);
        return ResponseEntity.ok(ApiResponse.success("Driver approved successfully", response));
    }

    @PostMapping("/reject")
    @PreAuthorize("hasRole('ADMIN') and principal.username == 'admin@herride.com'")
    public ResponseEntity<ApiResponse<DriverProfileResponse>> rejectDriver(
            @RequestParam Long driverId) {
        DriverProfileResponse response = driverProfileService.rejectDriver(driverId);
        return ResponseEntity.ok(ApiResponse.success("Driver rejected successfully", response));
    }
}

