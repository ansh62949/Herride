package com.herride.backend.model.dto.response;

import com.herride.backend.model.enums.DriverStatus;
import com.herride.backend.model.enums.VehicleType;
import com.herride.backend.model.enums.VerificationStatus;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class DriverProfileResponse {
    private Long id;
    private Long userId;
    private String firstName;
    private String lastName;
    private String email;
    private String phone;
    private VehicleType vehicleType;
    private String vehicleMake;
    private String vehicleModel;
    private String vehicleYear;
    private String plateNumber;
    private String vehicleColor;
    private String licenseNumber;
    private DriverStatus driverStatus;
    private VerificationStatus verificationStatus;
    private Double rating;
    private Integer totalTrips;
    private Double totalEarnings;
    private Double acceptanceRate;
    private Double safetyScore;
}
