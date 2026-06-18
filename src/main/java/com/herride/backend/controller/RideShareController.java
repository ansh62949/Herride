package com.herride.backend.controller;

import com.herride.backend.model.dto.response.ApiResponse;
import com.herride.backend.model.dto.response.RideShareDetailsResponse;
import com.herride.backend.service.TripService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/ride")
@RequiredArgsConstructor
public class RideShareController {

    private final TripService tripService;

    @PostMapping("/share")
    public ResponseEntity<ApiResponse<String>> shareRide(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam Long tripId) {
        String token = tripService.generateShareToken(userDetails.getUsername(), tripId);
        String shareUrl = "/api/v1/ride/share/" + token;
        return ResponseEntity.ok(ApiResponse.success("Ride tracking link generated successfully", shareUrl));
    }

    @GetMapping("/share/{token}")
    public ResponseEntity<ApiResponse<RideShareDetailsResponse>> getSharedRideDetails(
            @PathVariable String token) {
        RideShareDetailsResponse details = tripService.getRideShareDetails(token);
        return ResponseEntity.ok(ApiResponse.success("Shared ride details retrieved", details));
    }
}

