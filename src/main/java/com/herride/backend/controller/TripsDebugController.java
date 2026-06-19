package com.herride.backend.controller;

import com.herride.backend.model.entity.DriverProfile;
import com.herride.backend.model.entity.Trip;
import com.herride.backend.repository.DriverProfileRepository;
import com.herride.backend.repository.TripRepository;
import com.herride.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/auth")
public class TripsDebugController {

    private final TripRepository tripRepository;
    private final DriverProfileRepository driverProfileRepository;
    private final UserRepository userRepository;

    @GetMapping("/trips-debug")
    public ResponseEntity<Map<String, Object>> debugTrips(@RequestParam(required = false) Long tripId,
                                                          @RequestParam(required = false) String driverEmail) {
        Map<String, Object> response = new HashMap<>();

        // 1. General trip stats
        long tripCount = tripRepository.count();
        response.put("totalTrips", tripCount);

        List<Map<String, Object>> tripsList = tripRepository.findAll().stream().map(t -> {
            Map<String, Object> m = new HashMap<>();
            m.put("id", t.getId());
            m.put("status", t.getStatus());
            m.put("riderEmail", t.getRider().getEmail());
            m.put("driverEmail", t.getDriver() != null ? t.getDriver().getEmail() : "null");
            return m;
        }).collect(Collectors.toList());
        response.put("trips", tripsList);

        // 2. Specific trip
        if (tripId != null) {
            Trip t = tripRepository.findById(tripId).orElse(null);
            if (t != null) {
                Map<String, Object> details = new HashMap<>();
                details.put("id", t.getId());
                details.put("status", t.getStatus());
                details.put("rider", t.getRider().getEmail());
                details.put("driver", t.getDriver() != null ? t.getDriver().getEmail() : "null");
                details.put("vehicleType", t.getVehicleType());
                response.put("tripDetails", details);
            } else {
                response.put("tripDetails", "Not Found");
            }
        }

        // 3. Driver profiles stats
        long driverProfilesCount = driverProfileRepository.count();
        response.put("totalDriverProfiles", driverProfilesCount);

        List<Map<String, Object>> driversList = driverProfileRepository.findAll().stream().map(d -> {
            Map<String, Object> m = new HashMap<>();
            m.put("driverId", d.getId());
            m.put("userId", d.getUser().getId());
            m.put("email", d.getUser().getEmail());
            m.put("verificationStatus", d.getVerificationStatus());
            m.put("driverStatus", d.getDriverStatus());
            m.put("gender", d.getUser().getGender());
            return m;
        }).collect(Collectors.toList());
        response.put("driverProfiles", driversList);

        // 4. Specific driver check
        if (driverEmail != null) {
            userRepository.findByEmail(driverEmail).ifPresent(user -> {
                Map<String, Object> userMap = new HashMap<>();
                userMap.put("userId", user.getId());
                userMap.put("email", user.getEmail());
                userMap.put("gender", user.getGender());
                userMap.put("role", user.getRole());
                
                DriverProfile profile = driverProfileRepository.findByUserId(user.getId()).orElse(null);
                if (profile != null) {
                    Map<String, Object> profMap = new HashMap<>();
                    profMap.put("profileId", profile.getId());
                    profMap.put("verificationStatus", profile.getVerificationStatus());
                    profMap.put("driverStatus", profile.getDriverStatus());
                    userMap.put("profile", profMap);
                } else {
                    userMap.put("profile", "Not Found");
                }
                response.put("driverUserCheck", userMap);
            });
        }

        return ResponseEntity.ok(response);
    }
}
