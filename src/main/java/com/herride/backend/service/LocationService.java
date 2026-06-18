package com.herride.backend.service;

import com.herride.backend.model.dto.request.LocationUpdateRequest;
import com.herride.backend.model.dto.response.NearbyDriverResponse;
import com.herride.backend.model.enums.VehicleType;

import java.util.List;

public interface LocationService {
    void updateDriverLocation(Long driverId, LocationUpdateRequest request);
    List<NearbyDriverResponse> findNearbyDrivers(Double latitude, Double longitude,
                                                 Double radiusKm, VehicleType vehicleType);
    void removeDriverLocation(Long driverId);
}
