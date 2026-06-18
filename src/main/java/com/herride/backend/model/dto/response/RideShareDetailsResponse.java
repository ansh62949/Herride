package com.herride.backend.model.dto.response;

import com.herride.backend.model.enums.TripStatus;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class RideShareDetailsResponse {
    private Long tripId;
    private TripStatus status;
    private String riderName;
    private String driverName;
    private String driverPhone;
    private String vehicleMake;
    private String vehicleModel;
    private String vehicleColor;
    private String plateNumber;
    private Double driverRating;
    private Double currentLatitude;
    private Double currentLongitude;
    private String pickupAddress;
    private String destinationAddress;
    private Double distanceKm;
    private Double etaMinutes;
}

