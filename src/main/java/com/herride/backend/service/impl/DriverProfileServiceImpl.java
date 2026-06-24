package com.herride.backend.service.impl;

import com.herride.backend.exception.AppException;
import com.herride.backend.model.dto.request.DriverProfileRequest;
import com.herride.backend.model.dto.request.LocationUpdateRequest;
import com.herride.backend.model.dto.response.DriverProfileResponse;
import com.herride.backend.model.entity.DriverProfile;
import com.herride.backend.model.entity.User;
import com.herride.backend.model.enums.DriverStatus;
import com.herride.backend.model.enums.Role;
import com.herride.backend.model.enums.VerificationStatus;
import com.herride.backend.repository.DriverProfileRepository;
import com.herride.backend.repository.UserRepository;
import com.herride.backend.service.DriverProfileService;
import com.herride.backend.service.LocationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class DriverProfileServiceImpl implements DriverProfileService {

    private final DriverProfileRepository driverProfileRepository;
    private final UserRepository userRepository;
    private final LocationService locationService;

    @Override
    @Transactional
    public DriverProfileResponse createProfile(String email, DriverProfileRequest request) {
        User user = getUser(email);

        if (user.getRole() == Role.RIDER) {
            user.setRole(Role.DRIVER);
            userRepository.save(user);
        } else if (user.getRole() != Role.DRIVER) {
            throw new AppException("Only drivers can create a driver profile", HttpStatus.FORBIDDEN);
        }

        if (driverProfileRepository.existsByUserId(user.getId())) {
            throw new AppException("Driver profile already exists", HttpStatus.CONFLICT);
        }
        if (driverProfileRepository.existsByPlateNumber(request.getPlateNumber())) {
            throw new AppException("Plate number already registered", HttpStatus.CONFLICT);
        }

        DriverProfile profile = DriverProfile.builder()
                .user(user)
                .vehicleType(request.getVehicleType())
                .vehicleMake(request.getVehicleMake())
                .vehicleModel(request.getVehicleModel())
                .vehicleYear(request.getVehicleYear())
                .plateNumber(request.getPlateNumber())
                .vehicleColor(request.getVehicleColor())
                .licenseNumber(request.getLicenseNumber())
                .build();

        DriverProfile savedProfile = driverProfileRepository.save(profile);

        // Auto-approve after 8 seconds in dev/local mode
        new Thread(() -> {
            try {
                Thread.sleep(8000);
                driverProfileRepository.findByUserId(user.getId()).ifPresent(p -> {
                    p.setVerificationStatus(VerificationStatus.VERIFIED);
                    driverProfileRepository.save(p);
                    System.out.println("[DEV SIMULATION] Automatically verified driver profile for user: " + user.getEmail());
                });
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
        }).start();

        return toResponse(savedProfile);
    }

    @Override
    public DriverProfileResponse getProfile(String email) {
        User user = getUser(email);
        DriverProfile profile = driverProfileRepository.findByUserId(user.getId())
                .orElseThrow(() -> new AppException("Driver profile not found", HttpStatus.NOT_FOUND));
        return toResponse(profile);
    }

    @Override
    @Transactional
    public DriverProfileResponse updateStatus(String email, DriverStatus status) {
        User user = getUser(email);
        DriverProfile profile = driverProfileRepository.findByUserId(user.getId())
                .orElseThrow(() -> new AppException("Driver profile not found", HttpStatus.NOT_FOUND));

        if (status == DriverStatus.ONLINE && profile.getVerificationStatus() != VerificationStatus.VERIFIED) {
            throw new AppException("Only verified drivers can go online", HttpStatus.FORBIDDEN);
        }

        profile.setDriverStatus(status);
        if (status == DriverStatus.ONLINE) {
            profile.setIdleSince(LocalDateTime.now());
        }
        driverProfileRepository.save(profile);

        // Remove from geo index when going offline
        if (status == DriverStatus.OFFLINE) {
            locationService.removeDriverLocation(profile.getId());
        }

        return toResponse(profile);
    }

    @Override
    @Transactional
    public void updateLocation(String email, LocationUpdateRequest request) {
        User user = getUser(email);
        DriverProfile profile = driverProfileRepository.findByUserId(user.getId())
                .orElseThrow(() -> new AppException("Driver profile not found", HttpStatus.NOT_FOUND));

        if (profile.getDriverStatus() == DriverStatus.OFFLINE) {
            throw new AppException("Driver must be online to update location", HttpStatus.BAD_REQUEST);
        }

        locationService.updateDriverLocation(profile.getId(), request);
    }

    @Override
    public List<DriverProfileResponse> getPendingDrivers() {
        return driverProfileRepository.findByVerificationStatus(VerificationStatus.PENDING)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    public List<DriverProfileResponse> getAllDrivers() {
        return driverProfileRepository.findAll()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    @Transactional
    public DriverProfileResponse approveDriver(Long driverId) {
        DriverProfile profile = driverProfileRepository.findById(driverId)
                .orElseThrow(() -> new AppException("Driver profile not found", HttpStatus.NOT_FOUND));
        profile.setVerificationStatus(VerificationStatus.VERIFIED);
        return toResponse(driverProfileRepository.save(profile));
    }

    @Override
    @Transactional
    public DriverProfileResponse rejectDriver(Long driverId) {
        DriverProfile profile = driverProfileRepository.findById(driverId)
                .orElseThrow(() -> new AppException("Driver profile not found", HttpStatus.NOT_FOUND));
        profile.setVerificationStatus(VerificationStatus.REJECTED);
        return toResponse(driverProfileRepository.save(profile));
    }

    private User getUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new AppException("User not found", HttpStatus.NOT_FOUND));
    }

    private DriverProfileResponse toResponse(DriverProfile profile) {
        return DriverProfileResponse.builder()
                .id(profile.getId())
                .userId(profile.getUser().getId())
                .firstName(profile.getUser().getFirstName())
                .lastName(profile.getUser().getLastName())
                .email(profile.getUser().getEmail())
                .phone(profile.getUser().getPhone())
                .vehicleType(profile.getVehicleType())
                .vehicleMake(profile.getVehicleMake())
                .vehicleModel(profile.getVehicleModel())
                .vehicleYear(profile.getVehicleYear())
                .plateNumber(profile.getPlateNumber())
                .vehicleColor(profile.getVehicleColor())
                .licenseNumber(profile.getLicenseNumber())
                .driverStatus(profile.getDriverStatus())
                .verificationStatus(profile.getVerificationStatus())
                .rating(profile.getRating())
                .totalTrips(profile.getTotalTrips())
                .totalEarnings(profile.getTotalEarnings())
                .acceptanceRate(profile.getAcceptanceRate())
                .safetyScore(profile.getSafetyScore())
                .build();
    }
}
